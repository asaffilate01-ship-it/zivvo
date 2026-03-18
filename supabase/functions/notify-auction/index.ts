import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, auction_id, extra } = await req.json();
    console.log(`[NOTIFY-AUCTION] type=${type} auction_id=${auction_id}`);

    const { data: auction } = await supabase
      .from("auctions")
      .select("*, car_listings!inner(title, make, model, year)")
      .eq("id", auction_id)
      .single();

    if (!auction) throw new Error("Auction not found");
    const listing = auction.car_listings;
    const title = `${listing.year} ${listing.make} ${listing.model}`;

    switch (type) {
      case "outbid": {
        // Notify the user who was outbid
        const outbidUserId = extra?.outbid_user_id;
        if (outbidUserId) {
          await supabase.from("notifications").insert({
            user_id: outbidUserId,
            type: "auction",
            title: "You've been outbid! 🔨",
            message: `Someone placed a higher bid on ${title}. Current bid: ${extra?.current_bid || "N/A"}`,
            link: `/auction/${auction_id}`,
          });
        }
        break;
      }

      case "won": {
        // Notify the winner
        const winnerId = extra?.winner_id;
        if (winnerId) {
          await supabase.from("notifications").insert({
            user_id: winnerId,
            type: "auction",
            title: "Congratulations! You won! 🏆",
            message: `You won the auction for ${title}. Please complete payment and sign the contract.`,
            link: `/auction/${auction_id}`,
          });
        }
        // Notify the seller
        await supabase.from("notifications").insert({
          user_id: auction.seller_id,
          type: "auction",
          title: "Your auction has sold! 💰",
          message: `${title} has been sold. Check the contract and handover checklist.`,
          link: `/auction/${auction_id}`,
        });
        break;
      }

      case "ending_soon": {
        // Notify all watchers
        const { data: watchers } = await supabase
          .from("auction_watchers")
          .select("user_id")
          .eq("auction_id", auction_id);

        if (watchers?.length) {
          const notifications = watchers.map((w) => ({
            user_id: w.user_id,
            type: "auction",
            title: "Auction ending soon! ⏰",
            message: `${title} ends in less than 1 hour. Place your bid now!`,
            link: `/auction/${auction_id}`,
          }));
          await supabase.from("notifications").insert(notifications);
        }

        // Also notify bidders
        const { data: bidders } = await supabase
          .from("auction_bids")
          .select("bidder_id")
          .eq("auction_id", auction_id);
        
        if (bidders?.length) {
          const uniqueBidders = [...new Set(bidders.map((b) => b.bidder_id))];
          const bidderNotifs = uniqueBidders
            .filter((id) => !watchers?.some((w) => w.user_id === id))
            .map((uid) => ({
              user_id: uid,
              type: "auction",
              title: "Auction ending soon! ⏰",
              message: `${title} ends in less than 1 hour. Check your bid!`,
              link: `/auction/${auction_id}`,
            }));
          if (bidderNotifs.length) await supabase.from("notifications").insert(bidderNotifs);
        }
        break;
      }

      case "inspection_approved": {
        // Notify the seller their auction is approved and live
        await supabase.from("notifications").insert({
          user_id: auction.seller_id,
          type: "auction",
          title: "Auction Approved & Live! ✅",
          message: `Your ${title} has passed inspection and is now live for bidding.`,
          link: `/auction/${auction_id}`,
        });
        break;
      }

      case "contract_signed": {
        const signerId = extra?.signer_id;
        const otherPartyId = signerId === auction.seller_id ? extra?.buyer_id : auction.seller_id;
        if (otherPartyId) {
          await supabase.from("notifications").insert({
            user_id: otherPartyId,
            type: "auction",
            title: "Contract signed by other party ✍️",
            message: `The other party has signed the contract for ${title}. Please sign your part.`,
            link: `/auction/${auction_id}`,
          });
        }
        break;
      }

      case "escrow_released": {
        // Notify seller that funds are released
        await supabase.from("notifications").insert({
          user_id: auction.seller_id,
          type: "auction",
          title: "Funds Released! 💸",
          message: `Payment for ${title} has been released to you.`,
          link: `/auction/${auction_id}`,
        });
        break;
      }

      default:
        console.log(`Unknown notification type: ${type}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[NOTIFY-AUCTION] Error: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
