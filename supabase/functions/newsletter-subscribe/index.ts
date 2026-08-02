import {
  adminClient,
  consumeAnonymousRateLimit,
  HttpError,
  json,
  optionalString,
  parseJson,
  preflight,
  requirePost,
  safeError,
} from "../_shared/security.ts";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

Deno.serve(async (req) => {
  try {
    const options = preflight(req);
    if (options) return options;
    requirePost(req);
    const admin = adminClient();
    await consumeAnonymousRateLimit(req, admin, "newsletter-subscribe", 8, 3_600);
    const body = await parseJson(req);
    if (body.website) return json(req, { accepted: true });
    const email = optionalString(body.email, 254)?.toLowerCase();
    if (!email || !EMAIL.test(email)) throw new HttpError(400, "Ungültige E-Mail-Adresse");

    const { data: existing, error: lookupError } = await admin
      .from("newsletter_subscribers")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (lookupError) throw lookupError;

    if (!existing) {
      const { error } = await admin.from("newsletter_subscribers").insert({ email });
      if (error && error.code !== "23505") throw error;
    }

    return json(req, { accepted: true, alreadySubscribed: Boolean(existing) }, 201);
  } catch (error) {
    return safeError(req, error);
  }
});
