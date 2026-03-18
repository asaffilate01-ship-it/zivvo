import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const HPI_API_KEY = Deno.env.get("HPI_API_KEY");
    if (!HPI_API_KEY) {
      throw new Error("HPI_API_KEY is not configured. Contact Cap HPI or your vehicle data provider for API access.");
    }

    // Authenticate user
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authentication required");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const { registration, vin } = await req.json();
    if (!registration && !vin) {
      throw new Error("Registration number or VIN is required");
    }

    // Cap HPI Enquiry API
    // Note: The actual endpoint and request format depends on your HPI contract.
    // This is the standard structure for Cap HPI vehicle data checks.
    const lookupParam = registration
      ? { vrm: registration.replace(/\s+/g, "").toUpperCase() }
      : { vin: vin };

    const response = await fetch(
      "https://api.cap-hpi.co.uk/vehicle-data/v1/enquiry",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HPI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...lookupParam,
          checks: [
            "finance",
            "stolen",
            "writeoff",
            "mileage",
            "plate",
            "condition",
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HPI API error [${response.status}]: ${errorBody}`);
    }

    const data = await response.json();

    const result = {
      registration: data.vrm || registration || null,
      vin: data.vin || vin || null,
      make: data.make || null,
      model: data.model || null,
      year: data.yearOfManufacture || null,
      colour: data.colour || null,
      finance_outstanding: data.finance?.outstanding ?? null,
      finance_agreement_count: data.finance?.agreementCount ?? null,
      stolen_status: data.stolen?.status ?? null,
      stolen_reported: data.stolen?.reported ?? false,
      write_off: data.writeoff?.category ?? null,
      write_off_date: data.writeoff?.date ?? null,
      mileage_anomaly: data.mileage?.anomaly ?? false,
      mileage_records: (data.mileage?.records || []).slice(0, 5),
      plate_changes: data.plate?.changes ?? [],
      previous_keepers: data.keepers?.count ?? null,
      import_export: data.importExport?.imported ?? false,
      scrapped: data.scrapped?.status ?? false,
      check_date: new Date().toISOString(),
    };

    console.log(`✅ HPI check: ${result.registration || result.vin} → finance: ${result.finance_outstanding}, stolen: ${result.stolen_reported}`);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[HPI-CHECK] ERROR: ${errorMessage}`);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
