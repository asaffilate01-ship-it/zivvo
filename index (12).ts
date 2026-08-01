import { json, preflight, requirePost, requireUser, safeError } from "../_shared/security.ts";

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const { user, admin } = await requireUser(req);
    const { data: dealer, error } = await admin.from("dealers")
      .select("tier,subscription_status,is_active,stripe_subscription_id")
      .eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    const subscribed = !!dealer?.is_active && ["active", "trialing"].includes(dealer.subscription_status);
    return json(req, { subscribed, tier: subscribed ? dealer?.tier : null, subscription_status: dealer?.subscription_status || null });
  } catch (error) {
    return safeError(req, error);
  }
});
