import { createStripeClient, resolveStripeEnv } from "../_shared/stripe.ts";
import { AUCTION_DEPOSIT_CENTS, CURRENCY } from "../_shared/payments.ts";
import {
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
    const auctionId = requireUuid(body.auction_id, "auction_id");
    const { data: auction, error: auctionError } = await admin
      .from("auctions")
      .select("id,seller_id,status,ends_at")
      .eq("id", auctionId)
      .maybeSingle();
    if (auctionError) throw auctionError;
    if (!auction || auction.status !== "live" || (auction.ends_at && new Date(auction.ends_at) <= new Date())) {
      throw new HttpError(409, "Auction is not open for bidding");
    }
    if (auction.seller_id === user.id) throw new HttpError(403, "Sellers cannot bid on their own auction");

    const stripe = createStripeClient(resolveStripeEnv());
    const { data: existing, error: existingError } = await admin
      .from("auction_deposits")
      .select("id,status,stripe_payment_intent_id,amount,currency")
      .eq("auction_id", auctionId)
      .eq("user_id", user.id)
      .in("status", ["pending", "authorized"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing?.stripe_payment_intent_id) {
      const intent = await stripe.paymentIntents.retrieve(existing.stripe_payment_intent_id);
      const reusable = ["requires_payment_method", "requires_confirmation", "requires_action"].includes(intent.status);
      const valid = intent.amount === AUCTION_DEPOSIT_CENTS && intent.currency === CURRENCY &&
        intent.metadata.auction_id === auctionId && intent.metadata.user_id === user.id;
      if (existing.status === "authorized" && valid && intent.status === "requires_capture") {
        return json(req, { already_authorized: true, deposit_id: existing.id });
      }
      if (reusable && valid && intent.client_secret) {
        return json(req, {
          client_secret: intent.client_secret,
          deposit_id: existing.id,
          payment_intent_id: intent.id,
        });
      }
      await admin.from("auction_deposits").update({ status: "failed" }).eq("id", existing.id).in("status", ["pending", "authorized"]);
    }

    const customers = await stripe.customers.list({ email: user.email, limit: 10 });
    let customerId = customers.data.find((customer) => customer.metadata.userId === user.id)?.id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      }, { idempotencyKey: `auction-customer:${user.id}` });
      customerId = customer.id;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: AUCTION_DEPOSIT_CENTS,
      currency: CURRENCY,
      customer: customerId,
      capture_method: "manual",
      automatic_payment_methods: { enabled: true },
      metadata: {
        auction_id: auctionId,
        user_id: user.id,
        type: "auction_deposit",
        expected_amount: String(AUCTION_DEPOSIT_CENTS),
        currency: CURRENCY,
      },
    }, { idempotencyKey: `auction-deposit:${user.id}:${auctionId}:${idempotencyKey}` });

    const { data: deposit, error: depositError } = await admin
      .from("auction_deposits")
      .insert({
        auction_id: auctionId,
        user_id: user.id,
        amount: AUCTION_DEPOSIT_CENTS / 100,
        currency: CURRENCY.toUpperCase(),
        type: "card_preauth",
        status: "pending",
        stripe_payment_intent_id: paymentIntent.id,
      })
      .select("id")
      .single();
    if (depositError) {
      await stripe.paymentIntents.cancel(paymentIntent.id, {}, { idempotencyKey: `cancel-duplicate:${paymentIntent.id}` });
      if (depositError.code === "23505") throw new HttpError(409, "A deposit is already in progress");
      throw depositError;
    }

    return json(req, {
      client_secret: paymentIntent.client_secret,
      deposit_id: deposit.id,
      payment_intent_id: paymentIntent.id,
    });
  } catch (error) {
    return safeError(req, error);
  }
});
