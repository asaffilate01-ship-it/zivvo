import { HttpError, json, optionalString, parseJson, preflight, requireAdmin, requirePost, requireUuid, safeError } from "../_shared/security.ts";

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const { user, admin } = await requireAdmin(req);
    const body = await parseJson(req);
    if (body.action === "list") {
      const { data, error } = await admin.from("ad_campaigns").select("id,name,creative_url,destination_path,starts_at,ends_at,is_active,created_at").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return json(req, { campaigns: data || [] });
    }
    if (body.action === "delete") {
      const id = requireUuid(body.id, "id");
      const { error } = await admin.from("ad_campaigns").delete().eq("id", id);
      if (error) throw error;
      return json(req, { success: true });
    }
    if (body.action !== "save") throw new HttpError(400, "Unknown action");
    const name = optionalString(body.name, 120); const creativeUrl = optionalString(body.creative_url, 500); const path = optionalString(body.destination_path, 300);
    if (!name || !creativeUrl || !path || !path.startsWith("/")) throw new HttpError(400, "Campaign details are incomplete");
    const parsedCreative = new URL(creativeUrl);
    if (parsedCreative.protocol !== "https:") throw new HttpError(400, "Creative URL must use HTTPS");
    const startsAt = new Date(String(body.starts_at)); const endsAt = new Date(String(body.ends_at));
    if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) throw new HttpError(400, "Campaign dates are invalid");
    const values = { name, creative_url: creativeUrl, destination_path: path, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), is_active: body.is_active === true, created_by: user.id };
    const result = body.id
      ? await admin.from("ad_campaigns").update(values).eq("id", requireUuid(body.id, "id"))
      : await admin.from("ad_campaigns").insert(values);
    if (result.error) throw result.error;
    return json(req, { success: true });
  } catch (error) { return safeError(req, error); }
});
