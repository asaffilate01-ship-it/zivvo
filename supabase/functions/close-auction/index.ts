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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Find auctions that have ended
    const { data: endedAuctions, error: fetchError } = await supabase
      .from("auctions")
      .select("*, car_listings!inner(title, make, model, year, registration, vin, mileage)")
      .eq("status", "live")
      .lte("ends_at", new Date().toISOString());

    if (fetchError) throw fetchError;
    if (!endedAuctions || endedAuctions.length === 0) {
      return new Response(JSON.stringify({ message: "No auctions to close", closed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let closedCount = 0;

    for (const auction of endedAuctions) {
      const reserveMet = !auction.reserve_price || (auction.current_bid >= auction.reserve_price);
      const hasBids = auction.bid_count > 0;

      const newStatus = hasBids && reserveMet ? "sold" : hasBids ? "reserve_not_met" : "ended";

      // Update auction status
      await supabase.from("auctions").update({ status: newStatus }).eq("id", auction.id);

      // Audit log
      await supabase.from("auction_audit_log").insert({
        auction_id: auction.id,
        actor_id: null,
        actor_role: "system",
        action: "auction_closed",
        details: {
          final_bid: auction.current_bid,
          bid_count: auction.bid_count,
          reserve_met: reserveMet,
          status: newStatus,
        },
      });

      if (newStatus === "sold" && auction.winning_bid_id) {
        // Get winning bid
        const { data: winningBid } = await supabase
          .from("auction_bids")
          .select("*")
          .eq("id", auction.winning_bid_id)
          .single();

        if (winningBid) {
          const hammerPrice = winningBid.amount;
          const buyerPremium = hammerPrice * (auction.buyer_premium_pct / 100);
          const sellerFee = hammerPrice * (auction.seller_fee_pct / 100);
          const totalAmount = hammerPrice + buyerPremium;
          const platformRevenue = buyerPremium + sellerFee;

          // Create payment protection record
          await supabase.from("auction_escrow").insert({
            auction_id: auction.id,
            buyer_id: winningBid.bidder_id,
            seller_id: auction.seller_id,
            total_amount: totalAmount,
            buyer_premium: buyerPremium,
            seller_fee: sellerFee,
            platform_revenue: platformRevenue,
            status: "pending_deposit",
          });

          // Generate contract
          const listing = auction.car_listings as any;
          const contractHtml = `
            <h2 style="font-weight:bold;font-size:18px;margin-bottom:16px;">Vehicle Sale Agreement</h2>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Auction ID:</strong> ${auction.id}</p>
            <hr style="margin:12px 0;"/>
            <p><strong>Vehicle:</strong> ${listing?.year} ${listing?.make} ${listing?.model}</p>
            <p><strong>Registration:</strong> ${listing?.registration || "N/A"}</p>
            <p><strong>VIN:</strong> ${listing?.vin || "N/A"}</p>
            <p><strong>Mileage:</strong> ${listing?.mileage?.toLocaleString() || "N/A"}</p>
            <hr style="margin:12px 0;"/>
            <p><strong>Hammer Price:</strong> ${hammerPrice.toFixed(2)}</p>
            <p><strong>Buyer Premium (${auction.buyer_premium_pct}%):</strong> ${buyerPremium.toFixed(2)}</p>
            <p><strong>Total Due from Buyer:</strong> ${totalAmount.toFixed(2)}</p>
            <p><strong>Seller Fee (${auction.seller_fee_pct}%):</strong> ${sellerFee.toFixed(2)}</p>
            <p><strong>Seller Receives:</strong> ${(hammerPrice - sellerFee).toFixed(2)}</p>
            <hr style="margin:12px 0;"/>
            <h3 style="font-weight:bold;">Terms & Conditions</h3>
            <ol style="padding-left:20px;font-size:13px;">
              <li>The Seller agrees to transfer the vehicle to the Buyer upon receipt of full payment and completion of all handover requirements.</li>
              <li>The Buyer agrees to pay the Total Due within 72 hours of auction close.</li>
              <li>Funds are held in escrow and released to the Seller only upon: (a) V5C/logbook transfer, (b) key handover, and (c) mutual contract signing.</li>
              <li>The vehicle is sold as described in the inspection and condition report. The platform makes no additional warranty unless explicitly stated.</li>
              <li>Delivery via logistics partners is at additional cost to the Buyer if arranged.</li>
              <li>This agreement is legally binding upon digital signature by both parties. IP addresses and timestamps are recorded for audit purposes.</li>
              <li>Any disputes shall be resolved through the platform's dispute resolution process.</li>
            </ol>
          `;

          await supabase.from("auction_contracts").insert({
            auction_id: auction.id,
            buyer_id: winningBid.bidder_id,
            seller_id: auction.seller_id,
            contract_html: contractHtml,
            status: "pending_buyer",
          });

          // Notify buyer and seller
          await supabase.from("notifications").insert([
            {
              user_id: winningBid.bidder_id,
              type: "auction",
              title: "🎉 You won the auction!",
              message: `You won ${listing?.year} ${listing?.make} ${listing?.model} for ${hammerPrice.toFixed(2)}. Please review and sign the contract.`,
              link: `/auction/${auction.id}`,
            },
            {
              user_id: auction.seller_id,
              type: "auction",
              title: "🔨 Your car has been sold!",
              message: `Your ${listing?.year} ${listing?.make} ${listing?.model} sold for ${hammerPrice.toFixed(2)}. Please review and sign the contract.`,
              link: `/auction/${auction.id}`,
            },
          ]);

          // Audit
          await supabase.from("auction_audit_log").insert({
            auction_id: auction.id,
            actor_role: "system",
            action: "sale_completed",
            details: {
              winner_id: winningBid.bidder_id,
              hammer_price: hammerPrice,
              buyer_premium: buyerPremium,
              seller_fee: sellerFee,
              total_amount: totalAmount,
            },
          });
        }
      }

      // Notify watchers if reserve not met
      if (newStatus === "reserve_not_met") {
        await supabase.from("notifications").insert({
          user_id: auction.seller_id,
          type: "auction",
          title: "Reserve price not met",
          message: `Your auction for ${(auction.car_listings as any)?.title} ended but the reserve was not met. Highest bid: ${auction.current_bid}`,
          link: `/auction/${auction.id}`,
        });
      }

      closedCount++;
      console.log(`✅ Auction ${auction.id} closed → ${newStatus}`);
    }

    // Also notify watchers/bidders of auctions ending within 1 hour
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { data: endingSoon } = await supabase
      .from("auctions")
      .select("id, ends_at, car_listings!inner(title, make, model, year)")
      .eq("status", "live")
      .lte("ends_at", oneHourFromNow)
      .gt("ends_at", new Date().toISOString());

    for (const soon of endingSoon || []) {
      // Check if we already notified (avoid duplicate notifications by checking recent ones)
      const listing = soon.car_listings as any;
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("type", "auction")
        .ilike("title", "%ending soon%")
        .eq("link", `/auction/${soon.id}`)
        .gte("created_at", new Date(Date.now() - 3600000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Notify watchers
      const { data: watchers } = await supabase
        .from("auction_watchers")
        .select("user_id")
        .eq("auction_id", soon.id);

      if (watchers?.length) {
        await supabase.from("notifications").insert(
          watchers.map((w) => ({
            user_id: w.user_id,
            type: "auction",
            title: "Auction ending soon! ⏰",
            message: `${listing?.year} ${listing?.make} ${listing?.model} ends in less than 1 hour.`,
            link: `/auction/${soon.id}`,
          }))
        );
      }
    }

    return new Response(JSON.stringify({ success: true, closed: closedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[CLOSE-AUCTION] ERROR: ${msg}`);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
