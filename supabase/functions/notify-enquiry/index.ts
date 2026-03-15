import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NOTIFY-ENQUIRY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { enquiryId } = await req.json();
    if (!enquiryId) throw new Error("enquiryId is required");

    // Fetch enquiry details with listing info
    const { data: enquiry, error: eErr } = await supabase
      .from("enquiries")
      .select("*, car_listings(title, make, model, year, seller_id)")
      .eq("id", enquiryId)
      .single();

    if (eErr || !enquiry) throw new Error("Enquiry not found");
    logStep("Enquiry fetched", { id: enquiryId });

    // Get seller profile
    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", enquiry.seller_id)
      .maybeSingle();

    // Get seller email from auth
    const { data: sellerAuth } = await supabase.auth.admin.getUserById(enquiry.seller_id);
    const sellerEmail = sellerAuth?.user?.email;
    const sellerName = sellerProfile?.full_name || "Seller";

    if (!sellerEmail) {
      logStep("No seller email found, skipping notification");
      return new Response(JSON.stringify({ success: false, reason: "no_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const listingTitle = enquiry.car_listings?.title || 
      `${enquiry.car_listings?.year} ${enquiry.car_listings?.make} ${enquiry.car_listings?.model}`;

    logStep("Notification prepared", { 
      sellerEmail, 
      sellerName, 
      listingTitle,
      senderName: enquiry.sender_name,
    });

    // Log the notification (in production, integrate with email service)
    // For now, we record that the notification was triggered
    console.log(`📧 ENQUIRY NOTIFICATION:
      To: ${sellerName} <${sellerEmail}>
      Subject: New enquiry for "${listingTitle}"
      From Buyer: ${enquiry.sender_name || "Anonymous"} (${enquiry.sender_email || "no email"})
      Message: ${enquiry.message?.substring(0, 100)}...
    `);

    return new Response(JSON.stringify({ 
      success: true, 
      notified: sellerEmail,
      listing: listingTitle,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
