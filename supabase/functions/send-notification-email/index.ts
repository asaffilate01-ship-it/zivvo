import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { type, user_id, data } = await req.json();

    // Get user email
    const { data: { user } } = await supabase.auth.admin.getUserById(user_id);
    if (!user?.email) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Create in-app notification based on type
    let notification: { title: string; message: string; link: string; type: string } | null = null;

    switch (type) {
      case "outbid":
        notification = {
          type: "auction",
          title: "You've been outbid! 🔔",
          message: `Someone placed a higher bid of £${data.new_bid} on ${data.car_title}. Your bid was £${data.your_bid}.`,
          link: `/auction/${data.auction_id}`,
        };
        break;

      case "auction_won":
        notification = {
          type: "auction",
          title: "Congratulations — You won! 🎉",
          message: `You won the auction for ${data.car_title} with a bid of £${data.winning_bid}. Complete payment within 72 hours.`,
          link: `/auction/${data.auction_id}`,
        };
        break;

      case "payment_reminder":
        notification = {
          type: "payment",
          title: "Payment Reminder ⏰",
          message: `Your payment deadline for ${data.car_title} is approaching. Please complete payment to secure your purchase.`,
          link: `/auction/${data.auction_id}`,
        };
        break;

      case "seller_offer":
        notification = {
          type: "arbitrage",
          title: "New Offer for Your Vehicle 📋",
          message: `You've received an offer of £${data.offer_amount} for your ${data.car_title}. Review and respond.`,
          link: "/trade-stock",
        };
        break;

      case "deal_completed":
        notification = {
          type: "arbitrage",
          title: "Deal Completed ✅",
          message: `Your trade stock deal for ${data.car_title} has been completed. Payment of £${data.amount} has been processed.`,
          link: "/trade-stock",
        };
        break;

      case "delivery_update":
        notification = {
          type: "delivery",
          title: `Delivery Update — ${data.status} 🚚`,
          message: `Delivery for ${data.car_title} is now ${data.status.replace(/_/g, " ")}.`,
          link: data.link || "/profile",
        };
        break;

      default:
        return new Response(JSON.stringify({ error: "Unknown notification type" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
    }

    if (notification) {
      await supabase.from("notifications").insert({
        user_id,
        ...notification,
      });
    }

    // Log for future email integration
    console.log(`[NOTIFICATION] Type: ${type}, User: ${user.email}, Title: ${notification?.title}`);

    return new Response(JSON.stringify({ success: true, email: user.email }), {
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
