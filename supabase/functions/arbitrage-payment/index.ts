import { createStripeClient, resolveStripeEnv } from "../_shared/stripe.ts";
import { checkoutMetadata, CURRENCY } from "../_shared/payments.ts";
import {
  appUrl,
  HttpError,
  json,
  parseJson,
  preflight,
  requireIdempotencyKey,
  requirePost,
  requireUser,
  requireUuid,
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
    const dealId = requireUuid(body.deal_id, "deal_id");
    const { data: deal, error: dealError } = await admin
      .from("arbitrage_deals")
      .select("id,status,buyer_dealer_id,dealer_price,dealer_paid_at,dealer_payment_ref,country,car_listings!inner(title,make,model,year)")
      .eq("id", dealId)
      .maybeSingle();
    if (dealError) throw dealError;
    if (!deal || deal.status !== "dealer_accepted" || deal.dealer_paid_at) throw new HttpError(409, "Deal is not ready for payment");
    if (deal.country !== "DE") throw new HttpError(409, "Only EUR trade deals can be paid");

    const { data: dealer, error: dealerError } = await admin
      .from("dealers")
      .select("id,stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (dealerError) throw dealerError;
    if (!dealer || dealer.id !== deal.buyer_dealer_id) throw new HttpError(403, "You are not the accepting dealer");

    const amountCents = Math.round(Number(deal.dealer_price) * 100);
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) throw new HttpError(409, "Deal amount is invalid");
    const stripe = createStripeClient(resolveStripeEnv());
    if (deal.dealer_payment_ref?.startsWith("cs_")) {
      const existing = await stripe.checkout.sessions.retrieve(deal.dealer_payment_ref);
      if (existing.status === "open" && existing.url) return json(req, { url: existing.url });
      if (existing.payment_status === "paid") throw new HttpError(409, "Payment is already being reconciled");
    }

    let customerId = dealer.stripe_customer_id;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 10 });
      customerId = customers.data.find((customer) => customer.metadata.userId === user.id)?.id || null;
    }
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } }, { idempotencyKey: `dealer-customer:${user.id}` });
      customerId = customer.id;
    }

    const listing = Array.isArray(deal.car_listings) ? deal.car_listings[0] : deal.car_listings;
    const title = listing ? `${listing.year} ${listing.make} ${listing.model}` : "Fahrzeug";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price_data: {
          currency: CURRENCY,
          product_data: { name: `Händlerankauf – ${title}`, description: "Zivvo Trade-Stock-Kauf" },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: appUrl(`/trade-stock?payment=success&deal=${dealId}`),
      cancel_url: appUrl("/trade-stock?payment=cancelled"),
      metadata: checkoutMetadata("arbitrage_dealer_payment", amountCents, {
        deal_id: dealId,
        dealer_id: dealer.id,
        user_id: user.id,
      }),
    }, { idempotencyKey: `trade-payment:${dealer.id}:${dealId}:${idempotencyKey}` });

    const { error: updateError } = await admin.from("arbitrage_deals")
      .update({ dealer_payment_ref: session.id })
      .eq("id", dealId)
      .eq("status", "dealer_accepted")
      .is("dealer_paid_at", null);
    if (updateError) throw updateError;
    await admin.from("arbitrage_audit_log").insert({
      deal_id: dealId,
      actor_id: user.id,
      actor_role: "dealer",
      action: "payment_initiated",
      details: { session_id: session.id, amount_cents: amountCents, currency: CURRENCY },
    });

    return json(req, { url: session.url });
  } catch (error) {
    return safeError(req, error);
  }
});
