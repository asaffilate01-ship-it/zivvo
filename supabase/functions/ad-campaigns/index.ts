import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = admin();
    const url = new URL(req.url);

    // GET -> serve campaigns for a placement
    if (req.method === "GET") {
      const placement = url.searchParams.get("placement") ?? "browse_inline";
      const country = url.searchParams.get("country") ?? "DE";
      const limit = Math.min(Number(url.searchParams.get("limit") ?? 1) || 1, 10);
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("id, name, advertiser, image_url, link_url, html_snippet, weight")
        .eq("is_active", true)
        .eq("placement", placement)
        .in("country", [country, "ALL"])
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
        .limit(50);

      if (error) throw error;

      // Weighted random selection
      const pool: typeof data = [];
      for (const c of data ?? []) {
        for (let i = 0; i < Math.max(1, Math.min(c.weight ?? 1, 20)); i++) pool.push(c);
      }
      const picked: Record<string, unknown>[] = [];
      const seen = new Set<string>();
      while (pool.length && picked.length < limit) {
        const c = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        picked.push(c);
      }

      return new Response(JSON.stringify({ campaigns: picked }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST -> track impression / click
    const body = await req.json().catch(() => ({}));
    const campaignId = String(body.campaignId ?? "");
    const event = body.event === "click" ? "clicks" : "impressions";

    if (!/^[0-9a-f-]{36}$/i.test(campaignId)) {
      return new Response(JSON.stringify({ error: "campaignId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: current } = await supabase
      .from("ad_campaigns")
      .select("impressions, clicks")
      .eq("id", campaignId)
      .maybeSingle();

    if (current) {
      await supabase
        .from("ad_campaigns")
        .update({ [event]: (Number(current[event as "impressions" | "clicks"]) || 0) + 1 })
        .eq("id", campaignId);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ad-campaigns error", e);
    return new Response(JSON.stringify({ error: "Request failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
