import { adminClient, consumeAnonymousRateLimit, HttpError, json, optionalString, parseJson, preflight, requirePost, requireUuid, safeError } from "../_shared/security.ts";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const admin = adminClient();
    await consumeAnonymousRateLimit(req, admin, "contact-submit", 8, 3_600);
    const body = await parseJson(req);
    if (body.website) return json(req, { accepted: true });
    const name = optionalString(body.name, 120);
    const email = optionalString(body.email, 254)?.toLowerCase();
    const subject = optionalString(body.subject, 160);
    const message = optionalString(body.message, 4_000);
    const phone = optionalString(body.phone, 40);
    const dealerId = body.dealer_id ? requireUuid(body.dealer_id, "dealer_id") : null;
    if (!name || !email || !EMAIL.test(email) || !subject || !message) throw new HttpError(400, "Kontaktdaten sind unvollständig");
    let dealer: { user_id: string; business_name: string } | null = null;
    if (dealerId) {
      const result = await admin.from("dealers").select("user_id,business_name").eq("id", dealerId).eq("is_active", true).maybeSingle();
      dealer = result.data;
      if (!dealer) throw new HttpError(404, "Händler nicht gefunden");
    }
    const { error } = await admin.from("contact_messages").insert({ name, email, subject, message, status: "new" });
    if (error) throw error;
    if (dealer) {
      const contact = [email, phone].filter(Boolean).join(" · ");
      const { error: notificationError } = await admin.from("notifications").insert({
        user_id: dealer.user_id,
        type: "enquiry",
        title: `Neue Anfrage für ${dealer.business_name}`,
        message: `${name}${contact ? ` (${contact})` : ""}: ${message}`.slice(0, 1_000),
        link: "/dashboard",
      });
      if (notificationError) console.error("Dealer enquiry notification failed", notificationError);
    }
    return json(req, { accepted: true }, 201);
  } catch (error) {
    return safeError(req, error);
  }
});
