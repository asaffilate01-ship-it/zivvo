import type Stripe from "https://esm.sh/stripe@22.0.2";
import { createStripeClient, resolveStripeEnv, verifyWebhook } from "../_shared/stripe.ts";
import { adminClient } from "../_shared/security.ts";
import { CURRENCY, subscriptionCatalog } from "../_shared/payments.ts";

const stripe = createStripeClient(resolveStripeEnv());
const admin = adminClient();

type StoredSubscriptionStatus = "active" | "past_due" | "canceled" | "trialing" | "incomplete";

function storedSubscriptionStatus(status: Stripe.Subscription.Status): StoredSubscriptionStatus {
  if (status === "active" || status === "past_due" || status === "canceled" || status === "trialing" || status === "incomplete") return status;
  return status === "incomplete_expired" ? "canceled" : "past_due";
}

function assertPaidSession(session: Stripe.Checkout.Session): void {
  const expected = Number(session.metadata?.expected_amount || "NaN");
  const currency = session.metadata?.currency;
  if (session.payment_status !== "paid" || !Number.isSafeInteger(expected) || session.amount_total !== expected || session.currency !== currency || currency !== CURRENCY) {
    throw new Error(`Checkout verification failed for ${session.id}`);
  }
}

async function notify(userId: string | null | undefined, title: string, message: string, link: string): Promise<void> {
  if (!userId) return;
  const { error } = await admin.from("notifications").insert({ user_id: userId, type: "payment", title, message, link });
  if (error) throw error;
}

async function recordIncident(eventId: string, values: Record<string, unknown>): Promise<void> {
  const { error } = await admin.from("payment_incidents").upsert({
    stripe_event_id: eventId,
    ...values,
  }, { onConflict: "stripe_event_id" });
  if (error) console.error("Payment incident could not be recorded", eventId, error);
}

