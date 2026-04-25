// virtualyard-push: forwards a Zivvo enquiry/deposit/sell-my-car/finance lead to a dealer's
// VirtualYard account so it lands in their DMS inbox automatically.
//
// Body: { dealer_id, type: 'enquiry'|'deposit'|'sellmycar'|'finance', payload: {...} }
// payload depends on `type`. See VYAPI docs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VY_BASE = "https://dealers.virtualyard.co.uk/api/v2";

const ENDPOINTS: Record<string, string> = {
  enquiry: "sendenquiry",
  deposit: "senddeposit",
  sellmycar: "sendsellmycar",
  finance: "sendapplyfinance",
  update: "sendupdatevehicle",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { dealer_id, type, payload } = await req.json();
    if (!dealer_id || !type || !payload) {
      return new Response(JSON.stringify({ error: "dealer_id, type, payload required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const action = ENDPOINTS[type];
    if (!action) {
      return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: integration } = await admin
      .from("dealer_integrations")
      .select("*")
      .eq("dealer_id", dealer_id)
      .eq("provider", "virtualyard")
      .maybeSingle();

    if (!integration?.api_key || !integration.is_enabled || !integration.sync_push) {
      // Soft-fail — Zivvo data is still saved locally, we just don't push.
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: "VY push disabled or not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `${VY_BASE}/post.php?a=${action}&key=${encodeURIComponent(integration.api_key)}`;
    const formBody = new URLSearchParams();
    for (const [k, v] of Object.entries(payload)) {
      if (v !== undefined && v !== null) formBody.append(k, String(v));
    }

    const vyRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody.toString(),
    });
    const text = await vyRes.text();
    const ok = vyRes.ok;

    await admin.from("dms_sync_logs").insert({
      dealer_id,
      provider: "virtualyard",
      direction: "push",
      status: ok ? "success" : "error",
      items_processed: 1,
      items_created: ok ? 1 : 0,
      items_failed: ok ? 0 : 1,
      error_message: ok ? null : text.slice(0, 500),
      details: { type, action },
    });

    return new Response(JSON.stringify({ ok, response: text.slice(0, 1000) }), {
      status: ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[virtualyard-push] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
