import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vin } = await req.json();
    if (!vin || vin.length !== 17) {
      throw new Error("A valid 17-character VIN is required");
    }

    // NHTSA VIN Decoder API — free, no key needed
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(vin)}?format=json`
    );

    if (!response.ok) {
      throw new Error(`NHTSA API error [${response.status}]`);
    }

    const data = await response.json();
    const result = data.Results?.[0];

    if (!result || result.ErrorCode === "1") {
      throw new Error(result?.ErrorText || "VIN not found in NHTSA database");
    }

    // Extract the useful fields
    const decoded = {
      make: result.Make || null,
      model: result.Model || null,
      year: result.ModelYear || null,
      body_type: result.BodyClass || null,
      fuel_type: result.FuelTypePrimary || null,
      engine_size: result.DisplacementL ? `${parseFloat(result.DisplacementL).toFixed(1)}L` : null,
      engine_cylinders: result.EngineCylinders || null,
      engine_hp: result.EngineHP || null,
      transmission: result.TransmissionStyle || null,
      drivetrain: result.DriveType || null,
      doors: result.Doors || null,
      plant_country: result.PlantCountry || null,
      plant_city: result.PlantCity || null,
      vehicle_type: result.VehicleType || null,
      gvwr: result.GVWR || null,
      error_code: result.ErrorCode,
      error_text: result.ErrorText,
    };

    console.log(`✅ NHTSA VIN decoded: ${vin} → ${decoded.year} ${decoded.make} ${decoded.model}`);

    return new Response(JSON.stringify({ success: true, data: decoded }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[NHTSA-VIN-DECODE] ERROR: ${errorMessage}`);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