async function handleCheckout(session: Stripe.Checkout.Session): Promise<void> {
  const type = session.metadata?.type;
  if (type === "dealer_subscription") {
    const userId = session.metadata?.user_id;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (!userId || !subscriptionId) throw new Error("Subscription metadata missing");
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const price = subscription.items.data[0]?.price;
    const priceId = price?.lookup_key || price?.metadata?.lovable_external_id || price?.id;
    const plan = priceId ? subscriptionCatalog()[priceId] : null;
    if (!plan) throw new Error("Unknown subscription price");
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    const businessName = session.metadata?.business_name || "Mein Autohaus";
    const slugBase = businessName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "autohaus";
    const { data: existing } = await admin.from("dealers").select("id").eq("user_id", userId).maybeSingle();
    const values = { business_name: businessName, stripe_customer_id: customerId, stripe_subscription_id: subscriptionId, subscription_status: storedSubscriptionStatus(subscription.status), tier: plan.tier, max_listings: plan.maxListings, is_active: ["active", "trialing"].includes(subscription.status) };
    const result = existing
      ? await admin.from("dealers").update(values).eq("id", existing.id)
      : await admin.from("dealers").insert({ ...values, user_id: userId, slug: `${slugBase}-${userId.slice(0, 8)}`, country: "DE" });
    if (result.error) throw result.error;
    for (const role of ["dealer", "seller"]) {
      const { error } = await admin.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role", ignoreDuplicates: true });
      if (error) throw error;
    }
    await notify(userId, "Abo aktiviert", "Ihr Händlerkonto ist jetzt bereit.", "/dashboard");
    return;
  }

  assertPaidSession(session);
  if (type === "boost") {
    const listingId = session.metadata?.listing_id;
    const userId = session.metadata?.user_id;
    const days = Number(session.metadata?.days);
    if (!listingId || !userId || !Number.isInteger(days)) throw new Error("Boost metadata missing");
    const promotedUntil = new Date(Date.now() + days * 86_400_000).toISOString();
    const { data, error } = await admin.from("car_listings").update({ is_promoted: true, promoted_until: promotedUntil }).eq("id", listingId).eq("seller_id", userId).eq("status", "active").select("id").maybeSingle();
    if (error || !data) throw error || new Error("Boost ownership verification failed");
    await notify(userId, "Anzeige hervorgehoben", `Ihre Anzeige wird ${days} Tage priorisiert.`, `/car/${listingId}`);
    return;
  }

  if (type === "inspection_booking") {
    const bookingId = session.metadata?.booking_id;
    const userId = session.metadata?.user_id;
    if (!bookingId || !userId) throw new Error("Inspection metadata missing");
    const { data: booking, error } = await admin.from("inspection_bookings").update({ status: "paid", stripe_payment_intent_id: session.payment_intent as string }).eq("id", bookingId).eq("buyer_id", userId).eq("status", "pending_payment").select("buyer_id,seller_id,listing_id").maybeSingle();
    if (error || !booking) throw error || new Error("Inspection ownership verification failed");
    await Promise.all([
      notify(booking.buyer_id, "Prüfung gebucht", "Die Zahlung ist eingegangen. Wir koordinieren den Termin.", "/inbox"),
      notify(booking.seller_id, "Fahrzeugprüfung angefragt", "Ein Käufer hat eine unabhängige Prüfung gebucht.", `/car/${booking.listing_id}`),
    ]);
    return;
  }

  if (type === "reservation_deposit") {
    const reservationId = session.metadata?.reservation_id;
    const userId = session.metadata?.user_id;
    if (!reservationId || !userId) throw new Error("Reservation metadata missing");
    const { data, error } = await admin.from("reservation_deposits").update({ status: "paid", stripe_payment_intent_id: session.payment_intent as string, paid_at: new Date().toISOString() }).eq("id", reservationId).eq("buyer_id", userId).eq("status", "pending").select("listing_id").maybeSingle();
    if (error || !data) throw error || new Error("Reservation ownership verification failed");
    await admin.from("reservation_events").insert({ reservation_id: reservationId, actor_id: userId, event_type: "paid", details: { session_id: session.id } });
    await notify(userId, "Fahrzeug reserviert", "Ihre Reservierungszahlung ist eingegangen.", `/car/${data.listing_id}`);
    return;
  }

  if (type === "arbitrage_dealer_payment") {
    const dealId = session.metadata?.deal_id;
    const dealerId = session.metadata?.dealer_id;
    if (!dealId || !dealerId) throw new Error("Trade payment metadata missing");
    const { data, error } = await admin.from("arbitrage_deals").update({ dealer_paid_at: new Date().toISOString(), dealer_payment_ref: session.payment_intent as string || session.id }).eq("id", dealId).eq("buyer_dealer_id", dealerId).is("dealer_paid_at", null).select("id").maybeSingle();
    if (error || !data) throw error || new Error("Trade payment verification failed");
    await admin.from("arbitrage_audit_log").insert({ deal_id: dealId, actor_role: "system", action: "dealer_payment_completed", details: { session_id: session.id, payment_intent: session.payment_intent } });
    return;
  }

  if (type === "auction_winner_payment") {
    const auctionId = session.metadata?.auction_id;
    const escrowId = session.metadata?.escrow_id;
    const buyerId = session.metadata?.buyer_id;
    if (!auctionId || !escrowId || !buyerId) throw new Error("Auction payment metadata missing");
    const depositId = session.metadata?.deposit_id;
    const depositIntent = session.metadata?.deposit_payment_intent_id;
    if (depositId && depositIntent) {
      const intent = await stripe.paymentIntents.retrieve(depositIntent);
      if (intent.status !== "requires_capture" || intent.metadata.auction_id !== auctionId || intent.metadata.user_id !== buyerId) throw new Error("Auction deposit verification failed");
      await stripe.paymentIntents.capture(depositIntent, {}, { idempotencyKey: `capture-${session.id}` });
      const { error } = await admin.from("auction_deposits").update({ status: "captured", captured_at: new Date().toISOString() }).eq("id", depositId).eq("user_id", buyerId).eq("status", "authorized");
      if (error) throw error;
    }
    const { data, error } = await admin.from("auction_escrow").update({ status: "full_payment_held" }).eq("id", escrowId).eq("auction_id", auctionId).eq("buyer_id", buyerId).in("status", ["pending_deposit", "deposit_held"]).select("id").maybeSingle();
    if (error || !data) throw error || new Error("Escrow verification failed");
    await admin.from("auction_audit_log").insert({ auction_id: auctionId, actor_id: buyerId, actor_role: "buyer", action: "winner_payment_completed", details: { session_id: session.id, payment_intent: session.payment_intent } });
    await notify(buyerId, "Zahlung eingegangen", "Die Auktionszahlung wird bis zur sicheren Übergabe verwahrt.", `/auction/${auctionId}`);
  }
}

async function handleInvoice(invoice: Stripe.Invoice): Promise<void> {
  if (invoice.status !== "paid" || invoice.amount_paid <= 0) return;
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;
  const { data: dealer } = await admin.from("dealers").select("id,user_id,onboarded_by_agent").eq("stripe_customer_id", customerId).maybeSingle();
  if (!dealer) return;
  const { error } = await admin.from("subscription_payments").upsert({ stripe_invoice_id: invoice.id, dealer_id: dealer.id, amount: invoice.amount_paid / 100, currency: invoice.currency, paid_at: new Date((invoice.status_transitions.paid_at || Math.floor(Date.now() / 1000)) * 1000).toISOString() }, { onConflict: "stripe_invoice_id" });
  if (error) throw error;
  if (dealer.onboarded_by_agent) {
    await admin.from("agent_commissions").upsert({ agent_id: dealer.onboarded_by_agent, dealer_id: dealer.id, commission_rate: 30, amount: invoice.amount_paid / 100 * 0.30, status: "pending", source_invoice_id: invoice.id }, { onConflict: "source_invoice_id" });
  }
}

