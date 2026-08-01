import { appUrl, HttpError, json, optionalString, parseJson, preflight, requireIdempotencyKey, requirePost, requireUser, safeError } from "../_shared/security.ts";

Deno.serve(async (req) => {
  let invitedUserId: string | null = null;
  let cleanupAdmin: any = null;
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    requireIdempotencyKey(req);
    const { user, admin } = await requireUser(req);
    cleanupAdmin = admin;
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.id).in("role", ["agent", "admin"]).limit(1).maybeSingle();
    if (!role) throw new HttpError(403, "Agent access required");
    const body = await parseJson(req);
    const businessName = optionalString(body.business_name, 120);
    const email = optionalString(body.business_email, 254)?.toLowerCase();
    if (!businessName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Business name and a valid email are required");
    const phone = optionalString(body.business_phone, 40);
    const address = optionalString(body.address, 200);
    const city = optionalString(body.city, 100);
    const postcode = optionalString(body.postcode, 10);
    const description = optionalString(body.description, 1_000);
    const website = optionalString(body.website_url, 300);
    if (website) {
      try { if (new URL(website).protocol !== "https:") throw new Error(); }
      catch { throw new HttpError(400, "Website must use HTTPS"); }
    }

    const { data: existing } = await admin.from("dealers").select("id,onboarded_by_agent").ilike("business_email", email).maybeSingle();
    if (existing) {
      if (existing.onboarded_by_agent === user.id || role.role === "admin") return json(req, { success: true, dealer_id: existing.id, already_invited: true });
      throw new HttpError(409, "This business email is already registered");
    }

    const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: appUrl("/login?invite=dealer"),
      data: { full_name: businessName, invited_as: "dealer" },
    });
    if (inviteError || !invite.user) throw new HttpError(409, "The dealer could not be invited. The email may already have an account");
    invitedUserId = invite.user.id;
    const slugBase = businessName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "autohaus";
    const { data: dealer, error: dealerError } = await admin.from("dealers").insert({
      user_id: invitedUserId,
      business_name: businessName,
      business_email: email,
      business_phone: phone,
      address,
      city,
      postcode,
      country: "DE",
      website_url: website,
      description,
      tier: "professional",
      max_listings: 30,
      slug: `${slugBase}-${invitedUserId.slice(0, 8)}`,
      onboarded_by_agent: user.id,
      kyc_submitted_at: new Date().toISOString(),
      subscription_status: "incomplete",
      is_active: false,
    }).select("id").single();
    if (dealerError || !dealer) throw dealerError || new Error("Dealer record was not created");
    const { error: rolesError } = await admin.from("user_roles").upsert([
      { user_id: invitedUserId, role: "dealer" },
      { user_id: invitedUserId, role: "seller" },
    ], { onConflict: "user_id,role", ignoreDuplicates: true });
    if (rolesError) {
      await admin.from("dealers").delete().eq("id", dealer.id);
      throw rolesError;
    }
    return json(req, { success: true, dealer_id: dealer.id });
  } catch (error) {
    if (invitedUserId && cleanupAdmin) await cleanupAdmin.auth.admin.deleteUser(invitedUserId).catch(() => undefined);
    return safeError(req, error);
  }
});
