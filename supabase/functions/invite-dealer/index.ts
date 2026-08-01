import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ROLES = ["owner", "manager", "sales", "viewer"];

function res(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return res({ error: "Method not allowed" }, 405);

  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!token) return res({ error: "Not authenticated" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (!user) return res({ error: "Not authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const dealerId = String(body.dealerId ?? "");
    const email = String(body.email ?? "").trim().toLowerCase();
    const fullName = body.fullName ? String(body.fullName).trim().slice(0, 100) : null;
    const role = ROLES.includes(String(body.role)) ? String(body.role) : "sales";

    if (!/^[0-9a-f-]{36}$/i.test(dealerId)) return res({ error: "Invalid dealerId" }, 400);
    if (!EMAIL.test(email)) return res({ error: "Invalid email" }, 400);

    // Only the dealer owner (or an admin) may invite staff
    const { data: dealer } = await supabase
      .from("dealers")
      .select("id, owner_id, business_name")
      .eq("id", dealerId)
      .maybeSingle();
    if (!dealer) return res({ error: "Dealer not found" }, 404);

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (dealer.owner_id !== user.id && !isAdmin) return res({ error: "Not authorised" }, 403);

    const { data: existing } = await supabase
      .from("dealer_staff")
      .select("id")
      .eq("dealer_id", dealerId)
      .eq("email", email)
      .maybeSingle();
    if (existing) return res({ error: "This person has already been invited" }, 409);

    const inviteToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

    const { data: staff, error } = await supabase
      .from("dealer_staff")
      .insert({
        dealer_id: dealerId,
        email,
        full_name: fullName,
        role,
        invite_token: inviteToken,
        is_active: true,
      })
      .select("id")
      .single();
    if (error) throw error;

    const appUrl = Deno.env.get("APP_URL") ?? "https://zivvo.de";
    const inviteUrl = `${appUrl}/dealer/invite?token=${inviteToken}`;

    // If the invitee already has an account, notify them in-app
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();
      if (profile?.user_id) {
        await supabase.from("notifications").insert({
          user_id: profile.user_id,
          type: "dealer_invite",
          title: "Einladung zum Händlerteam",
          message: `${dealer.business_name} hat Sie als ${role} eingeladen.`,
          link: `/dealer/invite?token=${inviteToken}`,
        });
      }
    } catch (_) {
      // non-blocking
    }

    console.log(`Dealer invite created for ${email} at dealer ${dealerId}`);

    return res({ ok: true, staffId: staff.id, inviteUrl });
  } catch (e) {
    console.error("invite-dealer error", e);
    return res({ error: "Request failed" }, 500);
  }
});
