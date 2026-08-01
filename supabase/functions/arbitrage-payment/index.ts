import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { appUrl, env, HttpError, json, parseJson, preflight, requireIdempotencyKey, requirePost, requireUser, requireUuid, safeError } from "../_shared/security.ts";
import { CURRENCY } from "../_shared/payments.ts";

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const idempotencyKey = requireIdempotencyKey(req);
    const { user, admin } = await requireUser(req);
    if (!user.email) throw new HttpError(400, "Your account needs a verified email address");
    const body = await parseJson(req);
    const dealId = requireUuid(body.deal_id, "deal_id");
    const { data: dealer } = await admin.from("dealers").select("id,stripe_customer_id").eq("user_id", user.id).maybeSingle();
    if (!dealer) throw new HttpError(403, "Dealer account required");
    const { data: deal } = await admin.from("arbitrage_deals").select("id,buyer_dealer_id,dealer_price,status,dealer_paid_at,car_listings!inner(title,make,model,year)").eq("id", dealId).maybeSingle();
    if (!deal || deal.buyer_dealer_id !== dealer.id) throw new HttpError(404, "Trade deal not found");
    if (deal.dealer_paid_at) return json(req, { already_paid: true });
    if (deal.status !== "dealer_accepted") throw new HttpError(409, "Trade deal is not ready for payment");
    const cents = Math.round(Number(deal.dealer_price) * 100);
    if (!Number.isSafeInteger(cents) || cents < 100) throw new HttpError(409, "Invalid trade price");
    const listing = Array.isArray(deal.car_listings) ? deal.car_listings[0] : deal.car_listings;
    const stripe = new Stripe(env("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });
    const session = await stripe.checkout.sessions.create({
      customer: dealer.stripe_customer_id || undefined, customer_email: dealer.stripe_customer_id ? undefined : user.email, mode: "payment",
      line_items: [{ price_data: { currency: CURRENCY, unit_amount: cents, product_data: { name: `Händlerkauf – ${listing.year} ${listing.make} ${listing.model}`, description: "Verbindlicher Fahrzeugankauf über Zivvo" } }, quantity: 1 }],
      success_url: appUrl(`/trade-stock?payment=success&deal=${dealId}`), cancel_url: appUrl("/trade-stock?payment=cancelled"),
      metadata: { type: "arbitrage_dealer_payment", deal_id: dealId, dealer_id: dealer.id, user_id: user.id, expected_amount: String(cents), currency: CURRENCY },
    }, { idempotencyKey });
    await admin.from("arbitrage_deals").update({ dealer_payment_ref: session.id }).eq("id", dealId).is("dealer_paid_at", null);
    await admin.from("arbitrage_audit_log").insert({ deal_id: dealId, actor_id: user.id, actor_role: "dealer", action: "payment_initiated", details: { session_id: session.id, amount_cents: cents, currency: CURRENCY } });
    return json(req, { url: session.url });
  } catch (error) { return safeError(req, error); }
});
