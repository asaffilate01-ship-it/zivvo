import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { adminClient, env, json, preflight, requireCron, safeError } from "../_shared/security.ts";
import { CURRENCY } from "../_shared/payments.ts";

const stripe = new Stripe(env("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });

type ClaimedReservation = {
  id: string;
  buyer_id: string | null;
  listing_id: string;
  status: string;
  amount: number;
  currency: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  refund_status: string | null;
};

async function notify(admin: ReturnType<typeof adminClient>, reservation: ClaimedReservation, title: string, message: string) {
  if (!reservation.buyer_id) return;
  const { error } = await admin.from("notifications").insert({
    user_id: reservation.buyer_id,
    type: "payment",
    title,
    message,
    link: `/car/${reservation.listing_id}`,
  });
  if (error) console.error("Reservation expiry notification failed", error);
}

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requireCron(req);
    const admin = adminClient();
    const { data, error } = await admin.rpc("claim_expired_reservations", { p_limit: 50 });
    if (error) throw error;
    const reservations = (data || []) as ClaimedReservation[];
    const result = { claimed: reservations.length, expired: 0, refunded: 0, failed: 0 };

    for (const reservation of reservations) {
      try {
        if (!reservation.stripe_payment_intent_id) {
          if (reservation.stripe_session_id) {
            const session = await stripe.checkout.sessions.retrieve(reservation.stripe_session_id);
            if (session.status === "open") {
              await stripe.checkout.sessions.expire(session.id, {}, { idempotencyKey: `reservation-expire:${reservation.id}` });
            }
          }
          const { error: updateError } = await admin.from("reservation_deposits")
            .update({ status: "expired", expiry_claimed_at: null })
            .eq("id", reservation.id)
            .eq("status", "expiry_processing");
          if (updateError) throw updateError;
          await admin.from("reservation_events").insert({ reservation_id: reservation.id, event_type: "expired" });
          await notify(admin, reservation, "Reservierung abgelaufen", "Die Reservierungsfrist ist abgelaufen. Es wurde keine Zahlung belastet.");
          result.expired += 1;
          continue;
        }

        const expectedAmount = Math.round(Number(reservation.amount) * 100);
        const intent = await stripe.paymentIntents.retrieve(reservation.stripe_payment_intent_id);
        let reservationMatches = intent.metadata.reservation_id === reservation.id;
        if (!reservationMatches && reservation.stripe_session_id) {
          const session = await stripe.checkout.sessions.retrieve(reservation.stripe_session_id);
          const sessionIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
          reservationMatches = session.metadata?.reservation_id === reservation.id && sessionIntentId === intent.id;
        }
        if (intent.status !== "succeeded" || intent.currency !== CURRENCY || intent.amount_received !== expectedAmount || !reservationMatches) {
          throw new Error("Reservation payment verification failed");
        }

        const refund = await stripe.refunds.create({
          payment_intent: intent.id,
          amount: expectedAmount,
          metadata: { type: "reservation_deposit", reservation_id: reservation.id, listing_id: reservation.listing_id },
        }, { idempotencyKey: `reservation-expiry-refund:${reservation.id}` });
        const nextStatus = refund.status === "succeeded" ? "refunded" : "refund_pending";
        const { error: updateError } = await admin.from("reservation_deposits").update({
          status: nextStatus,
          stripe_refund_id: refund.id,
          refund_status: refund.status,
          refunded_at: refund.status === "succeeded" ? new Date().toISOString() : null,
          expiry_claimed_at: null,
        }).eq("id", reservation.id).eq("status", "expiry_processing");
        if (updateError) throw updateError;
        await admin.from("reservation_events").insert({
          reservation_id: reservation.id,
          event_type: refund.status === "succeeded" ? "refunded" : "refund_started",
          details: { reason: "reservation_expired", stripe_refund_id: refund.id },
        });
        await notify(admin, reservation, refund.status === "succeeded" ? "Reservierung erstattet" : "Erstattung eingeleitet", "Die Reservierung ist abgelaufen und die Rückzahlung wurde automatisch veranlasst.");
        result.refunded += 1;
      } catch (reservationError) {
        result.failed += 1;
        console.error("Reservation expiry failed", reservation.id, reservationError);
        await admin.from("reservation_deposits").update({ status: "refund_failed", expiry_claimed_at: null }).eq("id", reservation.id).eq("status", "expiry_processing");
        await admin.from("reservation_events").insert({
          reservation_id: reservation.id,
          event_type: "refund_failed",
          details: { reason: reservationError instanceof Error ? reservationError.message.slice(0, 300) : "unknown" },
        });
        await admin.from("payment_incidents").insert({
          provider_object_id: reservation.stripe_payment_intent_id,
          incident_type: "refund_failed",
          user_id: reservation.buyer_id,
          listing_id: reservation.listing_id,
          amount_cents: Math.round(Number(reservation.amount) * 100),
          currency: reservation.currency,
          summary: `Automatic reservation refund failed for ${reservation.id}`,
          metadata: { reservation_id: reservation.id },
        });
      }
    }
    return json(req, result);
  } catch (error) {
    return safeError(req, error);
  }
});
