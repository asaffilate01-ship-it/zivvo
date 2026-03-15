import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
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
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const businessName = session.metadata?.business_name || "My Dealership";
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        // Get subscription to find price/tier
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const tierInfo = PRICE_TO_TIER[priceId] || { tier: "starter", maxListings: 15 };

        // Upsert dealer record
        const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        
        const { data: existing } = await supabase
          .from("dealers")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("dealers")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: "active",
              tier: tierInfo.tier,
              max_listings: tierInfo.maxListings,
            })
            .eq("user_id", userId);
        } else {
          await supabase.from("dealers").insert({
            user_id: userId,
            business_name: businessName,
            slug: slug + "-" + Date.now(),
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
            tier: tierInfo.tier,
            max_listings: tierInfo.maxListings,
          });
        }

        // Assign dealer role
        const { data: roleExists } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .eq("role", "dealer")
          .maybeSingle();

        if (!roleExists) {
          await supabase.from("user_roles").insert({ user_id: userId, role: "dealer" });
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status;

        const statusMap: Record<string, string> = {
          active: "active",
          past_due: "past_due",
          canceled: "canceled",
          trialing: "trialing",
          incomplete: "incomplete",
        };

        await supabase
          .from("dealers")
          .update({ subscription_status: statusMap[status] || "incomplete" })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase
          .from("dealers")
          .update({ subscription_status: "canceled", is_active: false })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response(`Handler Error: ${err.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