async function handleCheckoutExpired(eventId: string, session: Stripe.Checkout.Session): Promise<void> {
  const type = session.metadata?.type;
  if (type === "reservation_deposit" && session.metadata?.reservation_id) {
    const { data } = await admin.from("reservation_deposits").update({ status: "expired", expiry_claimed_at: null })
      .eq("id", session.metadata.reservation_id)
      .eq("stripe_session_id", session.id)
      .eq("status", "pending")
      .select("id,buyer_id,listing_id")
      .maybeSingle();
    if (data) {
      await admin.from("reservation_events").insert({ reservation_id: data.id, event_type: "expired", details: { session_id: session.id } });
      await notify(data.buyer_id, "Reservierung abgelaufen", "Der Bezahlvorgang wurde nicht abgeschlossen. Das Fahrzeug wurde wieder freigegeben.", `/car/${data.listing_id}`);
    }
  }
  await recordIncident(eventId, {
    provider_object_id: session.id,
    incident_type: "checkout_expired",
    user_id: session.metadata?.user_id || null,
    listing_id: session.metadata?.listing_id || null,
    amount_cents: session.amount_total,
    currency: session.currency,
    summary: `Checkout expired (${type || "unknown"})`,
    metadata: { type, session_status: session.status },
  });
}

async function handlePaymentFailure(eventId: string, intent: Stripe.PaymentIntent): Promise<void> {
  const userId = intent.metadata?.user_id || null;
  const listingId = intent.metadata?.listing_id || null;
  await recordIncident(eventId, {
    provider_object_id: intent.id,
    incident_type: "payment_failed",
    user_id: userId,
    listing_id: listingId,
    amount_cents: intent.amount,
    currency: intent.currency,
    summary: (intent.last_payment_error?.message || "Payment could not be completed").slice(0, 500),
    metadata: { type: intent.metadata?.type, decline_code: intent.last_payment_error?.decline_code || null },
  });
  await notify(userId, "Zahlung nicht abgeschlossen", "Die Zahlung konnte nicht abgeschlossen werden. Bitte prüfen Sie die Zahlungsart oder versuchen Sie es erneut.", listingId ? `/car/${listingId}` : "/profile");
}

async function handleInvoiceFailure(eventId: string, invoice: Stripe.Invoice): Promise<void> {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  const { data: dealer } = customerId
    ? await admin.from("dealers").select("id,user_id").eq("stripe_customer_id", customerId).maybeSingle()
    : { data: null };
  if (dealer) {
    await admin.from("dealers").update({ subscription_status: "past_due", is_active: false }).eq("id", dealer.id);
    await notify(dealer.user_id, "Abo-Zahlung fehlgeschlagen", "Bitte aktualisieren Sie Ihre Zahlungsart im Abrechnungsportal, damit Ihr Händlerkonto wieder aktiviert werden kann.", "/dashboard");
  }
  await recordIncident(eventId, {
    provider_object_id: invoice.id,
    incident_type: "invoice_failed",
    user_id: dealer?.user_id || null,
    dealer_id: dealer?.id || null,
    amount_cents: invoice.amount_due,
    currency: invoice.currency,
    summary: `Subscription invoice payment failed (${invoice.id})`,
    metadata: { attempt_count: invoice.attempt_count, next_payment_attempt: invoice.next_payment_attempt },
  });
}

