import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { appUrl, env, HttpError, json, parseJson, preflight, requireIdempotencyKey, requirePost, requireUser, requireUuid, safeError } from "../_shared/security.ts";
import { CURRENCY, requireBoost } from "../_shared/payments.ts";

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const idempotencyKey = requireIdempotencyKey(req);
    const { user, admin } = await requireUser(req);
    if (!user.email) throw new HttpError(400, "Your account needs a verified email address");
    const body = await parseJson(req);
    const listingId = requireUuid(body.listingId, "listingId");
    const boost = requireBoost(body.days);
    const { data: listing } = await admin.from("car_listings").select("id,title,status,seller_id,is_promoted,promoted_until").eq("id", listingId).maybeSingle();
    if (!listing || listing.seller_id !== user.id) throw new HttpError(404, "Listing not found");
    if (listing.status !== "active") throw new HttpError(409, "Only active listings can be boosted");
    if (listing.promoted_until && new Date(listing.promoted_until) > new Date()) throw new HttpError(409, "This listing already has an active boost");
    const stripe = new Stripe(env("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [{ price_data: { currency: CURRENCY, unit_amount: boost.cents, product_data: { name: boost.label, description: `${listing.title} wird ${boost.days} Tage hervorgehoben.` } }, quantity: 1 }],
      mode: "payment",
      success_url: appUrl(`/dashboard?boost=success&listing=${listingId}`),
      cancel_url: appUrl("/dashboard?boost=cancelled"),
      metadata: { type: "boost", user_id: user.id, listing_id: listingId, days: String(boost.days), expected_amount: String(boost.cents), currency: CURRENCY },
    }, { idempotencyKey });
    return json(req, { url: session.url });
  } catch (error) { return safeError(req, error); }
});
