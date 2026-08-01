import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, country } = await req.json();
    if (!address || typeof address !== "string" || address.length > 500) {
      return new Response(JSON.stringify({ error: "Valid address required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const gmKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!lovableKey || !gmKey) {
      return new Response(JSON.stringify({ error: "Google Maps connector not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = new URLSearchParams({ address });
    if (country) params.set("components", `country:${country}`);

    const res = await fetch(`${GATEWAY_URL}/maps/api/geocode/json?${params}`, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": gmKey,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Geocode gateway failed [${res.status}]: ${body}`);
      return new Response(
        JSON.stringify({ error: "Geocoding request failed", status: res.status, details: body }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) {
      return new Response(
        JSON.stringify({ found: false, status: data.status, message: data.error_message || null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const r = data.results[0];
    return new Response(
      JSON.stringify({
        found: true,
        lat: r.geometry.location.lat,
        lng: r.geometry.location.lng,
        formatted: r.formatted_address,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
