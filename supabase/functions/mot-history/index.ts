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
    const MOT_API_KEY = Deno.env.get("MOT_API_KEY");
    if (!MOT_API_KEY) {
      throw new Error("MOT_API_KEY is not configured. Register at https://dvsa.github.io/mot-history-api-documentation/");
    }

    const { registration } = await req.json();
    if (!registration) {
      throw new Error("Registration number is required");
    }

    const cleanReg = registration.replace(/\s+/g, "").toUpperCase();

    // DVSA MOT History API v1
    const response = await fetch(
      `https://beta.check-mot.service.gov.uk/trade/vehicles/mot-tests?registration=${encodeURIComponent(cleanReg)}`,
      {
        headers: {
          "Accept": "application/json+v6",
          "x-api-key": MOT_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 404) {
        throw new Error("No MOT history found for this registration.");
      }
      throw new Error(`MOT API error [${response.status}]: ${errorBody}`);
    }

    const data = await response.json();
    const vehicle = Array.isArray(data) ? data[0] : data;

    if (!vehicle) {
      throw new Error("No MOT data returned");
    }

    // Extract MOT test history
    const tests = (vehicle.motTests || []).map((test: any) => ({
      completed_date: test.completedDate || null,
      test_result: test.testResult || null,
      expiry_date: test.expiryDate || null,
      odometer_value: test.odometerValue || null,
      odometer_unit: test.odometerUnit || null,
      defects: (test.defects || test.rfrAndComments || []).map((d: any) => ({
        text: d.text || d.comment || "",
        type: d.type || d.dangerous ? "DANGEROUS" : d.type || "ADVISORY",
      })),
    }));

    const result = {
      registration: vehicle.registration || cleanReg,
      make: vehicle.make || null,
      model: vehicle.model || null,
      first_used_date: vehicle.firstUsedDate || null,
      fuel_type: vehicle.fuelType || null,
      primary_colour: vehicle.primaryColour || null,
      total_tests: tests.length,
      latest_result: tests[0]?.test_result || null,
      latest_expiry: tests[0]?.expiry_date || null,
      latest_mileage: tests[0]?.odometer_value || null,
      tests: tests.slice(0, 10), // Last 10 tests
    };

    console.log(`✅ MOT history: ${cleanReg} → ${result.total_tests} tests, latest: ${result.latest_result}`);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[MOT-HISTORY] ERROR: ${errorMessage}`);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
