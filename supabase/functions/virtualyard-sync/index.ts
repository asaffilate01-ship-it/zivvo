// VirtualYard pull-sync: imports a dealer's stock from VirtualYard DMS into Zivvo car_listings.
// Two-way: also pushes back recent enquiries/deposits via the companion `virtualyard-push` function.
//
// Auth: caller must be the dealer owner (or admin / service role) — verified via JWT claims.
// Body: { dealer_id: string, dry_run?: boolean }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VY_BASE = "https://dealers.virtualyard.co.uk/api/v2";

interface VyVehicle {
  id?: string | number;
  stockNo?: string;
  make?: string;
  model?: string;
  year?: number | string;
  price?: number | string;
  mileage?: number | string;
  fuel?: string;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  body?: string;
  colour?: string;
  color?: string;
  doors?: number | string;
  engineSize?: string;
  registration?: string;
  vin?: string;
  description?: string;
  location?: string;
  images?: string[];
  photos?: string[];
  features?: string[];
}

const norm = (v: any) => (v === undefined || v === null ? null : String(v).trim());
const num = (v: any) =>
  v === undefined || v === null || v === "" ? null : Number(String(v).replace(/[^0-9.-]/g, ""));

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    let userId: string | null = null;
    let isServiceRole = false;
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      // Service role JWTs may be passed for cron — detect by trying claims
      const { data } = await userClient.auth.getClaims(token);
      userId = data?.claims?.sub ?? null;
      isServiceRole = data?.claims?.role === "service_role";
    }

    const { dealer_id, dry_run } = await req.json();
    if (!dealer_id) {
      return new Response(JSON.stringify({ error: "dealer_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is dealer owner or admin/service role
    if (!isServiceRole) {
      const { data: dealer } = await admin
        .from("dealers")
        .select("user_id")
        .eq("id", dealer_id)
        .single();
      if (!dealer) {
        return new Response(JSON.stringify({ error: "Dealer not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roleRow } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (dealer.user_id !== userId && !roleRow) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: integration } = await admin
      .from("dealer_integrations")
      .select("*")
      .eq("dealer_id", dealer_id)
      .eq("provider", "virtualyard")
      .maybeSingle();

    if (!integration?.api_key || !integration.is_enabled || !integration.sync_pull) {
      return new Response(
        JSON.stringify({ error: "VirtualYard integration not configured or pull is disabled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Pull vehicles from VY
    const vyUrl = `${VY_BASE}/get.php?a=vehicles&key=${encodeURIComponent(integration.api_key)}&l=500`;
    const vyRes = await fetch(vyUrl);
    if (!vyRes.ok) {
      const errText = await vyRes.text();
      throw new Error(`VirtualYard API error [${vyRes.status}]: ${errText.slice(0, 200)}`);
    }
    const vyJson = await vyRes.json();
    const vehicles: VyVehicle[] = Array.isArray(vyJson) ? vyJson : vyJson.vehicles || vyJson.data || [];

    if (dry_run) {
      return new Response(JSON.stringify({ ok: true, dry_run: true, count: vehicles.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get dealer seller_id
    const { data: dealerRow } = await admin
      .from("dealers")
      .select("user_id, business_name, city")
      .eq("id", dealer_id)
      .single();

    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const v of vehicles) {
      try {
        const externalRef = String(v.stockNo || v.id || "");
        if (!externalRef) {
          failed++;
          continue;
        }
        const make = norm(v.make) || "";
        const model = norm(v.model) || "";
        const year = num(v.year);
        const price = num(v.price);

        if (!make || !model || !year || !price) {
          failed++;
          errors.push(`Skipped ${externalRef}: missing make/model/year/price`);
          continue;
        }

        const payload: Record<string, any> = {
          seller_id: dealerRow!.user_id,
          dealer_id,
          source: "virtualyard",
          external_ref: externalRef,
          source_synced_at: new Date().toISOString(),
          title: `${year} ${make} ${model}`.trim(),
          make,
          model,
          year,
          price,
          mileage: num(v.mileage),
          fuel_type: norm(v.fuelType || v.fuel),
          transmission: norm(v.transmission),
          body_type: norm(v.bodyType || v.body),
          color: norm(v.colour || v.color),
          doors: num(v.doors),
          engine_size: norm(v.engineSize),
          registration: norm(v.registration),
          vin: norm(v.vin),
          description: norm(v.description),
          location: norm(v.location) || dealerRow!.city || null,
          images: Array.isArray(v.images) ? v.images : Array.isArray(v.photos) ? v.photos : [],
          features: Array.isArray(v.features) ? v.features : [],
          country: "GB",
          status: "active",
        };

        const { data: existing } = await admin
          .from("car_listings")
          .select("id")
          .eq("dealer_id", dealer_id)
          .eq("source", "virtualyard")
          .eq("external_ref", externalRef)
          .maybeSingle();

        if (existing) {
          const { error: upErr } = await admin
            .from("car_listings")
            .update(payload)
            .eq("id", existing.id);
          if (upErr) throw upErr;
          updated++;
        } else {
          const { error: insErr } = await admin.from("car_listings").insert(payload);
          if (insErr) throw insErr;
          created++;
        }
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(msg);
      }
    }

    // 3. Update integration + log
    await admin
      .from("dealer_integrations")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: failed > 0 ? "partial" : "success",
        last_sync_error: errors.slice(0, 5).join(" | ") || null,
        vehicles_imported: created + updated,
      })
      .eq("id", integration.id);

    await admin.from("dms_sync_logs").insert({
      dealer_id,
      provider: "virtualyard",
      direction: "pull",
      status: failed > 0 ? "partial" : "success",
      items_processed: vehicles.length,
      items_created: created,
      items_updated: updated,
      items_failed: failed,
      error_message: errors.slice(0, 5).join(" | ") || null,
    });

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
    console.error("[virtualyard-sync] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
