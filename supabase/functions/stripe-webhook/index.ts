import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@22.0.2";
import { resolveStripeEnv, verifyWebhook } from "../_shared/stripe.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const PRICE_TO_TIER: Record<string, { tier: string; maxListings: number }> = {
  "price_1TBFMMFFogsDQVs4rwjRss69": { tier: "starter", maxListings: 15 },
  "price_1TBFMOFFogsDQVs4vv5Rx8lW": { tier: "professional", maxListings: 50 },
  "price_1TBFMOFFogsDQVs4y0kujRs8": { tier: "enterprise", maxListings: 9999 },
};

serve(async (req) => {
  const rawEnv = new URL(req.url).searchParams.get("env");
  const env = resolveStripeEnv(rawEnv);

  let event: any;
  try {
    event = await verifyWebhook(req, env);
  } catch (err: any) {
    logStep("Webhook signature verification failed", { error: err.message });
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  logStep("Event received", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const metaType = session.metadata?.type;

        // --- Boost payments (one-time) ---
        if (metaType === "boost" && session.mode === "payment") {
          const listingId = session.metadata!.listing_id;
          const days = parseInt(session.metadata!.days || "7");
          const promotedUntil = new Date();
          promotedUntil.setDate(promotedUntil.getDate() + days);

          const { error: boostErr } = await supabase
            .from("car_listings")
            .update({
              is_promoted: true,
              promoted_until: promotedUntil.toISOString(),
            })
            .eq("id", listingId);

          if (boostErr) logStep("ERROR boosting listing", { error: boostErr.message });
          else logStep("Listing boosted", { listingId, until: promotedUntil.toISOString() });

          if (userId) {
            await supabase.from("notifications").insert({
              user_id: userId,
              type: "boost",
              title: "Listing Boosted! 🚀",
              message: `Your listing is now promoted for ${days} days.`,
              link: `/car/${listingId}`,
            });
          }
          break;
        }

        // --- Inspection booking payment ---
        if (metaType === "inspection_booking" && session.mode === "payment") {
          const bookingId = session.metadata!.booking_id;
          logStep("Inspection payment completed", { bookingId });

          const { data: booking, error: bookErr } = await supabase
            .from("inspection_bookings")
            .update({
              status: "paid",
              stripe_payment_intent_id: (session.payment_intent as string) || null,
            })
            .eq("id", bookingId)
            .select("buyer_id, seller_id, listing_id")
            .single();

          if (bookErr) {
            logStep("ERROR updating inspection booking", { error: bookErr.message });
            break;
          }

          // Notify buyer
          await supabase.from("notifications").insert({
            user_id: booking.buyer_id,
            type: "inspection",
            title: "Inspection booked ✅",
            message: "Payment received. Our inspector will contact you within 24 hours to schedule.",
            link: "/inbox",
          });

          // Notify seller
          await supabase.from("notifications").insert({
            user_id: booking.seller_id,
            type: "inspection",
            title: "Inspection requested 🔍",
            message: "A buyer has booked an independent inspection on your listing. Inspector will be in touch.",
            link: `/car/${booking.listing_id}`,
          });

          // Notify admins
          const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
          if (admins) {
            for (const a of admins) {
              await supabase.from("notifications").insert({
                user_id: a.user_id,
                type: "inspection",
                title: "New inspection booking 🔧",
                message: "Assign an inspector and schedule the visit.",
                link: "/admin",
              });
            }
          }
          break;
        }

        // --- Arbitrage dealer payment ---
        if (metaType === "arbitrage_dealer_payment") {
          const dealId = session.metadata!.deal_id;
          const dealerId = session.metadata!.dealer_id;
          logStep("Arbitrage payment completed", { dealId, dealerId });

          const { error: arbErr } = await supabase
            .from("arbitrage_deals")
            .update({
              dealer_paid_at: new Date().toISOString(),
              dealer_payment_ref: (session.payment_intent as string) || session.id,
            })
            .eq("id", dealId);

          if (arbErr) {
            logStep("ERROR updating arbitrage deal payment", { error: arbErr.message });
          } else {
            logStep("Arbitrage deal payment recorded", { dealId });

            const { data: adminRoles } = await supabase
              .from("user_roles")
              .select("user_id")
              .eq("role", "admin");

            if (adminRoles) {
              for (const admin of adminRoles) {
                await supabase.from("notifications").insert({
                  user_id: admin.user_id,
                  type: "arbitrage",
                  title: "Dealer Payment Received 💰",
                  message: `Dealer payment completed for trade stock deal. Ready for seller payout.`,
                  link: "/trade-stock",
                });
              }
            }

            await supabase.from("arbitrage_audit_log").insert({
              deal_id: dealId,
              actor_role: "system",
              action: "dealer_payment_completed",
              details: { payment_intent: session.payment_intent, session_id: session.id },
            });
          }
          break;
        }

        // --- Auction winner payment ---
        if (metaType === "auction_winner_payment") {
          const auctionId = session.metadata!.auction_id;
          const escrowId = session.metadata!.escrow_id;
          const buyerId = session.metadata!.buyer_id;
          logStep("Auction winner payment completed", { auctionId, escrowId });

          await supabase.from("auction_escrow").update({
            status: "full_payment_held",
          }).eq("id", escrowId);

          await supabase.from("auction_audit_log").insert({
            auction_id: auctionId,
            actor_id: buyerId,
            actor_role: "buyer",
            action: "winner_payment_completed",
            details: { session_id: session.id, payment_intent: session.payment_intent },
          });

          if (buyerId) {
            await supabase.from("notifications").insert({
              user_id: buyerId,
              type: "auction",
              title: "Payment Received ✅",
              message: "Your auction payment has been received. Please sign the contract to proceed.",
              link: `/auction/${auctionId}`,
            });
          }
          break;
        }

        // --- Subscription checkout ---
        if (!userId) {
          logStep("ERROR: No user_id in session metadata");
          break;
        }

        const businessName = session.metadata?.business_name || "My Dealership";
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (!subscriptionId) {
          logStep("Non-subscription checkout without recognized type — skipping");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const tierInfo = PRICE_TO_TIER[priceId] || { tier: "starter", maxListings: 15 };

        logStep("Processing checkout", { userId, tier: tierInfo.tier, priceId });

        const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

        const { data: existing } = await supabase
          .from("dealers")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("dealers")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: "active",
              tier: tierInfo.tier,
              max_listings: tierInfo.maxListings,
              is_active: true,
            })
            .eq("user_id", userId);
          if (error) logStep("ERROR updating dealer", { error: error.message });
          else logStep("Dealer updated successfully");
        } else {
          const { error } = await supabase.from("dealers").insert({
            user_id: userId,
            business_name: businessName,
            slug: slug + "-" + Date.now(),
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
            tier: tierInfo.tier,
            max_listings: tierInfo.maxListings,
          });
          if (error) logStep("ERROR creating dealer", { error: error.message });
          else logStep("Dealer created successfully");
        }

        // Assign dealer + seller roles
        for (const role of ["dealer", "seller"]) {
          const { data: roleExists } = await supabase
            .from("user_roles")
            .select("id")
            .eq("user_id", userId)
            .eq("role", role)
            .maybeSingle();

          if (!roleExists) {
            await supabase.from("user_roles").insert({ user_id: userId, role });
            logStep(`Role "${role}" assigned`);
          }
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;
        const tierInfo = PRICE_TO_TIER[priceId] || { tier: "starter", maxListings: 15 };
        const status = subscription.status === "active" ? "active" : subscription.status === "past_due" ? "past_due" : "canceled";

        const { error } = await supabase
          .from("dealers")
          .update({
            subscription_status: status,
            tier: tierInfo.tier,
            max_listings: tierInfo.maxListings,
            is_active: status === "active",
          })
          .eq("stripe_customer_id", customerId);

        if (error) logStep("ERROR updating subscription", { error: error.message });
        else logStep("Subscription updated", { customerId, status, tier: tierInfo.tier });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { error } = await supabase
          .from("dealers")
          .update({
            subscription_status: "canceled",
            is_active: false,
          })
          .eq("stripe_customer_id", customerId);

        if (error) logStep("ERROR canceling subscription", { error: error.message });
        else logStep("Subscription canceled", { customerId });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }
  } catch (err: any) {
    logStep("Webhook handler error", { error: err.message });
    return new Response(`Handler Error: ${err.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
