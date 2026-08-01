import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { env, HttpError, json, preflight, requirePost, requireUser, safeError } from "../_shared/security.ts";

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const { user, admin } = await requireUser(req);
    const now = new Date().toISOString();
    const [{ data: selling }, { data: buying }, { data: escrow }, { data: trade }] = await Promise.all([
      admin.from("auctions").select("id").eq("seller_id", user.id).in("status", ["live", "sold"]).limit(1),
      admin.from("auction_bids").select("id,auctions!inner(status)").eq("bidder_id", user.id).in("auctions.status", ["live", "sold"]).limit(1),
      admin.from("auction_escrow").select("id").or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).in("status", ["pending_deposit", "deposit_held", "full_payment_held", "disputed"]).limit(1),
      admin.from("arbitrage_deals").select("id").eq("seller_id", user.id).not("status", "in", "(completed,cancelled)").limit(1),
    ]);
    if (selling?.length || buying?.length || escrow?.length || trade?.length) throw new HttpError(409, "Open auctions, payments or trade deals must be resolved before account deletion");
    const { data: dealer } = await admin.from("dealers").select("id,stripe_subscription_id").eq("user_id", user.id).maybeSingle();
    if (dealer?.stripe_subscription_id) {
      const stripe = new Stripe(env("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });
      await stripe.subscriptions.cancel(dealer.stripe_subscription_id, { invoice_now: false, prorate: false });
    }
    await Promise.all([
      admin.from("saved_cars").delete().eq("user_id", user.id),
      admin.from("saved_searches").delete().eq("user_id", user.id),
      admin.from("notifications").delete().eq("user_id", user.id),
      admin.from("user_roles").delete().eq("user_id", user.id),
      admin.from("car_listings").update({ status: "expired", description: "Listing withdrawn" }).eq("seller_id", user.id).in("status", ["draft", "active", "under_review"]),
      admin.from("profiles").update({ full_name: "Deleted user", phone: null, avatar_url: null }).eq("user_id", user.id),
      dealer ? admin.from("dealers").update({ is_active: false, business_email: null, business_phone: null, website_url: null, description: "Account closed", subscription_status: "canceled" }).eq("id", dealer.id) : Promise.resolve(),
    ]);
    for (const bucket of ["avatars", "listing-images"]) {
      const { data: files } = await admin.storage.from(bucket).list(user.id, { limit: 1000 });
      if (files?.length) await admin.storage.from(bucket).remove(files.map((file) => `${user.id}/${file.name}`));
    }
    const { data: log } = await admin.from("account_deletion_log").insert({ user_id_hash: await sha256(user.id), completed_at: now }).select("id").single();
    const { error } = await admin.auth.admin.deleteUser(user.id, true);
    if (error) throw error;
    return json(req, { success: true, reference: log?.id });
  } catch (error) { return safeError(req, error); }
});
