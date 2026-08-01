import { adminClient, consumeAnonymousRateLimit, env, HttpError, json, parseJson, preflight, requirePost, safeError } from "../_shared/security.ts";

type ChatMessage = { role: "user" | "assistant"; content: string };

const aiEndpoint = (): string => {
  const url = new URL(env("AI_API_URL"));
  if (url.protocol !== "https:") throw new HttpError(500, "KI-Dienst ist nicht konfiguriert");
  return url.toString();
};

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const admin = adminClient();
    await consumeAnonymousRateLimit(req, admin, "ai-chat", 20, 3600);
    const body = await parseJson(req);
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 1000) throw new HttpError(400, "Nachricht ist ungültig");
    const rawHistory = Array.isArray(body.history) ? body.history.slice(-8) : [];
    const history: ChatMessage[] = rawHistory.map((entry: unknown) => {
      if (!entry || typeof entry !== "object") throw new HttpError(400, "Chatverlauf ist ungültig");
      const item = entry as Record<string, unknown>;
      if ((item.role !== "user" && item.role !== "assistant") || typeof item.content !== "string" || item.content.length > 1000) throw new HttpError(400, "Chatverlauf ist ungültig");
      return { role: item.role, content: item.content };
    });
    const response = await fetch(aiEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env("AI_API_KEY")}` },
      body: JSON.stringify({
        model: env("AI_MODEL"),
        max_tokens: 300,
        temperature: 0.4,
        messages: [
          { role: "system", content: "Du bist der Zivvo-Assistent für einen deutschen Fahrzeugmarktplatz. Antworte knapp auf Deutsch. Erfinde keine Inserate, Preise, Prüfungen, Garantien oder Finanzierungspartner. Verweise für konkrete Angebote auf /browse, für Verkauf auf /sell und für Hilfe auf /help. Bei Rechts-, Finanz- oder Sicherheitsfragen weise auf fachliche Beratung hin." },
          ...history,
          { role: "user", content: message },
        ],
      }),
    });
    if (!response.ok) throw new HttpError(response.status === 429 ? 429 : 502, "Der Assistent ist vorübergehend nicht verfügbar");
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) throw new HttpError(502, "Der Assistent ist vorübergehend nicht verfügbar");
    return json(req, { reply: reply.trim() });
  } catch (error) {
    return safeError(req, error);
  }
});
