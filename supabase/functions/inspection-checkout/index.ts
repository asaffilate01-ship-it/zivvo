import { createStripeClient, resolveStripeEnv } from "../_shared/stripe.ts";
import { checkoutMetadata, CURRENCY, inspectionCatalog } from "../_shared/payments.ts";
import {
  appUrl,
  HttpError,
  json,
  optionalString,
  parseJson,
  preflight,
  requireIdempotencyKey,
  requirePost,
  requireUser,
  requireUuid,
  safeError,
} from "../_shared/security.ts";

Deno.serve(async (req) => {
  let pendingBookingId: string | null = null;
  let cleanupPending: (() => Promise<void>) | null = null;
  try {
    const options = preflight(req);
    if (options) return options;
    requirePost(req);
    const idempotencyKey = requireIdempotencyKey(req);
    const { user, admin } = await requireUser(req);
    if (!user.email) throw new HttpError(400, "A verified email address is required");

    const body = await parseJson(req);
    const listingId = requireUuid(body.listingId, "listingId");
    const inspectionType = typeof body.inspectionType === "string" ? body.inspectionType : "standard_200";
    const plan = inspectionCatalog()[inspectionType];
    if (!plan) throw new HttpError(400, "Invalid inspection type");
    const buyerPhone = optionalString(body.buyerPhone, 40);
    const buyerAddress = optionalString(body.buyerAddress, 500);
    const buyerNotes = optionalString(body.buyerNotes, 2_000);
    if (!buyerPhone || !buyerAddress) throw new HttpError(400, "Phone and address are required");

    const { data: listing, error: listingError } = await admin
      .from("car_listings")
      .select("id,seller_id,title,make,model,year,status,country")
      .eq("id", listingId)
      .maybeSingle();
    if (listingError) throw listingError;
    if (!listing || listing.status !== "active" || listing.country !== "DE") {
      throw new HttpError(404, "Active German listing not found");
    }
    if (listing.seller_id === user.id) throw new HttpError(403, "Sellers cannot book their own inspection");

    const stripe = createStripeClient(resolveStripeEnv());
    const { data: existing, error: existingError } = await admin
      .from("inspection_bookings")
      .select("id,status,stripe_session_id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .eq("inspection_type", inspectionType)
      .in("status", ["pending_payment", "paid", "scheduled", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing?.status === "pending_payment" && existing.stripe_session_id) {
      const session = await stripe.checkout.sessions.retrieve(existing.stripe_session_id);
      if (session.status === "open" && session.url) return json(req, { url: session.url, bookingId: existing.id });
    }
    if (existing && existing.status !== "pending_payment") throw new HttpError(409, "An inspection is already active for this listing");
    if (existing?.status === "pending_payment") {
      const { error: cancelError } = await admin.from("inspection_bookings")
        .update({ status: "cancelled", cancellation_reason: "Checkout expired or unavailable" })
        .eq("id", existing.id)
        .eq("status", "pending_payment");
      if (cancelError) throw cancelError;
    }

    pendingBookingId = crypto.randomUUID();
    const { error: bookingError } = await admin.from("inspection_bookings").insert({
      id: pendingBookingId,
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      inspection_type: inspectionType,
      price: plan.amountCents / 100,
      currency: CURRENCY.toUpperCase(),
      buyer_phone: buyerPhone,
      buyer_address: buyerAddress,
      buyer_notes: buyerNotes,
      status: "pending_payment",
    });
    if (bookingError) {
      if (bookingError.code === "23505") throw new HttpError(409, "An inspection checkout is already in progress");
      throw bookingError;
    }
    cleanupPending = async () => {
      await admin.from("inspection_bookings").delete().eq("id", pendingBookingId).eq("status", "pending_payment").is("stripe_session_id", null);
    };

    const customers = await stripe.customers.list({ email: user.email, limit: 10 });
    const customerId = customers.data.find((customer) => customer.metadata.userId === user.id)?.id;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{
        price_data: {
          currency: CURRENCY,
          product_data: {
            name: plan.label,
            description: `${listing.year} ${listing.make} ${listing.model}`,
          },
          unit_amount: plan.amountCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: appUrl("/inbox?inspection=success"),
      cancel_url: appUrl(`/car/${listingId}?inspection=cancelled`),
      metadata: checkoutMetadata("inspection_booking", plan.amountCents, {
        booking_id: pendingBookingId,
        listing_id: listingId,
        user_id: user.id,
      }),
    }, { idempotencyKey: `inspection:${user.id}:${listingId}:${inspectionType}:${idempotencyKey}` });

    const { error: updateError } = await admin
      .from("inspection_bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", pendingBookingId)
      .eq("status", "pending_payment");
    if (updateError) throw updateError;
    cleanupPending = null;

    return json(req, { url: session.url, bookingId: pendingBookingId });
  } catch (error) {
    if (cleanupPending) {
      try {
        await cleanupPending();
      } catch {
        // The original error is more useful; orphaned rows are visible to operations.
      }
    }
    return safeError(req, error);
  }
});
