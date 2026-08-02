import { createStripeClient, resolveStripeEnv } from "../_shared/stripe.ts";
import { CURRENCY, subscriptionCatalog } from "../_shared/payments.ts";
import {
  appUrl,
  HttpError,
  json,
  optionalString,
  parseJson,
  preflight,
  requireIdempotencyKey,
  requirePost,
  requireUser,
  safeError,
} from "../_shared/security.ts";

Deno.serve(async (req) => {
  try {
    const options = preflight(req);
    if (options) return options;
    requirePost(req);
    const idempotencyKey = requireIdempotencyKey(req);
    const { user, admin } = await requireUser(req);
    if (!user.email) throw new HttpError(400, "A verified email address is required");

    const body = await parseJson(req);
    const priceLookupKey = typeof body.priceId === "string" ? body.priceId : "";
    const plan = subscriptionCatalog()[priceLookupKey];
    if (!plan) throw new HttpError(400, "Unknown dealer plan");
    const businessName = optionalString(body.businessName, 120);
    if (!businessName) throw new HttpError(400, "Business name is required");

    const { data: existingDealer, error: dealerError } = await admin
      .from("dealers")
      .select("id,stripe_customer_id,subscription_status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (dealerError) throw dealerError;
    if (existingDealer && ["active", "trialing"].includes(existingDealer.subscription_status || "")) {
      throw new HttpError(409, "Dealer subscription is already active");
    }

    const stripe = createStripeClient(resolveStripeEnv());
    const prices = await stripe.prices.list({ lookup_keys: [priceLookupKey], active: true, limit: 2 });
    const stripePrice = prices.data.find((price) => price.lookup_key === priceLookupKey);
    if (
      !stripePrice ||
      stripePrice.type !== "recurring" ||
      stripePrice.currency !== CURRENCY ||
      stripePrice.unit_amount !== plan.amountCents ||
      stripePrice.recurring?.interval !== plan.interval ||
      stripePrice.recurring?.interval_count !== 1
    ) {
      throw new HttpError(503, "Dealer plan is not configured correctly");
    }

    let customerId = existingDealer?.stripe_customer_id || null;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 10 });
      customerId = customers.data.find((customer) => customer.metadata.userId === user.id)?.id || null;
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      }, { idempotencyKey: `dealer-customer:${user.id}` });
      customerId = customer.id;
    }

    const metadata = {
      type: "dealer_subscription",
      user_id: user.id,
      price_lookup_key: priceLookupKey,
      business_name: businessName,
      currency: CURRENCY,
    };
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: "subscription",
      success_url: appUrl("/dashboard?checkout=success"),
      cancel_url: appUrl("/dealers?checkout=cancelled"),
      metadata,
      subscription_data: { metadata, trial_period_days: plan.trialDays },
    }, { idempotencyKey: `dealer-subscription:${user.id}:${priceLookupKey}:${idempotencyKey}` });

    return json(req, { url: session.url });
  } catch (error) {
    return safeError(req, error);
  }
});
