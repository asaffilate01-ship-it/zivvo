import { HttpError, adminClient, env, safeError } from "../_shared/security.ts";

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[character]!));
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "GET") throw new HttpError(405, "Method not allowed");
    const origin = new URL(env("APP_URL")).origin;
    const admin = adminClient();
    const [{ data: listings, error: listingError }, { data: dealers, error: dealerError }] = await Promise.all([
      admin.from("car_listings_public").select("id,updated_at").order("updated_at", { ascending: false }).limit(10_000),
      admin.from("dealer_landing_public").select("slug").not("slug", "is", null).limit(5_000),
    ]);
    if (listingError || dealerError) throw listingError || dealerError;
    const staticPages = ["/", "/browse", "/dealers", "/auctions", "/sell", "/help", "/contact", "/privacy", "/terms", "/impressum"];
    const entries = staticPages.map((path) => `<url><loc>${escapeXml(`${origin}${path}`)}</loc></url>`);
    for (const listing of listings || []) {
      const date = listing.updated_at ? new Date(listing.updated_at).toISOString().slice(0, 10) : null;
      entries.push(`<url><loc>${escapeXml(`${origin}/car/${listing.id}`)}</loc>${date ? `<lastmod>${date}</lastmod>` : ""}</url>`);
    }
    for (const dealer of dealers || []) {
      if (dealer.slug) entries.push(`<url><loc>${escapeXml(`${origin}/dealer/${encodeURIComponent(dealer.slug)}`)}</loc></url>`);
    }
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join("")}</urlset>`;
    return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    return safeError(req, error);
  }
});