async function handleDispute(dispute: Stripe.Dispute): Promise<void> {
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id;
  const charge = await stripe.charges.retrieve(chargeId);
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id || null;
  let userId: string | null = null;
  if (paymentIntentId) {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    userId = intent.metadata?.user_id || null;
  }
  const dueBy = dispute.evidence_details?.due_by
    ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
    : null;
  const { error } = await admin.from("payment_disputes").upsert({
    stripe_dispute_id: dispute.id,
    stripe_charge_id: chargeId,
    payment_intent_id: paymentIntentId,
    status: dispute.status,
    reason: dispute.reason,
    amount_cents: dispute.amount,
    currency: dispute.currency,
    user_id: userId,
    evidence_due_at: dueBy,
    is_charge_refundable: dispute.is_charge_refundable,
    metadata: dispute.metadata,
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_dispute_id" });
  if (error) throw error;
}

async function handleSubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const active = ["active", "trialing"].includes(subscription.status);
  const { error } = await admin.from("dealers").update({ subscription_status: storedSubscriptionStatus(subscription.status), is_active: active }).eq("stripe_customer_id", customerId);
  if (error) throw error;
}

async function handleRefund(refund: Stripe.Refund): Promise<void> {
  const reservationId = refund.metadata?.reservation_id;
  if (!reservationId) return;
  const status = String(refund.status || "pending");
  const { data: current } = await admin.from("reservation_deposits").select("refund_status").eq("id", reservationId).eq("stripe_refund_id", refund.id).maybeSingle();
  if (!current || current.refund_status === status) return;
  const reservationStatus = status === "succeeded"
    ? "refunded"
    : status === "failed" || status === "canceled"
      ? "refund_failed"
      : "refund_pending";
  const { data, error } = await admin.from("reservation_deposits").update({
    status: reservationStatus,
    stripe_refund_id: refund.id,
    refund_status: status,
    refunded_at: status === "succeeded" ? new Date().toISOString() : null,
  }).eq("id", reservationId).eq("stripe_refund_id", refund.id).in("status", ["refund_pending", "refund_failed", "refunded"]).select("buyer_id,listing_id").maybeSingle();
  if (error) throw error;
  if (!data) return;
  if (status === "succeeded") {
    await admin.from("reservation_events").insert({ reservation_id: reservationId, event_type: "refunded", details: { stripe_refund_id: refund.id } });
    await notify(data.buyer_id, "Reservierung erstattet", "Ihre Reservierungszahlung wurde erstattet.", `/car/${data.listing_id}`);
  } else if (status === "failed" || status === "canceled") {
    await admin.from("reservation_events").insert({ reservation_id: reservationId, event_type: "refund_failed", details: { stripe_refund_id: refund.id } });
    await notify(data.buyer_id, "Erstattung nicht abgeschlossen", "Die Erstattung konnte nicht abgeschlossen werden. Der Support wurde informiert.", `/car/${data.listing_id}`);
  }
}

Deno.serve(async (req) => {
  let event: Stripe.Event;
  try {
    event = (await verifyWebhook(req, resolveStripeEnv(new URL(req.url).searchParams.get("env")))) as unknown as Stripe.Event;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }


  const { error: lockError } = await admin.from("stripe_webhook_events").insert({ event_id: event.id, event_type: event.type, status: "processing" });
  if (lockError) {
    const { data } = await admin.from("stripe_webhook_events").select("status").eq("event_id", event.id).maybeSingle();
    if (data?.status !== "failed") return new Response("ok", { status: 200 });
    await admin.from("stripe_webhook_events").update({ status: "processing", error_message: null, processed_at: null }).eq("event_id", event.id).eq("status", "failed");
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") await handleCheckout(event.data.object as Stripe.Checkout.Session);
    else if (event.type === "checkout.session.expired") await handleCheckoutExpired(event.id, event.data.object as Stripe.Checkout.Session);
    else if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await recordIncident(event.id, {
        provider_object_id: session.id,
        incident_type: "async_payment_failed",
        user_id: session.metadata?.user_id || null,
        listing_id: session.metadata?.listing_id || null,
        amount_cents: session.amount_total,
        currency: session.currency,
        summary: `Asynchronous checkout payment failed (${session.metadata?.type || "unknown"})`,
        metadata: { type: session.metadata?.type },
      });
    }
    else if (event.type === "payment_intent.payment_failed") await handlePaymentFailure(event.id, event.data.object as Stripe.PaymentIntent);
    else if (event.type === "invoice.paid") await handleInvoice(event.data.object as Stripe.Invoice);
    else if (event.type === "invoice.payment_failed") await handleInvoiceFailure(event.id, event.data.object as Stripe.Invoice);
    else if (event.type.startsWith("customer.subscription.")) await handleSubscription(event.data.object as Stripe.Subscription);
    else if (event.type.startsWith("charge.dispute.")) await handleDispute(event.data.object as Stripe.Dispute);
    else if (["refund.created", "refund.updated", "refund.failed", "charge.refund.updated"].includes(event.type)) await handleRefund(event.data.object as Stripe.Refund);
    await admin.from("stripe_webhook_events").update({ status: "succeeded", processed_at: new Date().toISOString() }).eq("event_id", event.id);
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("Webhook processing failed", event.id, error);
    await admin.from("stripe_webhook_events").update({ status: "failed", error_message: error instanceof Error ? error.message.slice(0, 500) : "Unknown error" }).eq("event_id", event.id);
    await recordIncident(event.id, {
      provider_object_id: event.id,
      incident_type: "webhook_processing_failed",
      summary: `Webhook processing failed for ${event.type}`,
      metadata: { error: error instanceof Error ? error.message.slice(0, 300) : "unknown" },
    });
    return new Response("Processing failed", { status: 500 });
  }
});
