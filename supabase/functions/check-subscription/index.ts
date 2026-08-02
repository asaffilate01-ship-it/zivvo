import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createStripeClient, resolveStripeEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const PRICE_TO_TIER: Record<string, string> = {
  price_de_dealer_pro: "dealer_pro",
};

const unsubscribed = () =>
  new Response(
    JSON.stringify({ subscribed: false, tier: null, subscription_end: null }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
  );

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return unsubscribed();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) {
      logStep("Auth failed", { err: userError?.message });
      return unsubscribed();
    }
    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = createStripeClient(resolveStripeEnv());
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (!customers.data || customers.data.length === 0) {
      logStep("No customer found");
      return unsubscribed();
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subs.data && subs.data.length > 0;
    let tier: string | null = null;
    let subscriptionEnd: string | null = null;

    if (hasActiveSub) {
      const subscription = subs.data[0];
      const item = subscription.items.data[0];
      const periodEnd = (item as any)?.current_period_end ?? (subscription as any).current_period_end;
      subscriptionEnd = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
      const lookupKey = item?.price?.lookup_key || item?.price?.id;
      tier = PRICE_TO_TIER[lookupKey as string] || "dealer_pro";
      logStep("Active subscription found", { tier, subscriptionEnd });
    }

    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        tier,
        subscription_end: subscriptionEnd,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    // Always return 200 with unsubscribed to avoid blocking the frontend
    return new Response(
      JSON.stringify({ subscribed: false, tier: null, subscription_end: null, error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
