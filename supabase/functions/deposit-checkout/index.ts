import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { env, HttpError, json, parseJson, preflight, requireIdempotencyKey, requirePost, requireUser, requireUuid, safeError } from "../_shared/security.ts";
import { AUCTION_DEPOSIT_CENTS, CURRENCY } from "../_shared/payments.ts";

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const idempotencyKey = requireIdempotencyKey(req);
    const { user, admin } = await requireUser(req);
    if (!user.email) throw new HttpError(400, "Your account needs a verified email address");
    const body = await parseJson(req);
    const auctionId = requireUuid(body.auction_id, "auction_id");
    const { data: auction } = await admin.from("auctions").select("id,seller_id,status,starts_at,ends_at").eq("id", auctionId).maybeSingle();
    if (!auction || auction.status !== "live" || (auction.ends_at && new Date(auction.ends_at) <= new Date())) throw new HttpError(409, "Auction is not open for deposits");
    if (auction.seller_id === user.id) throw new HttpError(403, "Sellers cannot bid on their own auction");
    const { data: existing } = await admin.from("auction_deposits").select("id,status,stripe_payment_intent_id").eq("auction_id", auctionId).eq("user_id", user.id).in("status", ["pending", "authorized"]).maybeSingle();
    if (existing?.status === "authorized") return json(req, { already_authorized: true, deposit_id: existing.id });
    const stripe = new Stripe(env("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });
    if (existing?.stripe_payment_intent_id) {
      const intent = await stripe.paymentIntents.retrieve(existing.stripe_payment_intent_id);
      return json(req, { client_secret: intent.client_secret, deposit_id: existing.id });
    }
    const intent = await stripe.paymentIntents.create({
      amount: AUCTION_DEPOSIT_CENTS, currency: CURRENCY, capture_method: "manual", customer: undefined,
      receipt_email: user.email,
      metadata: { type: "auction_deposit", auction_id: auctionId, user_id: user.id },
      automatic_payment_methods: { enabled: true },
    }, { idempotencyKey });
    const { data: deposit, error } = await admin.from("auction_deposits").insert({ auction_id: auctionId, user_id: user.id, amount: AUCTION_DEPOSIT_CENTS / 100, type: "card_preauth", status: "pending", stripe_payment_intent_id: intent.id }).select("id").single();
    if (error) { await stripe.paymentIntents.cancel(intent.id).catch(() => undefined); throw error; }
    return json(req, { client_secret: intent.client_secret, deposit_id: deposit.id });
  } catch (error) { return safeError(req, error); }
});
