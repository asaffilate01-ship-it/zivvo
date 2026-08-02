import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  appUrl,
  HttpError,
  json,
  optionalString,
  parseJson,
  preflight,
  requirePost,
  requireUser,
  requireUuid,
  safeError,
} from "../_shared/security.ts";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ROLES = new Set(["owner", "manager", "sales", "viewer"]);

serve(async (req) => {
  try {
    const options = preflight(req);
    if (options) return options;
    requirePost(req);

    const { user, admin } = await requireUser(req);
    const body = await parseJson(req);
    const dealerId = requireUuid(body.dealerId, "dealerId");
    const email = optionalString(body.email, 254)?.toLowerCase() || "";
    const fullName = optionalString(body.fullName, 100);
    const requestedRole = optionalString(body.role, 20) || "sales";

    if (!EMAIL.test(email)) throw new HttpError(400, "Email is invalid");
    if (!ROLES.has(requestedRole)) throw new HttpError(400, "Role is invalid");

    const { data: dealer, error: dealerError } = await admin
      .from("dealers")
      .select("id, owner_id")
      .eq("id", dealerId)
      .maybeSingle();

    if (dealerError) throw dealerError;
    if (!dealer) throw new HttpError(404, "Dealer not found");

    const { data: isAdmin, error: roleError } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError) throw roleError;
    if (dealer.owner_id !== user.id && !isAdmin) throw new HttpError(403, "Not authorised");

    const { data: existing, error: existingError } = await admin
      .from("dealer_staff")
      .select("id")
      .eq("dealer_id", dealerId)
      .eq("email", email)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) throw new HttpError(409, "This person has already been invited");

    const inviteToken = `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
    const { data: staff, error: insertError } = await admin
      .from("dealer_staff")
      .insert({
        dealer_id: dealerId,
        email,
        full_name: fullName,
        role: requestedRole,
        invite_token: inviteToken,
        is_active: true,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    const inviteUrl = new URL("/dealer/invite", appUrl("/"));
    inviteUrl.searchParams.set("token", inviteToken);
    return json(req, { ok: true, staffId: staff.id, inviteUrl: inviteUrl.toString() });
  } catch (error) {
    return safeError(req, error);
  }
});
