import { XMLParser } from "https://esm.sh/fast-xml-parser@4.5.0";
import { HttpError, adminClient, cors, hashSubject, json, preflight, safeError } from "../_shared/security.ts";

const MAX_BODY_BYTES = 2_000_000;
const MAX_VEHICLES = 100;

const docs = `Zivvo Stock Ingest API

POST /functions/v1/stock-ingest
X-Zivvo-Api-Key: <key>
Content-Type: application/json | application/xml | text/csv

Every vehicle requires: external_ref, make, model, year and price.
New vehicles enter under_review. Maximum: 100 vehicles / 2 MB per request.
API keys are accepted in the X-Zivvo-Api-Key header only.`;

function text(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  if (normalized.length > max) throw new HttpError(400, "A text field is too long");
  return normalized;
}

function numberValue(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCsv(source: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell.trim()); cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell.trim()); cell = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += character;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (quoted || rows.length < 2) throw new HttpError(400, "Invalid CSV body");
  const headers = rows[0].map((header) => header.trim());
  if (new Set(headers).size !== headers.length || headers.some((header) => !header)) throw new HttpError(400, "Invalid CSV headers");
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function normalizeVehicle(vehicle: Record<string, unknown>, dealerId: string, sellerId: string) {
  const externalRef = text(vehicle.external_ref ?? vehicle.externalRef ?? vehicle.stockNo ?? vehicle.stock_no ?? vehicle.id, 120);
  const make = text(vehicle.make, 80);
  const model = text(vehicle.model, 120);
  const year = numberValue(vehicle.year);
  const price = numberValue(vehicle.price ?? vehicle.askingPrice ?? vehicle.priceAsking);
  const currentYear = new Date().getUTCFullYear();
  if (!externalRef || !make || !model || !year || !Number.isInteger(year) || year < 1886 || year > currentYear + 1 || !price || price <= 0 || price > 10_000_000) {
    throw new HttpError(400, "Required vehicle fields are invalid");
  }
  const mileage = numberValue(vehicle.mileage ?? vehicle.odometer);
  if (mileage !== null && (mileage < 0 || mileage > 2_000_000)) throw new HttpError(400, "Mileage is invalid");
  const vin = text(vehicle.vin, 17)?.toUpperCase() || null;
  if (vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) throw new HttpError(400, "VIN is invalid");
  const imageInput = Array.isArray(vehicle.images)
    ? vehicle.images
    : Array.isArray(vehicle.photos)
      ? vehicle.photos
      : typeof vehicle.images === "string"
        ? vehicle.images.split("|")
        : [];
  const images = imageInput.slice(0, 15).map((value) => text(value, 2_000)).filter((value): value is string => Boolean(value) && /^https:\/\//i.test(value!));
  const rawFeatures = Array.isArray(vehicle.features) ? vehicle.features : [];
  const features = rawFeatures.slice(0, 100).map((value) => text(value, 120)).filter((value): value is string => Boolean(value));

  return {
    dealer_id: dealerId,
    seller_id: sellerId,
    source: "api",
    external_ref: externalRef,
    source_synced_at: new Date().toISOString(),
    title: text(vehicle.title, 160) || `${year} ${make} ${model}`,
    make,
    model,
    year,
    price,
    mileage,
    fuel_type: text(vehicle.fuel_type ?? vehicle.fuelType ?? vehicle.fuel, 60),
    transmission: text(vehicle.transmission, 60),
    body_type: text(vehicle.body_type ?? vehicle.bodyType ?? vehicle.body, 60),
    color: text(vehicle.color ?? vehicle.colour, 60),
    doors: numberValue(vehicle.doors),
    engine_size: text(vehicle.engine_size ?? vehicle.engineSize, 40),
    registration: text(vehicle.registration ?? vehicle.reg, 30),
    vin,
    description: text(vehicle.description, 10_000),
    location: text(vehicle.location ?? vehicle.city, 160),
    images,
    features,
    country: "DE",
  };
}

function parseVehicles(raw: string, contentType: string): Record<string, unknown>[] {
  if (contentType.includes("json")) {
    let decoded: unknown;
    try { decoded = JSON.parse(raw); } catch { throw new HttpError(400, "Invalid JSON body"); }
    const value = Array.isArray(decoded) ? decoded : (decoded as Record<string, unknown>)?.vehicles;
    if (!Array.isArray(value)) throw new HttpError(400, "JSON must contain a vehicles array");
    return value as Record<string, unknown>[];
  }
  if (contentType.includes("xml")) {
    if (/<!DOCTYPE|<!ENTITY/i.test(raw)) throw new HttpError(400, "Unsupported XML declaration");
    let decoded: Record<string, any>;
    try { decoded = new XMLParser({ ignoreAttributes: false, trimValues: true, processEntities: false }).parse(raw); }
    catch { throw new HttpError(400, "Invalid XML body"); }
    const root = decoded.stock || decoded.vehicles || decoded;
    const value = root?.vehicle || root?.Vehicle || root?.car;
    return (Array.isArray(value) ? value : value ? [value] : []) as Record<string, unknown>[];
  }
  if (contentType.includes("csv")) return parseCsv(raw);
  throw new HttpError(415, "Unsupported Content-Type");
}

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    if (req.method === "GET") return new Response(docs, { headers: { ...cors(req), "Content-Type": "text/plain; charset=utf-8" } });
    if (req.method !== "POST") throw new HttpError(405, "Method not allowed");
    const declaredLength = Number(req.headers.get("content-length") || 0);
    if (declaredLength > MAX_BODY_BYTES) throw new HttpError(413, "Request is too large");

    const key = req.headers.get("x-zivvo-api-key")?.trim() || "";
    if (!/^zvk_[a-f0-9]{64}$/i.test(key)) throw new HttpError(401, "A valid API key is required");
    const admin = adminClient();
    const keyHash = await hashSubject(key);
    const { data: allowed, error: rateError } = await admin.rpc("consume_rate_limit", {
      p_bucket: "stock-ingest",
      p_subject_hash: keyHash,
      p_limit: 30,
      p_window_seconds: 3_600,
    });
    if (rateError) throw new HttpError(503, "Request protection is unavailable");
    if (!allowed) throw new HttpError(429, "Too many import requests");

    const { data: keyRow, error: keyError } = await admin.from("dealer_ingest_keys")
      .select("id,dealer_id,is_active,revoked_at").eq("key_hash", keyHash).maybeSingle();
    if (keyError || !keyRow || !keyRow.is_active || keyRow.revoked_at) throw new HttpError(401, "API key is not active");
    const { data: dealer, error: dealerError } = await admin.from("dealers")
      .select("user_id,is_active,subscription_status").eq("id", keyRow.dealer_id).maybeSingle();
    if (dealerError || !dealer || !dealer.is_active || !["active", "trialing"].includes(dealer.subscription_status || "")) {
      throw new HttpError(403, "An active dealer subscription is required");
    }

    const raw = await req.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw new HttpError(413, "Request is too large");
    const vehicles = parseVehicles(raw, (req.headers.get("content-type") || "").toLowerCase());
    if (!vehicles.length || vehicles.length > MAX_VEHICLES) throw new HttpError(400, `Send between 1 and ${MAX_VEHICLES} vehicles`);

    let created = 0; let updated = 0; let failed = 0;
    const errors: Array<{ row: number; error: string }> = [];
    for (let index = 0; index < vehicles.length; index += 1) {
      try {
        const row = normalizeVehicle(vehicles[index], keyRow.dealer_id, dealer.user_id);
        const { data: existing, error: findError } = await admin.from("car_listings").select("id")
          .eq("dealer_id", keyRow.dealer_id).eq("source", "api").eq("external_ref", row.external_ref).maybeSingle();
        if (findError) throw findError;
        if (existing) {
          const { error } = await admin.from("car_listings").update(row).eq("id", existing.id);
          if (error) throw error;
          updated += 1;
        } else {
          const { error } = await admin.from("car_listings").insert({ ...row, status: "under_review" });
          if (error) throw error;
          created += 1;
        }
      } catch (error) {
        failed += 1;
        errors.push({ row: index + 1, error: error instanceof HttpError ? error.message : "Import failed" });
      }
    }

    await Promise.all([
      admin.from("dms_sync_logs").insert({
        dealer_id: keyRow.dealer_id, provider: "ingest_api", direction: "pull",
        status: failed ? (created || updated ? "partial" : "error") : "success",
        items_processed: vehicles.length, items_created: created, items_updated: updated, items_failed: failed,
        error_message: errors.slice(0, 5).map((entry) => `Row ${entry.row}: ${entry.error}`).join(" | ") || null,
      }),
      admin.from("dealer_ingest_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id),
    ]);
    return json(req, { ok: failed === 0, processed: vehicles.length, created, updated, failed, errors: errors.slice(0, 10) });
  } catch (error) {
    return safeError(req, error);
  }
});
