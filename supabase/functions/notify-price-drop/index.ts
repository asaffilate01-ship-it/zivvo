import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { listing_id, old_price, new_price } = await req.json();
    if (!listing_id || !old_price || !new_price || new_price >= old_price) {
      return new Response(JSON.stringify({ skipped: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get listing details
    const { data: listing } = await supabase
      .from("car_listings")
      .select("make, model, year, title")
      .eq("id", listing_id)
      .single();

    if (!listing) {
      return new Response(JSON.stringify({ error: "Listing not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Find saved cars for this listing
    const { data: savedCars } = await supabase
      .from("saved_cars")
      .select("user_id")
      .eq("listing_id", listing_id);

    // Find saved searches that match this listing
    const { data: savedSearches } = await supabase
      .from("saved_searches")
      .select("user_id, name")
      .eq("notify", true);

    const userIds = new Set<string>();
    savedCars?.forEach((sc) => userIds.add(sc.user_id));

    // Check saved searches for make/model match
    savedSearches?.forEach((ss) => {
      try {
        const filters = typeof ss.filters === "string" ? JSON.parse(ss.filters) : ss.filters;
        const makeMatch = !filters.make || filters.make.toLowerCase() === listing.make.toLowerCase();
        const modelMatch = !filters.model || filters.model.toLowerCase() === listing.model.toLowerCase();
        if (makeMatch && modelMatch) userIds.add(ss.user_id);
      } catch {}
    });

    // Create notifications for all matching users
    const notifications = Array.from(userIds).map((userId) => ({
      user_id: userId,
      type: "price_drop",
      title: "Price Drop Alert! 🔥",
      message: `${listing.title || `${listing.year} ${listing.make} ${listing.model}`} dropped from $${Number(old_price).toLocaleString()} to $${Number(new_price).toLocaleString()}`,
      link: `/car/${listing_id}`,
    }));

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    return new Response(JSON.stringify({ notified: notifications.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
