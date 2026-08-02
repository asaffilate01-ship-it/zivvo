import { createStripeClient, resolveStripeEnv } from "../_shared/stripe.ts";
import { boostCatalog, checkoutMetadata, CURRENCY } from "../_shared/payments.ts";
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
    const idempotencyKey = requireIdempotencyKey(req);
    const { user, admin } = await requireUser(req);
    if (!user.email) throw new HttpError(400, "A verified email address is required");

    const body = await parseJson(req);
    const listingId = requireUuid(body.listingId, "listingId");
    const days = Number(body.days);
    const plan = boostCatalog()[days];
    if (!plan) throw new HttpError(400, "Invalid boost option");

    const { data: listing, error } = await admin
      .from("car_listings")
      .select("id,title,seller_id,status,country")
      .eq("id", listingId)
      .maybeSingle();
    if (error) throw error;
    if (!listing || listing.status !== "active" || listing.seller_id !== user.id) {
      throw new HttpError(404, "Active listing not found");
    }
    if (listing.country !== "DE") throw new HttpError(409, "Only German listings can be promoted");

    const stripe = createStripeClient(resolveStripeEnv());
    const customers = await stripe.customers.list({ email: user.email, limit: 10 });
    const customerId = customers.data.find((customer) => customer.metadata.userId === user.id)?.id;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{
        price_data: {
          currency: CURRENCY,
          product_data: {
            name: `${plan.label}: ${listing.title}`,
            description: `Priorisierte Platzierung für ${days} Tage`,
          },
          unit_amount: plan.amountCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: appUrl(`/dashboard?boost=success&listing=${listingId}`),
      cancel_url: appUrl("/dashboard?boost=cancelled"),
      metadata: checkoutMetadata("boost", plan.amountCents, {
        user_id: user.id,
        listing_id: listingId,
        days: String(days),
      }),
    }, { idempotencyKey: `boost:${user.id}:${listingId}:${idempotencyKey}` });

    return json(req, { url: session.url });
  } catch (error) {
    return safeError(req, error);
  }
});
