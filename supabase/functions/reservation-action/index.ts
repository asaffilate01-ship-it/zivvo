import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ACTIONS = ["confirm", "cancel", "expire", "refund", "complete"] as const;
type Action = (typeof ACTIONS)[number];

const STATUS_BY_ACTION: Record<Action, string> = {
  confirm: "confirmed",
  cancel: "cancelled",
  expire: "expired",
  refund: "refunded",
  complete: "completed",
};

function res(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return res({ error: "Method not allowed" }, 405);

  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!token) return res({ error: "Not authenticated" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (!user) return res({ error: "Not authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const reservationId = String(body.reservationId ?? "");
    const action = String(body.action ?? "") as Action;
    const notes = body.notes ? String(body.notes).slice(0, 1000) : null;

    if (!/^[0-9a-f-]{36}$/i.test(reservationId)) return res({ error: "Invalid reservationId" }, 400);
    if (!ACTIONS.includes(action)) return res({ error: "Invalid action" }, 400);

    const { data: reservation } = await supabase
      .from("reservation_deposits")
      .select("id, buyer_id, dealer_id, listing_id, status")
      .eq("id", reservationId)
      .maybeSingle();
    if (!reservation) return res({ error: "Reservation not found" }, 404);

    const { data: dealer } = await supabase
      .from("dealers")
      .select("owner_id, business_name")
      .eq("id", reservation.dealer_id)
      .maybeSingle();

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    const isBuyer = reservation.buyer_id === user.id;
    const isDealer = dealer?.owner_id === user.id;

    if (!isAdmin && !isBuyer && !isDealer) return res({ error: "Not authorised" }, 403);
    // Buyers may only cancel their own reservation
    if (isBuyer && !isDealer && !isAdmin && action !== "cancel") {
      return res({ error: "Buyers can only cancel a reservation" }, 403);
    }
    if (["refunded", "completed", "cancelled", "expired"].includes(reservation.status)) {
      return res({ error: `Reservation is already ${reservation.status}` }, 409);
    }

    const nextStatus = STATUS_BY_ACTION[action];
    const update: Record<string, unknown> = { status: nextStatus, updated_at: new Date().toISOString() };
    if (notes) update.notes = notes;
    if (action === "refund") update.refunded_at = new Date().toISOString();

    const { error } = await supabase.from("reservation_deposits").update(update).eq("id", reservationId);
    if (error) throw error;

    // Notify the other party
    try {
      const recipient = isBuyer ? dealer?.owner_id : reservation.buyer_id;
      if (recipient) {
        await supabase.from("notifications").insert({
          user_id: recipient,
          type: "reservation",
          title: "Reservierung aktualisiert",
          message: `Der Status der Reservierung wurde auf "${nextStatus}" geändert.`,
          link: `/car/${reservation.listing_id}`,
        });
      }
    } catch (_) {
      // non-blocking
    }

    // Free the listing again when the reservation ends without a sale
    if (["cancelled", "expired", "refunded"].includes(nextStatus)) {
      await supabase.from("car_listings").update({ status: "active" }).eq("id", reservation.listing_id);
    }
    if (nextStatus === "completed") {
      await supabase.from("car_listings").update({ status: "sold" }).eq("id", reservation.listing_id);
    }

    return res({ ok: true, status: nextStatus });
  } catch (e) {
    console.error("reservation-action error", e);
    return res({ error: "Request failed" }, 500);
  }
});
