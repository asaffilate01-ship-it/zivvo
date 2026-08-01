import { adminClient, consumeAnonymousRateLimit, HttpError, json, parseJson, preflight, requirePost, safeError } from "../_shared/security.ts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const admin = adminClient();
    await consumeAnonymousRateLimit(req, admin, "newsletter", 5, 3600);
    const body = await parseJson(req);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email.length > 254 || !EMAIL_PATTERN.test(email)) throw new HttpError(400, "Bitte geben Sie eine gültige E-Mail-Adresse ein");
    const { error } = await admin.from("newsletter_subscribers").upsert({ email }, { onConflict: "email", ignoreDuplicates: true });
    if (error) throw error;
    return json(req, { success: true });
  } catch (error) {
    return safeError(req, error);
  }
});
