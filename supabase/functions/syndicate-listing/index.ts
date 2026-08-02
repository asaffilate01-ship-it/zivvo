import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Portal-specific formatting helpers
const formatForAutoTrader = (listing: any) => ({
  advertiser_id: null, // set from dealer config
  vehicle: {
    make: listing.make,
    model: listing.model,
    year: listing.year,
    mileage: listing.mileage,
    price: listing.price,
    fuel_type: listing.fuel_type,
    transmission: listing.transmission,
    body_type: listing.body_type,
    colour: listing.color,
    engine_size: listing.engine_size,
    doors: listing.doors,
    registration: listing.registration,
    description: listing.description,
    images: listing.images || [],
  },
});

const formatForEbayMotors = (listing: any) => ({
  title: listing.title,
  category_id: "6001", // eBay Motors > Cars
  condition: "Used",
  price: { value: listing.price, currency: "EUR" },
  description: listing.description || "",
  aspects: {
    Make: [listing.make],
    Model: [listing.model],
    Year: [String(listing.year)],
    Mileage: [listing.mileage ? `${listing.mileage} miles` : "N/A"],
    "Fuel Type": [listing.fuel_type || "N/A"],
    Transmission: [listing.transmission || "N/A"],
    "Body Type": [listing.body_type || "N/A"],
    "Exterior Colour": [listing.color || "N/A"],
    "Engine Size": [listing.engine_size || "N/A"],
  },
  images: (listing.images || []).map((url: string) => ({ imageUrl: url })),
});

const formatForPistonHeads = (listing: any) => ({
  make: listing.make,
  model: listing.model,
  year: listing.year,
  price: listing.price,
  currency: "EUR",
  mileage: listing.mileage,
  fuel: listing.fuel_type,
  gearbox: listing.transmission,
  body_style: listing.body_type,
  colour: listing.color,
  engine_cc: listing.engine_size,
  doors: listing.doors,
  registration: listing.registration,
  description: listing.description,
  photos: listing.images || [],
});

const formatForGumtree = (listing: any) => ({
  title: listing.title,
  description: listing.description,
  price: listing.price,
  category: "cars-vans-motorbikes/cars",
  attributes: {
    make: listing.make,
    model: listing.model,
    year: listing.year,
    mileage: listing.mileage,
    fuel_type: listing.fuel_type,
    transmission: listing.transmission,
    body_type: listing.body_type,
    colour: listing.color,
  },
  images: listing.images || [],
});

const formatForMotorsCoUk = (listing: any) => ({
  vehicle: {
    make: listing.make,
    model: listing.model,
    yearOfManufacture: listing.year,
    odometerReading: listing.mileage,
    fuelType: listing.fuel_type,
    transmission: listing.transmission,
    bodyType: listing.body_type,
    colour: listing.color,
    engineSize: listing.engine_size,
    numberOfDoors: listing.doors,
    registration: listing.registration,
  },
  advert: {
    price: listing.price,
    description: listing.description,
    images: listing.images || [],
  },
});

const portalFormatters: Record<string, (listing: any) => any> = {
  autotrader: formatForAutoTrader,
  ebay_motors: formatForEbayMotors,
  pistonheads: formatForPistonHeads,
  gumtree: formatForGumtree,
  motors_co_uk: formatForMotorsCoUk,
  cazoo: formatForAutoTrader, // similar format
};

