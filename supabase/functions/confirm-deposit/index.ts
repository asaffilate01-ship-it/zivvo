import { createStripeClient, resolveStripeEnv } from "../_shared/stripe.ts";
import { AUCTION_DEPOSIT_CENTS, CURRENCY } from "../_shared/payments.ts";
import {
  HttpError,
  json,
  parseJson,
  preflight,
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
    const { user, admin } = await requireUser(req);
    const body = await parseJson(req);
    const depositId = requireUuid(body.deposit_id, "deposit_id");
    const paymentIntentId = typeof body.payment_intent_id === "string" ? body.payment_intent_id : "";
    if (!paymentIntentId.startsWith("pi_")) throw new HttpError(400, "payment_intent_id is invalid");

    const { data: deposit, error } = await admin
      .from("auction_deposits")
      .select("id,auction_id,user_id,status,amount,currency,stripe_payment_intent_id")
      .eq("id", depositId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!deposit) throw new HttpError(404, "Deposit not found");
    if (deposit.stripe_payment_intent_id !== paymentIntentId) throw new HttpError(409, "Payment reference does not match");

    const stripe = createStripeClient(resolveStripeEnv());
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const verified = intent.status === "requires_capture" &&
      intent.amount === AUCTION_DEPOSIT_CENTS &&
      intent.currency === CURRENCY &&
      intent.metadata.type === "auction_deposit" &&
      intent.metadata.auction_id === deposit.auction_id &&
      intent.metadata.user_id === user.id;
    if (!verified) throw new HttpError(409, "Stripe has not authorised this deposit");

    if (deposit.status === "authorized") return json(req, { success: true, already_authorized: true });
    if (deposit.status !== "pending") throw new HttpError(409, "Deposit cannot be authorised");

    const { data: updated, error: updateError } = await admin
      .from("auction_deposits")
      .update({ status: "authorized", authorized_at: new Date().toISOString() })
      .eq("id", depositId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) throw new HttpError(409, "Deposit state changed; refresh and try again");

    return json(req, { success: true });
  } catch (error) {
    return safeError(req, error);
  }
});
