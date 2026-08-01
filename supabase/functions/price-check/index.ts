import { HttpError, adminClient, consumeAnonymousRateLimit, json, parseJson, preflight, requirePost, safeError } from "../_shared/security.ts";

type Rating = "great" | "good" | "fair" | "high";

function percentile(sorted: number[], value: number): number {
  const index = (sorted.length - 1) * value;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function roundTo(value: number, step = 50): number {
  return Math.round(value / step) * step;
}

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const admin = adminClient();
    await consumeAnonymousRateLimit(req, admin, "price-check", 60, 3_600);
    const body = await parseJson(req);
    const make = typeof body.make === "string" ? body.make.trim() : "";
    const model = typeof body.model === "string" ? body.model.trim() : "";
    const year = Number(body.year);
    const hasPrice = body.price !== undefined && body.price !== null && body.price !== "";
    const price = hasPrice ? Number(body.price) : null;
    const priceIsValid = price !== null && Number.isFinite(price) && price > 0 && price <= 10_000_000;
    const currentYear = new Date().getUTCFullYear();
    if (!make || make.length > 80 || !model || model.length > 120 || !Number.isInteger(year) || year < 1886 || year > currentYear + 1 || (hasPrice && !priceIsValid)) {
      throw new HttpError(400, "Invalid vehicle details");
    }

    const { data, error } = await admin.from("car_listings")
      .select("price")
      .eq("status", "active")
      .eq("country", "DE")
      .ilike("make", make)
      .ilike("model", model)
      .gte("year", year - 2)
      .lte("year", year + 2)
      .gt("price", 100)
      .limit(60);
    if (error) throw error;
    const prices = (data || []).map((row) => Number(row.price)).filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
    if (prices.length < 3) {
      return json(req, { available: false, sample_size: prices.length, warning: "Zu wenige vergleichbare Zivvo-Angebote" });
    }

    const median = percentile(prices, 0.5);
    let rating: Rating | null = null;
    if (price !== null) {
      const ratio = price / median;
      rating = "fair";
      if (ratio <= 0.85) rating = "great";
      else if (ratio <= 0.95) rating = "good";
      else if (ratio > 1.05) rating = "high";
    }
    return json(req, {
      available: true,
      rating,
      market_average: roundTo(median),
      market_low: roundTo(percentile(prices, 0.25)),
      market_high: roundTo(percentile(prices, 0.75)),
      sample_size: prices.length,
      explanation: `Vergleich mit ${prices.length} aktiven Zivvo-Angeboten desselben Modells (±2 Baujahre).`,
      source: "zivvo_market",
      warning: "Indikativer Angebotsvergleich, keine Fahrzeugbewertung.",
    });
  } catch (error) {
    return safeError(req, error);
  }
});
