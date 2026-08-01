import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { env, HttpError, json, parseJson, preflight, requirePost, requireUser, requireUuid, safeError } from "../_shared/security.ts";
import { AUCTION_DEPOSIT_CENTS, CURRENCY } from "../_shared/payments.ts";

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const { user, admin } = await requireUser(req);
    const body = await parseJson(req);
    const depositId = requireUuid(body.deposit_id, "deposit_id");
    const { data: deposit } = await admin.from("auction_deposits").select("id,auction_id,user_id,status,stripe_payment_intent_id").eq("id", depositId).eq("user_id", user.id).maybeSingle();
    if (!deposit?.stripe_payment_intent_id) throw new HttpError(404, "Deposit not found");
    if (deposit.status === "authorized") return json(req, { success: true });
    const stripe = new Stripe(env("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });
    const intent = await stripe.paymentIntents.retrieve(deposit.stripe_payment_intent_id);
    const valid = intent.status === "requires_capture" && intent.amount === AUCTION_DEPOSIT_CENTS && intent.currency === CURRENCY && intent.metadata.auction_id === deposit.auction_id && intent.metadata.user_id === user.id;
    if (!valid) throw new HttpError(409, "Deposit authorization could not be verified");
    const { error } = await admin.from("auction_deposits").update({ status: "authorized", authorized_at: new Date().toISOString() }).eq("id", deposit.id).eq("status", "pending");
    if (error) throw error;
    return json(req, { success: true });
  } catch (error) { return safeError(req, error); }
});
