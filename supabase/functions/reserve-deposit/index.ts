import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { listing_id, dealer_id, buyer_name, buyer_email, buyer_phone, amount } = await req.json();

    if (!listing_id || !dealer_id || !buyer_name || !buyer_email || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const amt = Number(amount);
    if (isNaN(amt) || amt < 50 || amt > 5000) {
      return new Response(JSON.stringify({ error: "Amount must be between £50 and £5000" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Payments not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // Look up listing for description
    const { data: listing } = await supabase.from("car_listings").select("title,make,model,year").eq("id", listing_id).maybeSingle();
    const desc = listing ? `${listing.year} ${listing.make} ${listing.model}` : "Vehicle reservation";

    // Create reservation row first
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: reservation, error: insErr } = await supabase
      .from("reservation_deposits")
      .insert({
        dealer_id, listing_id, buyer_name, buyer_email, buyer_phone: buyer_phone || null,
        amount: amt, currency: "gbp", status: "pending", expires_at: expires,
      })
      .select()
      .single();

    if (insErr || !reservation) {
      return new Response(JSON.stringify({ error: insErr?.message || "Could not create reservation" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const origin = req.headers.get("origin") || "https://autosouq.app";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: buyer_email,
      line_items: [{
        price_data: {
          currency: "gbp",
          product_data: { name: `Refundable Deposit — ${desc}`, description: "Reserves this vehicle for 7 days. Fully refundable." },
          unit_amount: Math.round(amt * 100),
        },
        quantity: 1,
      }],
      metadata: { reservation_id: reservation.id, dealer_id, listing_id },
      success_url: `${origin}/car/${listing_id}?reservation=success`,
      cancel_url: `${origin}/car/${listing_id}?reservation=cancelled`,
    });

    await supabase.from("reservation_deposits").update({ stripe_session_id: session.id }).eq("id", reservation.id);

    return new Response(JSON.stringify({ url: session.url, reservation_id: reservation.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
