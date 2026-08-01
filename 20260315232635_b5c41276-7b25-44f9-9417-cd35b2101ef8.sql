import { adminClient, consumeAnonymousRateLimit, env, HttpError, json, parseJson, preflight, requirePost, safeError } from "../_shared/security.ts";

const GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const admin = adminClient();
    await consumeAnonymousRateLimit(req, admin, "geocode", 30, 3600);
    const body = await parseJson(req);
    const address = typeof body.address === "string" ? body.address.trim() : "";
    if (address.length < 2 || address.length > 200) throw new HttpError(400, "Adresse ist ungültig");
    const params = new URLSearchParams({ address, components: "country:DE", key: env("GOOGLE_MAPS_API_KEY") });
    const response = await fetch(`${GEOCODING_URL}?${params}`);
    if (!response.ok) throw new HttpError(502, "Geocodierung ist vorübergehend nicht verfügbar");
    const data = await response.json();
    if (data.status !== "OK" || !data.results?.length) return json(req, { found: false });
    const result = data.results[0];
    return json(req, { found: true, lat: result.geometry.location.lat, lng: result.geometry.location.lng, formatted: result.formatted_address });
  } catch (error) {
    return safeError(req, error);
  }
});
