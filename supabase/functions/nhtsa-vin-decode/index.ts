import { adminClient, consumeAnonymousRateLimit, HttpError, json, parseJson, preflight, requirePost, safeError } from "../_shared/security.ts";

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const admin = adminClient();
    await consumeAnonymousRateLimit(req, admin, "vin-decode", 30, 3600);
    const body = await parseJson(req);
    const vin = typeof body.vin === "string" ? body.vin.trim().toUpperCase() : "";
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) throw new HttpError(400, "Eine gültige 17-stellige FIN ist erforderlich");
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(vin)}?format=json`);
    if (!response.ok) throw new HttpError(502, "FIN-Dekodierung ist vorübergehend nicht verfügbar");
    const result = (await response.json()).Results?.[0];
    if (!result) throw new HttpError(404, "FIN wurde nicht gefunden");
    return json(req, { success: true, data: {
      make: result.Make || null, model: result.Model || null, year: result.ModelYear || null,
      body_type: result.BodyClass || null, fuel_type: result.FuelTypePrimary || null,
      engine_size: result.DisplacementL ? `${Number(result.DisplacementL).toFixed(1)}L` : null,
      engine_cylinders: result.EngineCylinders || null, engine_hp: result.EngineHP || null,
      transmission: result.TransmissionStyle || null, drivetrain: result.DriveType || null,
      doors: result.Doors || null, plant_country: result.PlantCountry || null,
    } });
  } catch (error) {
    return safeError(req, error);
  }
});
