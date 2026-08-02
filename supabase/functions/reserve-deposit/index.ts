import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { appUrl, env, HttpError, json, optionalString, parseJson, preflight, requireIdempotencyKey, requirePost, requireUser, requireUuid, safeError } from "../_shared/security.ts";
import { CURRENCY } from "../_shared/payments.ts";

const RESERVATION_CENTS = 50_000;

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const idempotencyKey = requireIdempotencyKey(req);
    const { user, admin } = await requireUser(req);
    if (!user.email) throw new HttpError(400, "Your account needs a verified email address");
    const body = await parseJson(req);
    const listingId = requireUuid(body.listing_id, "listing_id");
    const { data: listing } = await admin.from("car_listings").select("id,dealer_id,seller_id,title,year,make,model,status").eq("id", listingId).maybeSingle();
    if (!listing || !listing.dealer_id || listing.status !== "active") throw new HttpError(404, "Reservable listing not found");
    if (listing.seller_id === user.id) throw new HttpError(403, "You cannot reserve your own vehicle");
    if (body.dealer_id && body.dealer_id !== listing.dealer_id) throw new HttpError(400, "Dealer does not match this listing");
    const { data: active } = await admin.from("reservation_deposits").select("id").eq("listing_id", listingId).in("status", ["pending", "paid", "held", "expiry_processing"]).maybeSingle();
    if (active) throw new HttpError(409, "This vehicle is already reserved");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const buyerName = optionalString(body.buyer_name, 120) || optionalString(user.user_metadata?.full_name, 120) || user.email;
    const { data: reservation, error } = await admin.from("reservation_deposits").insert({
      dealer_id: listing.dealer_id, listing_id: listingId, buyer_name: buyerName, buyer_email: user.email,
      buyer_phone: optionalString(body.buyer_phone, 40), amount: RESERVATION_CENTS / 100, currency: CURRENCY,
      status: "pending", expires_at: expiresAt, buyer_id: user.id,
    }).select("id").single();
    if (error) throw error;
    const stripe = new Stripe(env("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment", customer_email: user.email,
        line_items: [{ price_data: { currency: CURRENCY, unit_amount: RESERVATION_CENTS, product_data: { name: `Reservierung – ${listing.title}`, description: "Reserviert das Fahrzeug 48 Stunden. Erstattungen erfolgen nach den Reservierungsbedingungen." } }, quantity: 1 }],
        metadata: { type: "reservation_deposit", reservation_id: reservation.id, dealer_id: listing.dealer_id, listing_id: listingId, user_id: user.id, expected_amount: String(RESERVATION_CENTS), currency: CURRENCY },
        payment_intent_data: {
          metadata: { type: "reservation_deposit", reservation_id: reservation.id, dealer_id: listing.dealer_id, listing_id: listingId, user_id: user.id },
        },
        success_url: appUrl(`/car/${listingId}?reservation=success`), cancel_url: appUrl(`/car/${listingId}?reservation=cancelled`),
      }, { idempotencyKey });
      await admin.from("reservation_deposits").update({ stripe_session_id: session.id }).eq("id", reservation.id);
      await admin.from("reservation_events").insert({ reservation_id: reservation.id, actor_id: user.id, event_type: "created" });
      return json(req, { url: session.url, reservation_id: reservation.id });
    } catch (error) {
      await admin.from("reservation_deposits").delete().eq("id", reservation.id).eq("status", "pending");
      throw error;
    }
  } catch (error) { return safeError(req, error); }
});
