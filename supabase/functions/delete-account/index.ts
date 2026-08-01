import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    if (String(body.confirm ?? "").toUpperCase() !== "DELETE") {
      return new Response(JSON.stringify({ error: 'Confirmation required (confirm: "DELETE")' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Anonymise / remove personal data that is not cascade-deleted (DSGVO Art. 17)
    await supabase.from("car_listings").update({ status: "removed" }).eq("seller_id", user.id);
    await supabase.from("saved_searches").delete().eq("user_id", user.id);
    await supabase.from("saved_cars").delete().eq("user_id", user.id);
    await supabase.from("device_tokens").delete().eq("user_id", user.id);
    await supabase.from("notifications").delete().eq("user_id", user.id);
    await supabase.from("profiles").update({ full_name: "Gelöschter Nutzer", avatar_url: null }).eq("user_id", user.id);

    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
    if (delErr) throw delErr;

    console.log(`Account deleted: ${user.id}`);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("delete-account error", e);
    return new Response(JSON.stringify({ error: "Request failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
