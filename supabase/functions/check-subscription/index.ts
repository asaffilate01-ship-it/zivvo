import { createStripeClient, resolveStripeEnv } from "../_shared/stripe.ts";
import { subscriptionCatalog } from "../_shared/payments.ts";
import { json, preflight, requirePost, requireUser, safeError } from "../_shared/security.ts";

const inactive = {
  subscribed: false,
  tier: null,
  subscription_end: null,
};

Deno.serve(async (req) => {
  try {
    const options = preflight(req);
    if (options) return options;
    requirePost(req);
    const { user, admin } = await requireUser(req);
    if (!user.email) return json(req, inactive);

    const { data: dealer, error: dealerError } = await admin
      .from("dealers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (dealerError) throw dealerError;

    const stripe = createStripeClient(resolveStripeEnv());
    let customerId = dealer?.stripe_customer_id || null;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 10 });
      customerId = customers.data.find((customer) => customer.metadata.userId === user.id)?.id || null;
    }
    if (!customerId) return json(req, inactive);

    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
    const subscription = subscriptions.data.find((candidate) => ["active", "trialing"].includes(candidate.status));
    if (!subscription) return json(req, inactive);

    const item = subscription.items.data[0];
    const lookupKey = item?.price?.lookup_key || "";
    const plan = subscriptionCatalog()[lookupKey];
    if (!plan) return json(req, inactive);
    const periodEnd = item?.current_period_end;

    return json(req, {
      subscribed: true,
      tier: plan.tier,
      subscription_end: periodEnd ? new Date(periodEnd * 1_000).toISOString() : null,
    });
  } catch (error) {
    return safeError(req, error);
  }
});
