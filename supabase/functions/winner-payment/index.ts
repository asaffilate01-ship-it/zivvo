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
    requireIdempotencyKey(req);
    const { user, admin } = await requireUser(req);
    if (!user.email) throw new HttpError(400, "A verified email address is required");

    const body = await parseJson(req);
    const auctionId = requireUuid(body.auction_id, "auction_id");
    const { data: escrow, error: escrowError } = await admin
      .from("auction_escrow")
      .select("id,auction_id,buyer_id,total_amount,status")
      .eq("auction_id", auctionId)
      .eq("buyer_id", user.id)
      .maybeSingle();
    if (escrowError) throw escrowError;
    if (!escrow || !["pending_deposit", "deposit_held"].includes(escrow.status)) {
      throw new HttpError(409, "Winner payment is not available");
    }

    const { data: deposit, error: depositError } = await admin
      .from("auction_deposits")
      .select("id,amount,currency,status,type,stripe_payment_intent_id")
      .eq("auction_id", auctionId)
      .eq("user_id", user.id)
      .in("status", ["authorized", "captured"])
      .eq("type", "card_preauth")
      .maybeSingle();
    if (depositError) throw depositError;
    if (!deposit?.stripe_payment_intent_id) throw new HttpError(409, "A verified card deposit is required");

    const stripe = createStripeClient(resolveStripeEnv());
    const intent = await stripe.paymentIntents.retrieve(deposit.stripe_payment_intent_id);
    const validIntent = ["requires_capture", "succeeded"].includes(intent.status) && intent.currency === CURRENCY &&
      intent.metadata.type === "auction_deposit" && intent.metadata.auction_id === auctionId &&
      intent.metadata.user_id === user.id;
    if (!validIntent) throw new HttpError(409, "Auction deposit is no longer valid");

    const totalCents = Math.round(Number(escrow.total_amount) * 100);
    if (!Number.isSafeInteger(totalCents) || totalCents <= 0) throw new HttpError(409, "Auction total is invalid");
    if (intent.status === "succeeded") {
      if (intent.amount_received !== totalCents) throw new HttpError(409, "Winner payment is still being reconciled");
      const { error: repairDepositError } = await admin.from("auction_deposits").update({
        status: "captured",
        captured_at: new Date().toISOString(),
        captured_amount: intent.amount_received / 100,
      }).eq("id", deposit.id).in("status", ["authorized", "captured"]);
      if (repairDepositError) throw repairDepositError;
      const { error: repairEscrowError } = await admin.from("auction_escrow")
        .update({ status: "full_payment_held" })
        .eq("id", escrow.id)
        .eq("buyer_id", user.id)
        .in("status", ["pending_deposit", "deposit_held", "full_payment_held"]);
      if (repairEscrowError) throw repairEscrowError;
      return json(req, { success: true, fully_paid: true });
    }

    const captureCents = Math.min(intent.amount_capturable, totalCents);
    const remainingCents = totalCents - captureCents;

    if (remainingCents === 0) {
      await stripe.paymentIntents.capture(intent.id, { amount_to_capture: captureCents }, {
        idempotencyKey: `winner-deposit:${escrow.id}:${captureCents}`,
      });
      const { error: depositUpdateError } = await admin.from("auction_deposits").update({
        status: "captured",
        captured_at: new Date().toISOString(),
        captured_amount: captureCents / 100,
      }).eq("id", deposit.id).in("status", ["authorized", "captured"]);
      if (depositUpdateError) throw depositUpdateError;
      const { error: escrowUpdateError } = await admin.from("auction_escrow")
        .update({ status: "full_payment_held" })
        .eq("id", escrow.id)
        .eq("buyer_id", user.id)
        .in("status", ["pending_deposit", "deposit_held", "full_payment_held"]);
      if (escrowUpdateError) throw escrowUpdateError;
      await admin.from("auction_audit_log").insert({
        auction_id: auctionId,
        actor_id: user.id,
        actor_role: "buyer",
        action: "winner_payment_completed",
        details: { deposit_payment_intent: intent.id, captured_amount_cents: captureCents, currency: CURRENCY },
      });
      return json(req, { success: true, fully_paid: true });
    }

    const customers = await stripe.customers.list({ email: user.email, limit: 10 });
    let customerId = customers.data.find((customer) => customer.metadata.userId === user.id)?.id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } }, {
        idempotencyKey: `buyer-customer:${user.id}`,
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price_data: {
          currency: CURRENCY,
          product_data: {
            name: "Auktionskauf – Restbetrag",
            description: `Restzahlung für Auktion ${auctionId.slice(0, 8)}`,
          },
          unit_amount: remainingCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: appUrl(`/auction/${auctionId}?payment=success`),
      cancel_url: appUrl(`/auction/${auctionId}?payment=cancelled`),
      metadata: checkoutMetadata("auction_winner_payment", remainingCents, {
        auction_id: auctionId,
        escrow_id: escrow.id,
        buyer_id: user.id,
        user_id: user.id,
        deposit_id: deposit.id,
        deposit_payment_intent_id: intent.id,
        deposit_capture_amount: String(captureCents),
      }),
    }, { idempotencyKey: `winner-payment:${escrow.id}:${totalCents}` });

    return json(req, { url: session.url, remaining_balance: remainingCents / 100 });
  } catch (error) {
    return safeError(req, error);
  }
});
