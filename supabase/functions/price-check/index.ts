import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

type PriceRating = "great" | "good" | "fair" | "high";

interface PriceCheckResult {
  rating: PriceRating;
  market_average: number;
  market_low: number;
  market_high: number;
  explanation: string;
  source: "ai" | "fallback";
  warning?: string;
}

const allowedRatings = new Set<PriceRating>(["great", "good", "fair", "high"]);

const roundTo = (value: number, step = 50) => Math.max(step, Math.round(value / step) * step);

const buildFallbackEstimate = ({
  make,
  model,
  year,
  mileage,
  price,
}: {
  make: string;
  model: string;
  year: number;
  mileage?: number | null;
  price: number;
}): Omit<PriceCheckResult, "source" | "warning"> => {
  const currentYear = new Date().getUTCFullYear();
  const age = Math.max(0, currentYear - Number(year || currentYear));
  const agePenalty = Math.min(0.45, age * 0.045);
  const mileageValue = Number(mileage ?? 0);
  const mileagePenalty = Math.min(0.18, mileageValue / 100000 * 0.18);
  const baselineMarket = Math.max(1000, Number(price) * (1 + agePenalty + mileagePenalty));
  const spread = Math.max(1500, baselineMarket * 0.12);
  const marketLow = Math.max(500, baselineMarket - spread);
  const marketHigh = baselineMarket + spread;
  const ratio = Number(price) / baselineMarket;

  let rating: PriceRating = "fair";
  if (ratio <= 0.85) rating = "great";
  else if (ratio <= 0.95) rating = "good";
  else if (ratio > 1.05) rating = "high";

  return {
    rating,
    market_average: roundTo(baselineMarket),
    market_low: roundTo(marketLow),
    market_high: roundTo(marketHigh),
    explanation: `${year} ${make} ${model} estimated using fallback pricing due to temporary AI unavailability.`,
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { make, model, year, mileage, price, country } = await req.json();

    if (!make || !model || !year || !price) {
      return new Response(JSON.stringify({ error: "make, model, year, price required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fallback = buildFallbackEstimate({ make, model, year, mileage, price });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const countryContext = country === "GB"
      ? "UK car market (AutoTrader UK, CarGurus UK, Cinch, Cazoo, Motors.co.uk, AA Cars)"
      : country === "US"
      ? "US car market (AutoTrader, CarGurus, Cars.com, CarMax, Carvana, KBB)"
      : country === "PK"
      ? "Pakistan car market (PakWheels, OLX Pakistan)"
      : "UAE car market (Dubizzle, CarSwitch, YallaMotor)";

    const mileageStr = mileage ? `${mileage.toLocaleString()} ${country === "GB" || country === "US" ? "miles" : "km"}` : "unknown mileage";

    const prompt = `You are a car pricing expert. Analyse the current market price for a ${year} ${make} ${model} with ${mileageStr} in the ${countryContext}.

The seller is listing this car at ${price}.

Based on your knowledge of typical prices on major car listing sites for this exact make, model, year, and approximate mileage:

1. Estimate the market average price
2. Estimate the price range (low to high)
3. Rate this listing price as one of: "great" (15%+ below market), "good" (5-15% below), "fair" (within 5% of market), "high" (above market)
4. Brief one-line explanation

You MUST respond using the suggest_price_rating tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a car market pricing analyst. Always use the provided tool to return structured data." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_price_rating",
              description: "Return a structured price rating for a vehicle listing",
              parameters: {
                type: "object",
                properties: {
                  rating: { type: "string", enum: ["great", "good", "fair", "high"] },
                  market_average: { type: "number", description: "Estimated market average price" },
                  market_low: { type: "number", description: "Estimated low end of market range" },
                  market_high: { type: "number", description: "Estimated high end of market range" },
                  explanation: { type: "string", description: "Brief one-line explanation of the rating" },
                },
                required: ["rating", "market_average", "market_low", "market_high", "explanation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_price_rating" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again shortly" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({
          ...fallback,
          source: "fallback",
          warning: "AI credits exhausted",
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({
        ...fallback,
        source: "fallback",
        warning: "AI unavailable",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({
        ...fallback,
        source: "fallback",
        warning: "AI response missing",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments) as Partial<PriceCheckResult>;
    const normalized: PriceCheckResult = {
      rating: allowedRatings.has(parsed.rating as PriceRating) ? (parsed.rating as PriceRating) : fallback.rating,
      market_average: Number(parsed.market_average) > 0 ? Number(parsed.market_average) : fallback.market_average,
      market_low: Number(parsed.market_low) > 0 ? Number(parsed.market_low) : fallback.market_low,
      market_high: Number(parsed.market_high) > 0 ? Number(parsed.market_high) : fallback.market_high,
      explanation: typeof parsed.explanation === "string" && parsed.explanation.trim().length > 0
        ? parsed.explanation
        : fallback.explanation,
      source: "ai",
    };

    return new Response(JSON.stringify(normalized), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("price-check error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
