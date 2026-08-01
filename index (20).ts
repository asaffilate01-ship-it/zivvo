import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { appUrl, HttpError, json, optionalString, parseJson, preflight, requireIdempotencyKey, requirePost, requireUser, safeError, env } from "../_shared/security.ts";
import { requireSubscriptionPrice } from "../_shared/payments.ts";

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const idempotencyKey = requireIdempotencyKey(req);
    const { user, admin } = await requireUser(req);
    if (!user.email) throw new HttpError(400, "Your account needs a verified email address");
    const body = await parseJson(req);
    const plan = requireSubscriptionPrice(body.priceId);
    const businessName = optionalString(body.businessName, 120) || "Mein Autohaus";
    const { data: dealer } = await admin.from("dealers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    const stripe = new Stripe(env("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });
    let customerId = dealer?.stripe_customer_id || null;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: businessName, metadata: { supabase_user_id: user.id } }, { idempotencyKey: `${idempotencyKey}-customer` });
      customerId = customer.id;
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: plan.priceId, quantity: 1 }],
      mode: "subscription",
      success_url: appUrl("/dashboard?checkout=success"),
      cancel_url: appUrl("/dealers?checkout=cancelled"),
      subscription_data: { trial_period_days: 60, metadata: { user_id: user.id, tier: plan.tier } },
      metadata: { type: "dealer_subscription", user_id: user.id, tier: plan.tier, business_name: businessName },
      allow_promotion_codes: true,
    }, { idempotencyKey });
    return json(req, { url: session.url });
  } catch (error) { return safeError(req, error); }
});
