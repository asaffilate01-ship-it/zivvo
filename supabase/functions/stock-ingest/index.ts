// Public stock-ingest endpoint — lets ANY external DMS (VirtualYard, Click Dealer, Auto-IT, etc.)
// PUSH a dealer's stock into Zivvo.
//
// Auth: dealer-issued ingest API key (header `X-Zivvo-Api-Key` or query `?key=`)
// Content-Type accepted:
//   - application/json    → { vehicles: [...] } or [...]
//   - application/xml or text/xml → AutoTrader-style <stock><vehicle>... feed
//   - text/csv            → first row headers, comma separated
//
// Each vehicle must include a stable `external_ref` (or stockNo / id) so re-imports update existing rows.
//
// GET / => returns docs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { parse as parseXml } from "https://esm.sh/fast-xml-parser@4.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-zivvo-api-key",
};

const sha256 = async (s: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const num = (v: any) =>
  v === undefined || v === null || v === "" ? null : Number(String(v).replace(/[^0-9.-]/g, ""));
const norm = (v: any) => (v === undefined || v === null ? null : String(v).trim());

const toRow = (v: any, dealerId: string, sellerId: string) => {
  const externalRef = String(
    v.external_ref ?? v.externalRef ?? v.stockNo ?? v.stock_no ?? v.id ?? ""
  );
  if (!externalRef) return null;
  const make = norm(v.make);
  const model = norm(v.model);
  const year = num(v.year);
  const price = num(v.price ?? v.askingPrice ?? v.priceAsking);
  if (!make || !model || !year || !price) return null;

  let images: string[] = [];
  if (Array.isArray(v.images)) images = v.images;
  else if (Array.isArray(v.photos)) images = v.photos;
  else if (typeof v.images === "string") images = v.images.split("|").filter(Boolean);

  return {
    dealer_id: dealerId,
    seller_id: sellerId,
    source: norm(v.source) || "feed",
    external_ref: externalRef,
    source_synced_at: new Date().toISOString(),
    title: norm(v.title) || `${year} ${make} ${model}`,
    make,
    model,
    year,
    price,
    mileage: num(v.mileage ?? v.odometer),
    fuel_type: norm(v.fuel_type ?? v.fuelType ?? v.fuel),
    transmission: norm(v.transmission),
    body_type: norm(v.body_type ?? v.bodyType ?? v.body),
    color: norm(v.color ?? v.colour),
    doors: num(v.doors),
    engine_size: norm(v.engine_size ?? v.engineSize),
    registration: norm(v.registration ?? v.reg),
    vin: norm(v.vin),
    description: norm(v.description),
    location: norm(v.location ?? v.city),
    images,
    features: Array.isArray(v.features) ? v.features : [],
    country: norm(v.country) || "GB",
    status: "active" as const,
  };
};

const docs = `# Zivvo Stock Ingest API

POST /functions/v1/stock-ingest
Headers: X-Zivvo-Api-Key: <key>
Content-Type: application/json | application/xml | text/csv

JSON body example:
{
  "vehicles": [
    {
      "external_ref": "STK-1001",
      "make": "BMW",
      "model": "3 Series",
      "year": 2021,
      "price": 18995,
      "mileage": 28400,
      "fuel_type": "Diesel",
      "transmission": "Automatic",
      "body_type": "Saloon",
      "color": "Black",
      "registration": "BD21 ABC",
      "images": ["https://.../1.jpg", "https://.../2.jpg"]
    }
  ]
}

XML body example (AutoTrader-style):
<stock>
  <vehicle>
    <stockNo>STK-1001</stockNo>
    <make>BMW</make>
    <model>3 Series</model>
    <year>2021</year>
    <price>18995</price>
  </vehicle>
</stock>

CSV body example (header row required):
external_ref,make,model,year,price,mileage,registration
STK-1001,BMW,3 Series,2021,18995,28400,BD21 ABC

Response: { ok, processed, created, updated, failed, errors }
`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method === "GET") {
    return new Response(docs, {
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Auth
    const url = new URL(req.url);
    const key =
      req.headers.get("x-zivvo-api-key") ||
      url.searchParams.get("key") ||
      "";
    if (!key || key.length < 20) {
      return new Response(JSON.stringify({ error: "Missing or invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const keyHash = await sha256(key);
    const { data: keyRow } = await admin
      .from("dealer_ingest_keys")
      .select("id, dealer_id, is_active, revoked_at")
      .eq("key_hash", keyHash)
      .maybeSingle();
    if (!keyRow || !keyRow.is_active || keyRow.revoked_at) {
      return new Response(JSON.stringify({ error: "API key not recognised" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const dealerId = keyRow.dealer_id;

    const { data: dealerRow } = await admin
      .from("dealers")
      .select("user_id")
      .eq("id", dealerId)
      .single();
    if (!dealerRow) {
      return new Response(JSON.stringify({ error: "Dealer record missing" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sellerId = dealerRow.user_id;

    // Parse payload by content type
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    let vehicles: any[] = [];
    const raw = await req.text();

    if (ct.includes("application/json") || raw.trim().startsWith("{") || raw.trim().startsWith("[")) {
      const json = JSON.parse(raw);
      vehicles = Array.isArray(json) ? json : json.vehicles || json.stock || json.data || [];
    } else if (ct.includes("xml") || raw.trim().startsWith("<")) {
      const parsed: any = parseXml(raw, { ignoreAttributes: false, trimValues: true });
      const root = parsed.stock || parsed.vehicles || parsed;
      const list = root.vehicle || root.Vehicle || root.car || [];
      vehicles = Array.isArray(list) ? list : [list];
    } else if (ct.includes("csv") || raw.includes(",")) {
      const lines = raw.split(/\r?\n/).filter((l) => l.trim());
      const headers = lines[0].split(",").map((h) => h.trim());
      vehicles = lines.slice(1).map((line) => {
        const cells = line.split(",");
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => (obj[h] = (cells[i] || "").trim()));
        return obj;
      });
    } else {
      return new Response(JSON.stringify({ error: "Unsupported content-type" }), {
        status: 415,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const v of vehicles) {
      try {
        const row = toRow(v, dealerId, sellerId);
        if (!row) {
          failed++;
          errors.push(`Skipped row missing required fields`);
          continue;
        }
        const { data: existing } = await admin
          .from("car_listings")
          .select("id")
          .eq("dealer_id", dealerId)
          .eq("source", row.source)
          .eq("external_ref", row.external_ref)
          .maybeSingle();
        if (existing) {
          const { error } = await admin.from("car_listings").update(row).eq("id", existing.id);
          if (error) throw error;
          updated++;
        } else {
          const { error } = await admin.from("car_listings").insert(row);
          if (error) throw error;
          created++;
        }
      } catch (err) {
        failed++;
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    await admin.from("dms_sync_logs").insert({
      dealer_id: dealerId,
      provider: "ingest_api",
      direction: "pull",
      status: failed > 0 ? "partial" : "success",
      items_processed: vehicles.length,
      items_created: created,
      items_updated: updated,
      items_failed: failed,
      error_message: errors.slice(0, 5).join(" | ") || null,
    });

    await admin
      .from("dealer_ingest_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyRow.id);

    return new Response(
      JSON.stringify({
        ok: true,
        processed: vehicles.length,
        created,
        updated,
        failed,
        errors: errors.slice(0, 10),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stock-ingest] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
