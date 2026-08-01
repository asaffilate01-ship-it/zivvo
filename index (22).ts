import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { appUrl, env, HttpError, json, preflight, requirePost, requireUser, safeError } from "../_shared/security.ts";

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const { user, admin } = await requireUser(req);
    const { data: dealer } = await admin.from("dealers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    if (!dealer?.stripe_customer_id) throw new HttpError(404, "No billing account exists for this user");
    const stripe = new Stripe(env("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });
    const session = await stripe.billingPortal.sessions.create({ customer: dealer.stripe_customer_id, return_url: appUrl("/dashboard?billing=returned") });
    return json(req, { url: session.url });
  } catch (error) { return safeError(req, error); }
});
