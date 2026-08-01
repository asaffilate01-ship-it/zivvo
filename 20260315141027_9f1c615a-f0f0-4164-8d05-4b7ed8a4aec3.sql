import { env, HttpError, json, parseJson, preflight, requirePost, requireUser, safeError } from "../_shared/security.ts";

const aiEndpoint = (): string => {
  const url = new URL(env("AI_API_URL"));
  if (url.protocol !== "https:") throw new HttpError(500, "KI-Dienst ist nicht konfiguriert");
  return url.toString();
};

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    await requireUser(req);
    const body = await parseJson(req);
    const make = typeof body.make === "string" ? body.make.trim().slice(0, 80) : "";
    const model = typeof body.model === "string" ? body.model.trim().slice(0, 80) : "";
    const year = Number(body.year);
    if (!make || !model || !Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) throw new HttpError(400, "Fahrzeugdaten sind unvollständig");
    const details = ["mileage", "fuel_type", "transmission", "body_type", "color", "engine_size", "price"]
      .map((key) => `${key}: ${String(body[key] ?? "").slice(0, 100)}`).join(", ");
    const response = await fetch(aiEndpoint(), {
      method: "POST",
      headers: { Authorization: `Bearer ${env("AI_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: env("AI_MODEL"), max_tokens: 350, temperature: 0.4, messages: [
        { role: "system", content: "Du schreibst sachliche deutsche Gebrauchtwagenanzeigen. Erfinde keine Ausstattung, Historie, Prüfungen oder Garantien. Verwende nur bereitgestellte Fakten und höchstens 180 Wörter ohne Markdown-Überschriften." },
        { role: "user", content: `Erstelle eine Beschreibung für ${year} ${make} ${model}. Angaben: ${details}` },
      ] }),
    });
    if (!response.ok) throw new HttpError(response.status === 429 ? 429 : 502, "Beschreibung konnte nicht erzeugt werden");
    const description = (await response.json()).choices?.[0]?.message?.content;
    if (typeof description !== "string" || !description.trim()) throw new HttpError(502, "Beschreibung konnte nicht erzeugt werden");
    return json(req, { description: description.trim() });
  } catch (error) {
    return safeError(req, error);
  }
});
