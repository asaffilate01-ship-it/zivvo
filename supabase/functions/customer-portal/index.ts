import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createStripeClient, resolveStripeEnv } from "../_shared/stripe.ts";
import { appUrl, json, preflight, requirePost, requireUser, safeError } from "../_shared/security.ts";

serve(async (req) => {
  try {
    const options = preflight(req);
    if (options) return options;
    requirePost(req);

    const { user, admin } = await requireUser(req);
    const { data: dealer, error: dealerError } = await admin
      .from("dealers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (dealerError) throw dealerError;
    if (!dealer?.stripe_customer_id) {
      return json(req, {
        error: "NO_SUBSCRIPTION",
        message: "You don't have an active subscription yet. Please subscribe to a plan first.",
      });
    }

    const stripe = createStripeClient(resolveStripeEnv());
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: dealer.stripe_customer_id,
      return_url: appUrl("/dashboard"),
    });

    return json(req, { url: portalSession.url });
  } catch (error) {
    return safeError(req, error);
  }
});
