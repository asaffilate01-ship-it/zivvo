import { adminClient, consumeAnonymousRateLimit, env, HttpError, json, parseJson, preflight, requirePost, safeError } from "../_shared/security.ts";

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const admin = adminClient();
    await consumeAnonymousRateLimit(req, admin, "reverse-geocode", 30, 3600);
    const body = await parseJson(req);
    const lat = Number(body.lat); const lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new HttpError(400, "Koordinaten sind ungültig");
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      result_type: "locality|postal_town|administrative_area_level_2",
      key: env("GOOGLE_MAPS_API_KEY"),
    });
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
    if (!response.ok) throw new HttpError(502, "Standortsuche ist vorübergehend nicht verfügbar");
    const data = await response.json();
    let city = "Ihre Umgebung";
    for (const result of data.results || []) {
      const component = (result.address_components || []).find((part: any) => part.types?.some((type: string) => ["locality", "postal_town", "administrative_area_level_2"].includes(type)));
      if (component?.long_name) { city = component.long_name; break; }
    }
    return json(req, { city });
  } catch (error) {
    return safeError(req, error);
  }
});