// Portal API base URLs (placeholders — actual endpoints vary by partnership)
const portalEndpoints: Record<string, string> = {
  autotrader: "https://api.autotrader.co.uk/v1/stock",
  ebay_motors: "https://api.ebay.com/sell/inventory/v1/inventory_item",
  pistonheads: "https://api.pistonheads.com/v1/listings",
  gumtree: "https://api.gumtree.com/v1/listings",
  cazoo: "https://api.cazoo.co.uk/v1/vehicles",
  motors_co_uk: "https://api.motors.co.uk/v1/adverts",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Not authenticated");

    const { listing_id, portals, action = "sync" } = await req.json();
    if (!listing_id) throw new Error("listing_id is required");

    // Get listing
    const { data: listing, error: listingErr } = await supabase
      .from("car_listings")
      .select("*")
      .eq("id", listing_id)
      .single();
    if (listingErr || !listing) throw new Error("Listing not found");

    // Verify ownership
    if (listing.seller_id !== user.id) {
      // Check if admin
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) throw new Error("Not authorized");
    }

    // Get dealer
    const { data: dealer } = await supabase
      .from("dealers")
      .select("id")
      .eq("user_id", listing.seller_id)
      .maybeSingle();
    if (!dealer) throw new Error("Dealer account required for syndication");

    // Get portal configs for this dealer
    const { data: portalConfigs } = await supabase
      .from("dealer_portal_configs")
      .select("*")
      .eq("dealer_id", dealer.id)
      .eq("is_enabled", true);

    if (!portalConfigs || portalConfigs.length === 0) {
      return new Response(JSON.stringify({ error: "No portals configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter to requested portals if specified
    const targetConfigs = portals
      ? portalConfigs.filter((c: any) => portals.includes(c.portal))
      : portalConfigs;

    const results: Record<string, any> = {};

    for (const config of targetConfigs) {
      const portal = config.portal as string;
      const formatter = portalFormatters[portal];
      if (!formatter) {
        results[portal] = { success: false, error: "Unsupported portal" };
        continue;
      }

      try {
        const payload = formatter(listing);
        // Inject dealer-specific reference
        if (config.dealer_ref) {
          payload.advertiser_id = config.dealer_ref;
        }

        const endpoint = portalEndpoints[portal];
        if (!endpoint || !config.api_key) {
          // No live API — log as pending for manual/feed-based sync
          await supabase.from("syndication_log").upsert({
            listing_id,
            dealer_id: dealer.id,
            portal,
            status: action === "remove" ? "removed" : "pending",
            updated_at: new Date().toISOString(),
            last_synced_at: new Date().toISOString(),
          }, { onConflict: "listing_id,portal" });

          results[portal] = {
            success: true,
            status: "pending",
            message: config.api_key
              ? "Queued for sync"
              : "API key not configured — listing queued. Set up API credentials in Portal Settings.",
          };
          continue;
        }

        // Live API push
        if (action === "remove") {
          // Check if we have an external ID
          const { data: existingLog } = await supabase
            .from("syndication_log")
            .select("external_id")
            .eq("listing_id", listing_id)
            .eq("portal", portal)
            .maybeSingle();

          if (existingLog?.external_id) {
            const deleteRes = await fetch(`${endpoint}/${existingLog.external_id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${config.api_key}`,
                "Content-Type": "application/json",
              },
            });
            await deleteRes.text();
          }

          await supabase.from("syndication_log").upsert({
            listing_id,
            dealer_id: dealer.id,
            portal,
            status: "removed",
            updated_at: new Date().toISOString(),
          }, { onConflict: "listing_id,portal" });

          results[portal] = { success: true, status: "removed" };
          continue;
        }

        // POST / PUT
        const existingLog = await supabase
          .from("syndication_log")
          .select("external_id")
          .eq("listing_id", listing_id)
          .eq("portal", portal)
          .maybeSingle();

        const method = existingLog?.data?.external_id ? "PUT" : "POST";
        const url = existingLog?.data?.external_id
          ? `${endpoint}/${existingLog.data.external_id}`
          : endpoint;

        const res = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${config.api_key}`,
            "Content-Type": "application/json",
            ...(config.api_secret ? { "X-API-Secret": config.api_secret } : {}),
          },
          body: JSON.stringify(payload),
        });

        const resBody = await res.text();

        if (res.ok) {
          let externalId = existingLog?.data?.external_id;
          try {
            const parsed = JSON.parse(resBody);
            externalId = parsed.id || parsed.advertId || parsed.listingId || externalId;
          } catch { /* ignore */ }

          await supabase.from("syndication_log").upsert({
            listing_id,
            dealer_id: dealer.id,
            portal,
            status: "synced",
            external_id: externalId,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            error_message: null,
          }, { onConflict: "listing_id,portal" });

          results[portal] = { success: true, status: "synced", external_id: externalId };
        } else {
          await supabase.from("syndication_log").upsert({
            listing_id,
            dealer_id: dealer.id,
            portal,
            status: "failed",
            error_message: `HTTP ${res.status}: ${resBody.slice(0, 500)}`,
            updated_at: new Date().toISOString(),
          }, { onConflict: "listing_id,portal" });

          results[portal] = { success: false, status: "failed", error: `HTTP ${res.status}` };
        }
      } catch (err: any) {
        await supabase.from("syndication_log").upsert({
          listing_id,
          dealer_id: dealer.id,
          portal,
          status: "failed",
          error_message: err.message,
          updated_at: new Date().toISOString(),
        }, { onConflict: "listing_id,portal" });

        results[portal] = { success: false, error: err.message };
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("syndicate-listing error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
