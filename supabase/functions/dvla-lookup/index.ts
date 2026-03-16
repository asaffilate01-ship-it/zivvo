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
    const DVLA_API_KEY = Deno.env.get("DVLA_API_KEY");
    if (!DVLA_API_KEY) {
      throw new Error("DVLA_API_KEY is not configured. Register at https://developer-portal.driver-vehicle-licensing.api.gov.uk/");
    }

    const { registration } = await req.json();
    if (!registration) {
      throw new Error("Registration number is required");
    }

    // Clean registration (remove spaces)
    const cleanReg = registration.replace(/\s+/g, "").toUpperCase();

    // DVLA Vehicle Enquiry Service API
    const response = await fetch(
      "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
      {
        method: "POST",
        headers: {
          "x-api-key": DVLA_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registrationNumber: cleanReg }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 404) {
        throw new Error("Vehicle not found. Check the registration number.");
      }
      throw new Error(`DVLA API error [${response.status}]: ${errorBody}`);
    }

    const data = await response.json();

    const result = {
      registration: data.registrationNumber || cleanReg,
      make: data.make || null,
      colour: data.colour || null,
      fuel_type: data.fuelType || null,
      year_of_manufacture: data.yearOfManufacture || null,
      engine_capacity: data.engineCapacity ? `${data.engineCapacity}cc` : null,
      co2_emissions: data.co2Emissions || null,
      tax_status: data.taxStatus || null,
      tax_due_date: data.taxDueDate || null,
      mot_status: data.motStatus || null,
      mot_expiry_date: data.motExpiryDate || null,
      date_of_last_v5c: data.dateOfLastV5CIssued || null,
      type_approval: data.typeApproval || null,
      wheelplan: data.wheelplan || null,
      month_of_first_registration: data.monthOfFirstRegistration || null,
      euro_status: data.euroStatus || null,
      marked_for_export: data.markedForExport || false,
    };

    console.log(`✅ DVLA lookup: ${cleanReg} → ${result.make} ${result.colour} (${result.year_of_manufacture})`);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[DVLA-LOOKUP] ERROR: ${errorMessage}`);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
