import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(JSON.stringify({ error: "lat and lng required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ city: "your area" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=locality|postal_town|administrative_area_level_2&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    let city = "your area";
    if (data.status === "OK" && data.results?.length > 0) {
      // Extract city from address components
      for (const result of data.results) {
        for (const component of result.address_components || []) {
          if (
            component.types.includes("locality") ||
            component.types.includes("postal_town")
          ) {
            city = component.long_name;
            break;
          }
        }
        if (city !== "your area") break;
      }
      // Fallback to admin area level 2
      if (city === "your area") {
        for (const result of data.results) {
          for (const component of result.address_components || []) {
            if (component.types.includes("administrative_area_level_2")) {
              city = component.long_name;
              break;
            }
          }
          if (city !== "your area") break;
        }
      }
    }

    return new Response(JSON.stringify({ city }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
