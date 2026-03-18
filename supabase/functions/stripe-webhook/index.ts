import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2025-08-27.basil",
});

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
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
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

        if (!userId) {
          logStep("ERROR: No user_id in session metadata");
          break;
        }

        // Handle boost payments (one-time)
        if (session.metadata?.type === "boost" && session.mode === "payment") {
          const listingId = session.metadata.listing_id;
          const days = parseInt(session.metadata.days || "7");
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

          await supabase.from("notifications").insert({
            user_id: userId,
            type: "boost",
            title: "Listing Boosted! 🚀",
            message: `Your listing is now promoted for ${days} days.`,
            link: `/car/${listingId}`,
          });
          break;
        }

        // Handle subscription checkout
        const businessName = session.metadata?.business_name || "My Dealership";
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (!subscriptionId) {
          logStep("Non-subscription, non-boost checkout — skipping");
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

      // Handle arbitrage dealer payment
      case "checkout.session.completed": {
        const session2 = event.data.object as Stripe.Checkout.Session;
        if (session2.metadata?.type === "arbitrage_dealer_payment") {
          const dealId = session2.metadata.deal_id;
          const dealerId = session2.metadata.dealer_id;
          logStep("Arbitrage payment completed", { dealId, dealerId });

          // Update deal to seller_paid-ready state
          const { error: arbErr } = await supabase
            .from("arbitrage_deals")
            .update({
              dealer_paid_at: new Date().toISOString(),
              dealer_payment_ref: session2.payment_intent as string || session2.id,
            })
            .eq("id", dealId);

          if (arbErr) {
            logStep("ERROR updating arbitrage deal payment", { error: arbErr.message });
          } else {
            logStep("Arbitrage deal payment recorded", { dealId });

            // Notify admins
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

            // Audit log
            await supabase.from("arbitrage_audit_log").insert({
              deal_id: dealId,
              actor_role: "system",
              action: "dealer_payment_completed",
              details: { payment_intent: session2.payment_intent, session_id: session2.id },
            });
          }
          break;
        }
        // Fall through for non-arbitrage checkout.session.completed already handled above
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
