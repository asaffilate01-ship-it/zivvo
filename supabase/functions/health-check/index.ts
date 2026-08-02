import { adminClient, consumeAnonymousRateLimit, cors, HttpError, json, preflight, safeError } from "../_shared/security.ts";

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    if (req.method !== "GET" && req.method !== "HEAD") throw new HttpError(405, "Method not allowed");
    const admin = adminClient();
    await consumeAnonymousRateLimit(req, admin, "health-check", 180, 3_600);
    const { error } = await admin.from("dealers").select("id", { count: "exact", head: true }).limit(1);
    if (error) throw new HttpError(503, "Database unavailable");
    if (req.method === "HEAD") return new Response(null, { status: 204, headers: cors(req) });
    return json(req, { status: "ok", service: "zivvo", checked_at: new Date().toISOString() });
  } catch (error) {
    return safeError(req, error);
  }
});
