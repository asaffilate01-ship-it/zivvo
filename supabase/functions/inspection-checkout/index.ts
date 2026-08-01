import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createStripeClient, resolveStripeEnv } from "../_shared/stripe.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: userData } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData.user;
    if (!user?.email) throw new Error("Not authenticated");

    const { listingId, inspectionType = "standard_200", buyerPhone, buyerAddress, buyerNotes } = await req.json();
    if (!listingId) throw new Error("listingId required");

    const { data: listing, error: lErr } = await supabaseAdmin
      .from("car_listings")
      .select("id, seller_id, title, make, model, year")
      .eq("id", listingId)
      .single();
    if (lErr || !listing) throw new Error("Listing not found");

    const price = inspectionType === "premium_300" ? 349 : 249;
    const productName = inspectionType === "premium_300" ? "Premium 300-point Inspection" : "200-point Vehicle Inspection";

    const stripe = createStripeClient(resolveStripeEnv());
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const { data: booking, error: bErr } = await supabaseAdmin
      .from("inspection_bookings")
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        inspection_type: inspectionType,
        price,
        currency: "GBP",
        buyer_phone: buyerPhone,
        buyer_address: buyerAddress,
        buyer_notes: buyerNotes,
      })
      .select()
      .single();
    if (bErr) throw bErr;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{
        price_data: {
          currency: "gbp",
          product_data: {
            name: productName,
            description: `For ${listing.year} ${listing.make} ${listing.model}`,
          },
          unit_amount: price * 100,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/inbox?inspection=success`,
      cancel_url: `${req.headers.get("origin")}/car/${listingId}?inspection=canceled`,
      metadata: {
        booking_id: booking.id,
        type: "inspection_booking",
        user_id: user.id,
      },
    });

    await supabaseAdmin
      .from("inspection_bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", booking.id);

    return new Response(JSON.stringify({ url: session.url, bookingId: booking.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[inspection-checkout]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
