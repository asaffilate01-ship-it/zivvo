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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { enquiryId } = await req.json();
    if (!enquiryId) throw new Error("enquiryId is required");

    const { data: enquiry, error: eErr } = await supabase
      .from("enquiries")
      .select("*, car_listings(title, make, model, year, seller_id)")
      .eq("id", enquiryId)
      .single();

    if (eErr || !enquiry) throw new Error("Enquiry not found");

    const listingTitle = enquiry.car_listings?.title ||
      `${enquiry.car_listings?.year} ${enquiry.car_listings?.make} ${enquiry.car_listings?.model}`;

    const senderName = enquiry.sender_name || "Someone";

    // Insert in-app notification for the seller (service role bypasses RLS)
    await supabase.from("notifications").insert({
      user_id: enquiry.seller_id,
      type: "enquiry",
      title: `New enquiry for "${listingTitle}"`,
      message: `${senderName} sent you a message: "${enquiry.message?.substring(0, 120)}${enquiry.message?.length > 120 ? '...' : ''}"`,
      link: `/inbox`,
    });

    console.log(`✅ Notification created for seller ${enquiry.seller_id} - enquiry ${enquiryId}`);

    return new Response(JSON.stringify({ success: true, listing: listingTitle }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[NOTIFY-ENQUIRY] ERROR: ${errorMessage}`);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
