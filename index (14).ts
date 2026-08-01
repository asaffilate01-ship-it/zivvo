import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { adminClient, env, json, preflight, requireCron, requirePost, safeError } from "../_shared/security.ts";

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    requireCron(req);
    const admin = adminClient();
    const stripe = new Stripe(env("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });
    const { data: due, error } = await admin.from("auctions").select("id").eq("status", "live").lte("ends_at", new Date().toISOString()).order("ends_at").limit(50);
    if (error) throw error;
    const results: Array<{ auction_id: string; status: string; error?: string }> = [];
    for (const row of due || []) {
      try {
        const { data, error: closeError } = await admin.rpc("close_due_auction", { p_auction_id: row.id });
        if (closeError) throw closeError;
        const closed = data?.[0];
        const { data: deposits } = await admin.from("auction_deposits").select("id,user_id,stripe_payment_intent_id,status").eq("auction_id", row.id).eq("status", "authorized");
        for (const deposit of deposits || []) {
          if (closed?.winner_id && deposit.user_id === closed.winner_id) continue;
          if (deposit.stripe_payment_intent_id) {
            const intent = await stripe.paymentIntents.retrieve(deposit.stripe_payment_intent_id);
            if (intent.status === "requires_capture") await stripe.paymentIntents.cancel(intent.id, {}, { idempotencyKey: `release-${row.id}-${deposit.id}` });
          }
          await admin.from("auction_deposits").update({ status: "released", released_at: new Date().toISOString() }).eq("id", deposit.id).eq("status", "authorized");
        }
        results.push({ auction_id: row.id, status: closed?.final_status || "closed" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        await admin.from("auction_close_jobs").upsert({ auction_id: row.id, status: "failed", last_error: message.slice(0, 500), updated_at: new Date().toISOString() }, { onConflict: "auction_id" });
        results.push({ auction_id: row.id, status: "failed", error: "Close failed" });
      }
    }
    return json(req, { processed: results.length, results });
  } catch (error) { return safeError(req, error); }
});
