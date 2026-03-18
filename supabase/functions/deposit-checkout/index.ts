import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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

    const { auction_id, amount } = await req.json();
    if (!auction_id || !amount) throw new Error("auction_id and amount required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if user already has an authorized deposit for this auction
    const { data: existingDeposit } = await supabaseAdmin
      .from("auction_deposits")
      .select("*")
      .eq("auction_id", auction_id)
      .eq("user_id", user.id)
      .eq("status", "authorized")
      .maybeSingle();

    if (existingDeposit) {
      return new Response(JSON.stringify({ already_authorized: true, deposit_id: existingDeposit.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check/create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
    }

    // Create a PaymentIntent with capture_method: manual (pre-authorization)
    const depositAmount = Math.round(amount * 100); // Convert to pence/cents
    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositAmount,
      currency: "gbp",
      customer: customerId,
      capture_method: "manual", // Pre-auth only, don't capture yet
      metadata: {
        auction_id,
        user_id: user.id,
        type: "auction_deposit",
      },
    });

    // Create deposit record
    const { data: deposit, error: depositError } = await supabaseAdmin
      .from("auction_deposits")
      .insert({
        auction_id,
        user_id: user.id,
        amount,
        type: "card_preauth",
        status: "pending",
        stripe_payment_intent_id: paymentIntent.id,
      })
      .select()
      .single();

    if (depositError) throw depositError;

    return new Response(JSON.stringify({
      client_secret: paymentIntent.client_secret,
      deposit_id: deposit.id,
      payment_intent_id: paymentIntent.id,
    }), {
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
