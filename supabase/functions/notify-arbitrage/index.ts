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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { deal_id, action } = await req.json();
    if (!deal_id || !action) throw new Error("deal_id and action required");

    // Get the deal with listing info
    const { data: deal } = await supabaseAdmin
      .from("arbitrage_deals")
      .select("*, car_listings!inner(title, make, model, year)")
      .eq("id", deal_id)
      .single();

    if (!deal) throw new Error("Deal not found");

    const listing = deal.car_listings;
    const carTitle = `${listing.year} ${listing.make} ${listing.model}`;
    const notifications: Array<{ user_id: string; type: string; title: string; message: string; link: string }> = [];

    switch (action) {
      case "offer_sent":
        // Notify seller they have an offer
        notifications.push({
          user_id: deal.seller_id,
          type: "arbitrage",
          title: "New Trade Offer on Your Car 💰",
          message: `We'd like to purchase your ${carTitle} for £${deal.seller_price.toLocaleString()}. Review and respond in Trade Stock.`,
          link: "/trade-stock",
        });
        break;

      case "seller_accepted":
        // Notify admins
        const { data: admins } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");
        (admins || []).forEach((a) => {
          notifications.push({
            user_id: a.user_id,
            type: "arbitrage",
            title: "Seller Accepted Trade Offer ✅",
            message: `Seller accepted the offer for ${carTitle} at £${deal.seller_price.toLocaleString()}. Ready to list to dealers.`,
            link: "/trade-stock",
          });
        });
        break;

      case "seller_rejected":
        // Notify admins
        const { data: admins2 } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");
        (admins2 || []).forEach((a) => {
          notifications.push({
            user_id: a.user_id,
            type: "arbitrage",
            title: "Seller Declined Trade Offer ❌",
            message: `Seller rejected the offer for ${carTitle}. Reason: ${deal.rejection_reason || "Not specified"}`,
            link: "/trade-stock",
          });
        });
        break;

      case "listed_to_dealers":
        // Notify all active dealers
        const { data: dealers } = await supabaseAdmin
          .from("dealers")
          .select("user_id")
          .eq("is_active", true);
        (dealers || []).forEach((d) => {
          notifications.push({
            user_id: d.user_id,
            type: "arbitrage",
            title: "New Trade Stock Available 🚗",
            message: `${carTitle} is now available at trade price £${deal.dealer_price.toLocaleString()}. First come, first served.`,
            link: "/trade-stock",
          });
        });
        break;

      case "dealer_accepted":
        // Notify seller that a dealer was found
        notifications.push({
          user_id: deal.seller_id,
          type: "arbitrage",
          title: "Buyer Found for Your Car! 🎉",
          message: `A dealer has purchased your ${carTitle}. Your payment of £${deal.seller_price.toLocaleString()} will be processed shortly.`,
          link: "/trade-stock",
        });
        break;

      case "seller_paid":
        // Notify seller payment sent
        notifications.push({
          user_id: deal.seller_id,
          type: "arbitrage",
          title: "Payment Sent! 💸",
          message: `£${deal.seller_price.toLocaleString()} has been sent for your ${carTitle}. Ref: ${deal.seller_payment_ref || "Processing"}`,
          link: "/trade-stock",
        });
        break;

      case "completed":
        // Notify both parties
        notifications.push({
          user_id: deal.seller_id,
          type: "arbitrage",
          title: "Trade Deal Completed ✅",
          message: `The sale of your ${carTitle} is fully complete. Thank you!`,
          link: "/trade-stock",
        });
        if (deal.buyer_dealer_id) {
          const { data: buyerDealer } = await supabaseAdmin
            .from("dealers")
            .select("user_id")
            .eq("id", deal.buyer_dealer_id)
            .single();
          if (buyerDealer) {
            notifications.push({
              user_id: buyerDealer.user_id,
              type: "arbitrage",
              title: "Trade Stock Deal Completed ✅",
              message: `Your purchase of ${carTitle} is complete. The vehicle is ready for collection/delivery.`,
              link: "/trade-stock",
            });
          }
        }
        break;
    }

    // Insert all notifications
    if (notifications.length > 0) {
      await supabaseAdmin.from("notifications").insert(notifications);
    }

    return new Response(JSON.stringify({ sent: notifications.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
