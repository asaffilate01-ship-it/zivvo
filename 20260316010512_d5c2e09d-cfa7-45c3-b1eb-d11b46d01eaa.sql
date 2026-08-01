import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { appUrl, env, HttpError, json, optionalString, parseJson, preflight, requireIdempotencyKey, requirePost, requireUser, requireUuid, safeError } from "../_shared/security.ts";
import { CURRENCY, requireInspection } from "../_shared/payments.ts";

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const idempotencyKey = requireIdempotencyKey(req);
    const { user, admin } = await requireUser(req);
    if (!user.email) throw new HttpError(400, "Your account needs a verified email address");
    const body = await parseJson(req);
    const listingId = requireUuid(body.listingId, "listingId");
    const selected = requireInspection(body.inspectionType || "standard_200");
    const { data: listing } = await admin.from("car_listings").select("id,seller_id,title,make,model,year,status").eq("id", listingId).maybeSingle();
    if (!listing || listing.status !== "active") throw new HttpError(404, "Listing not found");
    if (listing.seller_id === user.id) throw new HttpError(403, "You cannot inspect your own listing as a buyer");
    const { data: existing } = await admin.from("inspection_bookings").select("id").eq("listing_id", listingId).eq("buyer_id", user.id).in("status", ["pending_payment", "paid", "scheduled", "in_progress"]).maybeSingle();
    if (existing) throw new HttpError(409, "You already have an active inspection for this vehicle");
    const { data: booking, error } = await admin.from("inspection_bookings").insert({
      listing_id: listingId, buyer_id: user.id, seller_id: listing.seller_id, inspection_type: selected.type,
      price: selected.cents / 100, currency: CURRENCY.toUpperCase(),
      buyer_phone: optionalString(body.buyerPhone, 40), buyer_address: optionalString(body.buyerAddress, 300), buyer_notes: optionalString(body.buyerNotes, 1000), status: "pending_payment",
    }).select("id").single();
    if (error) throw error;
    const stripe = new Stripe(env("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });
    try {
      const session = await stripe.checkout.sessions.create({
        customer_email: user.email, mode: "payment",
        line_items: [{ price_data: { currency: CURRENCY, unit_amount: selected.cents, product_data: { name: selected.label, description: `${listing.year} ${listing.make} ${listing.model}` } }, quantity: 1 }],
        success_url: appUrl("/inbox?inspection=success"), cancel_url: appUrl(`/car/${listingId}?inspection=cancelled`),
        metadata: { type: "inspection_booking", booking_id: booking.id, user_id: user.id, expected_amount: String(selected.cents), currency: CURRENCY },
      }, { idempotencyKey });
      await admin.from("inspection_bookings").update({ stripe_session_id: session.id }).eq("id", booking.id);
      return json(req, { url: session.url, bookingId: booking.id });
    } catch (error) {
      await admin.from("inspection_bookings").delete().eq("id", booking.id).eq("status", "pending_payment");
      throw error;
    }
  } catch (error) { return safeError(req, error); }
});
