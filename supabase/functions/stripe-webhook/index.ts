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
        const businessName = session.metadata?.business_name || "My Dealership";
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (!userId) {
          logStep("ERROR: No user_id in session metadata");
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
        const priceId = subscription.items.data[0]?.price.id;
        const tierInfo = PRICE_TO_TIER[priceId] || { tier: "starter", maxListings: 15 };

        const statusMap: Record<string, string> = {
          active: "active",
          past_due: "past_due",
          canceled: "canceled",
          trialing: "trialing",
          incomplete: "incomplete",
        };

        const { error } = await supabase
          .from("dealers")
          .update({
            subscription_status: statusMap[subscription.status] || "incomplete",
            tier: tierInfo.tier,
            max_listings: tierInfo.maxListings,
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) logStep("ERROR updating subscription", { error: error.message });
        else logStep("Subscription updated", { status: subscription.status, tier: tierInfo.tier });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const { error } = await supabase
          .from("dealers")
          .update({ subscription_status: "canceled", is_active: false })
          .eq("stripe_subscription_id", subscription.id);

        if (error) logStep("ERROR deleting subscription", { error: error.message });
        else logStep("Subscription canceled");
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        logStep("Payment failed", { customerId, invoiceId: invoice.id });

        await supabase
          .from("dealers")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
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
