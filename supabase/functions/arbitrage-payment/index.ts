import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (!user?.email) throw new Error("Authentication required");

    const { deal_id } = await req.json();
    if (!deal_id) throw new Error("deal_id required");

    // Get the deal
    const { data: deal } = await supabaseAdmin
      .from("arbitrage_deals")
      .select("*, car_listings!inner(title, make, model, year)")
      .eq("id", deal_id)
      .single();

    if (!deal) throw new Error("Deal not found");
    if (deal.status !== "dealer_accepted") throw new Error("Deal is not ready for payment");

    // Verify user is the accepting dealer
    const { data: dealer } = await supabaseAdmin
      .from("dealers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!dealer || dealer.id !== deal.buyer_dealer_id) {
      throw new Error("You are not the accepting dealer for this deal");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
    }

    const listing = deal.car_listings;
    const title = `${listing.year} ${listing.make} ${listing.model}`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price_data: {
          currency: "gbp",
          product_data: {
            name: `Trade Stock Purchase — ${title}`,
            description: `Wholesale purchase of ${title} via platform arbitrage`,
          },
          unit_amount: Math.round(deal.dealer_price * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/trade-stock?payment=success&deal=${deal_id}`,
      cancel_url: `${req.headers.get("origin")}/trade-stock?payment=cancelled`,
      metadata: {
        deal_id,
        dealer_id: dealer.id,
        type: "arbitrage_dealer_payment",
      },
    });

    // Update deal with payment ref
    await supabaseAdmin.from("arbitrage_deals").update({
      dealer_payment_ref: session.id,
    }).eq("id", deal_id);

    // Audit log
    await supabaseAdmin.from("arbitrage_audit_log").insert({
      deal_id,
      actor_id: user.id,
      actor_role: "dealer",
      action: "payment_initiated",
      details: { session_id: session.id, amount: deal.dealer_price },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
