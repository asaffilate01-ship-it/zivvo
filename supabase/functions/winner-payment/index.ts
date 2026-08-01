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
    const auctionId = requireUuid(body.auction_id, "auction_id");
    const { data: escrow } = await admin.from("auction_escrow").select("id,auction_id,buyer_id,total_amount,status").eq("auction_id", auctionId).eq("buyer_id", user.id).maybeSingle();
    if (!escrow) throw new HttpError(404, "Payment record not found");
    if (escrow.status === "full_payment_held") return json(req, { already_paid: true });
    if (escrow.status !== "pending_deposit" && escrow.status !== "deposit_held") throw new HttpError(409, "Payment is not currently available");
    const { data: deposit } = await admin.from("auction_deposits").select("id,amount,status,stripe_payment_intent_id").eq("auction_id", auctionId).eq("user_id", user.id).eq("status", "authorized").maybeSingle();
    const depositAmount = deposit ? Number(deposit.amount) : 0;
    const remainingCents = Math.round((Number(escrow.total_amount) - depositAmount) * 100);
    if (!Number.isSafeInteger(remainingCents) || remainingCents < 50) throw new HttpError(409, "Invalid outstanding balance");
    const stripe = new Stripe(env("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email, mode: "payment",
      line_items: [{ price_data: { currency: CURRENCY, unit_amount: remainingCents, product_data: { name: "Auktionszahlung – Restbetrag", description: `Auktion ${auctionId.slice(0, 8)}` } }, quantity: 1 }],
      success_url: appUrl(`/auction/${auctionId}?payment=success`), cancel_url: appUrl(`/auction/${auctionId}?payment=cancelled`),
      metadata: {
        type: "auction_winner_payment", auction_id: auctionId, escrow_id: escrow.id, buyer_id: user.id,
        deposit_id: deposit?.id || "", deposit_payment_intent_id: deposit?.stripe_payment_intent_id || "",
        expected_amount: String(remainingCents), currency: CURRENCY,
      },
    }, { idempotencyKey });
    return json(req, { url: session.url, remaining_balance: remainingCents / 100 });
  } catch (error) { return safeError(req, error); }
});
