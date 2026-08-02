import type Stripe from "https://esm.sh/stripe@22.0.2";
import { createStripeClient, resolveStripeEnv } from "../_shared/stripe.ts";
import {
  env,
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
import { CURRENCY } from "../_shared/payments.ts";

type ReservationAction = "apply_to_sale" | "refund";

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    requireIdempotencyKey(req);
    const { user, admin } = await requireUser(req);
    const body = await parseJson(req);
    const reservationId = requireUuid(body.reservation_id, "reservation_id");
    const action = body.action as ReservationAction;
    if (action !== "apply_to_sale" && action !== "refund") throw new HttpError(400, "Unknown reservation action");

    const { data: dealer } = await admin.from("dealers").select("id").eq("user_id", user.id).maybeSingle();
    if (!dealer) throw new HttpError(403, "Dealer account required");

    const { data: reservation } = await admin
      .from("reservation_deposits")
      .select("id,dealer_id,listing_id,buyer_id,amount,currency,status,stripe_payment_intent_id,stripe_refund_id,refund_status")
      .eq("id", reservationId)
      .eq("dealer_id", dealer.id)
      .maybeSingle();
    if (!reservation) throw new HttpError(404, "Reservation not found");

    if (action === "apply_to_sale") {
      if (reservation.status === "applied_to_sale") return json(req, { status: reservation.status });
      if (reservation.status !== "paid") throw new HttpError(409, "Only a paid reservation can be applied to a sale");
      const { data, error } = await admin.from("reservation_deposits")
        .update({ status: "applied_to_sale" })
        .eq("id", reservation.id).eq("dealer_id", dealer.id).eq("status", "paid")
        .select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw new HttpError(409, "Reservation changed before it could be updated");
      await admin.from("reservation_events").insert({ reservation_id: reservation.id, actor_id: user.id, event_type: "applied_to_sale" });
      return json(req, { status: "applied_to_sale" });
    }

    if (reservation.status === "refunded") return json(req, { status: "refunded" });
    if (reservation.status === "refund_pending" && reservation.stripe_refund_id) {
      return json(req, { status: "refund_pending" });
    }
    if (reservation.status !== "paid") throw new HttpError(409, "Only a paid reservation can be refunded");
    if (!reservation.stripe_payment_intent_id) throw new HttpError(409, "The verified payment reference is missing");

    const expectedAmount = Math.round(Number(reservation.amount) * 100);
    if (!Number.isSafeInteger(expectedAmount) || expectedAmount <= 0 || reservation.currency.toLowerCase() !== CURRENCY) {
      throw new HttpError(409, "Reservation payment data is invalid");
    }

    createStripeClient(resolveStripeEnv());
    const paymentIntent = await stripe.paymentIntents.retrieve(reservation.stripe_payment_intent_id);
    if (paymentIntent.status !== "succeeded" || paymentIntent.currency !== CURRENCY || paymentIntent.amount_received !== expectedAmount) {
      throw new HttpError(409, "The Stripe payment does not match this reservation");
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent.id,
      amount: expectedAmount,
      metadata: { type: "reservation_deposit", reservation_id: reservation.id, listing_id: reservation.listing_id },
    }, { idempotencyKey: `reservation-refund:${reservation.id}` });

    if (refund.status === "failed" || refund.status === "canceled") throw new HttpError(409, "Stripe could not complete the refund");
    const nextStatus = refund.status === "succeeded" ? "refunded" : "refund_pending";
    const { data: updated, error } = await admin.from("reservation_deposits").update({
      status: nextStatus,
      stripe_refund_id: refund.id,
      refund_status: refund.status,
      refunded_at: refund.status === "succeeded" ? new Date().toISOString() : null,
    }).eq("id", reservation.id).eq("dealer_id", dealer.id).eq("status", "paid").select("id").maybeSingle();
    if (error) throw error;
    if (!updated) throw new HttpError(409, "Reservation changed before it could be updated");

    await admin.from("reservation_events").insert({
      reservation_id: reservation.id,
      actor_id: user.id,
      event_type: refund.status === "succeeded" ? "refunded" : "refund_started",
      details: { reason: "dealer_requested", stripe_refund_id: refund.id },
    });

    if (reservation.buyer_id) {
      await admin.from("notifications").insert({
        user_id: reservation.buyer_id,
        type: "payment",
        title: nextStatus === "refunded" ? "Reservierung erstattet" : "Erstattung eingeleitet",
        message: nextStatus === "refunded" ? "Ihre Reservierungszahlung wurde erstattet." : "Die Erstattung Ihrer Reservierungszahlung wird verarbeitet.",
        link: `/car/${reservation.listing_id}`,
      });
    }
    return json(req, { status: nextStatus });
  } catch (error) { return safeError(req, error); }
});
