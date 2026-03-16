import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_USERS = [
  { email: "buyer@autovault.test", password: "Test1234!", full_name: "Test Buyer", roles: ["buyer"] },
  { email: "seller@autovault.test", password: "Test1234!", full_name: "Test Seller", roles: ["buyer", "seller"] },
  { email: "dealer@autovault.test", password: "Test1234!", full_name: "Test Dealer", roles: ["buyer", "seller", "dealer"] },
  { email: "agent@autovault.test", password: "Test1234!", full_name: "Test Agent", roles: ["buyer", "agent"] },
  { email: "admin@autovault.test", password: "Test1234!", full_name: "Test Admin", roles: ["buyer", "admin"] },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: { email: string; status: string }[] = [];

    for (const user of TEST_USERS) {
      // Check if user exists
      const { data: existing } = await admin.auth.admin.listUsers();
      const found = existing?.users?.find((u: any) => u.email === user.email);

      if (found) {
        results.push({ email: user.email, status: "already_exists" });
        continue;
      }

      // Create user with auto-confirm
      const { data: created, error } = await admin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: { full_name: user.full_name },
        email_confirm: true,
      });

      if (error) {
        results.push({ email: user.email, status: `error: ${error.message}` });
        continue;
      }

      // Add roles (buyer is added by trigger, add others)
      for (const role of user.roles) {
        if (role === "buyer") continue; // added by handle_new_user trigger
        await admin.from("user_roles").insert({ user_id: created.user.id, role });
      }

      // If dealer, create dealer record
      if (user.roles.includes("dealer") && created.user) {
        await admin.from("dealers").insert({
          user_id: created.user.id,
          business_name: "Test Motors Ltd",
          slug: "test-motors",
          tier: "professional",
          subscription_status: "active",
          max_listings: 50,
          kyc_verified: true,
          country: "GB",
          city: "London",
          business_email: user.email,
        });
      }

      results.push({ email: user.email, status: "created" });
    }

    return new Response(JSON.stringify({ success: true, users: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
