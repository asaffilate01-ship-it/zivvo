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

    const { auction_id } = await req.json();
    if (!auction_id) throw new Error("auction_id required");

    // Get auction + escrow
    const { data: escrow } = await supabaseAdmin
      .from("auction_escrow")
      .select("*")
      .eq("auction_id", auction_id)
      .eq("buyer_id", user.id)
      .single();

    if (!escrow) throw new Error("No payment protection record found");
    if (escrow.status !== "pending_deposit") throw new Error("Payment already processed");

    // Get deposit (to capture the pre-auth)
    const { data: deposit } = await supabaseAdmin
      .from("auction_deposits")
      .select("*")
      .eq("auction_id", auction_id)
      .eq("user_id", user.id)
      .eq("status", "authorized")
      .maybeSingle();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // If there's a pre-auth deposit, capture it first
    let depositCaptured = 0;
    if (deposit?.stripe_payment_intent_id) {
      try {
        await stripe.paymentIntents.capture(deposit.stripe_payment_intent_id);
        depositCaptured = Number(deposit.amount);
        await supabaseAdmin.from("auction_deposits").update({
          status: "captured",
          captured_at: new Date().toISOString(),
        }).eq("id", deposit.id);
      } catch (e) {
        console.log("Deposit capture skipped:", e);
      }
    }

    // Calculate remaining balance
    const remainingBalance = Number(escrow.total_amount) - depositCaptured;

    if (remainingBalance <= 0) {
      // Fully covered by deposit
      await supabaseAdmin.from("auction_escrow").update({
        status: "full_payment_held",
      }).eq("id", escrow.id);

      return new Response(JSON.stringify({ success: true, fully_paid: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create checkout for remaining balance
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price_data: {
          currency: "gbp",
          product_data: {
            name: `Auction Payment — Balance Due`,
            description: `Remaining balance for auction ${auction_id.slice(0, 8)}`,
          },
          unit_amount: Math.round(remainingBalance * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/auction/${auction_id}?payment=success`,
      cancel_url: `${req.headers.get("origin")}/auction/${auction_id}?payment=cancelled`,
      metadata: {
        auction_id,
        escrow_id: escrow.id,
        buyer_id: user.id,
        type: "auction_winner_payment",
      },
    });

    return new Response(JSON.stringify({ url: session.url, remaining_balance: remainingBalance }), {
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
