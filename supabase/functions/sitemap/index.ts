import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const origin = req.headers.get("origin") || "https://zivvo.de";

  const { data: listings } = await supabase
    .from("car_listings")
    .select("id, updated_at, make, model, year")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1000);

  const { data: dealers } = await supabase
    .from("dealers_public")
    .select("slug, updated_at")
    .eq("is_active", true);

  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/browse", priority: "0.9", changefreq: "daily" },
    { loc: "/dealers", priority: "0.7", changefreq: "weekly" },
    { loc: "/blog", priority: "0.7", changefreq: "weekly" },
    { loc: "/valuation", priority: "0.6", changefreq: "monthly" },
    { loc: "/help", priority: "0.4", changefreq: "monthly" },
    { loc: "/contact", priority: "0.4", changefreq: "monthly" },
    { loc: "/privacy", priority: "0.2", changefreq: "yearly" },
    { loc: "/terms", priority: "0.2", changefreq: "yearly" },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  for (const page of staticPages) {
    xml += `
  <url>
    <loc>${origin}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }

  if (listings) {
    for (const l of listings) {
      xml += `
  <url>
    <loc>${origin}/car/${l.id}</loc>
    <lastmod>${new Date(l.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
  }

  if (dealers) {
    for (const d of dealers) {
      if (d.slug) {
        xml += `
  <url>
    <loc>${origin}/dealer/${d.slug}</loc>
    <lastmod>${new Date(d.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
      }
    }
  }

  xml += `
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
