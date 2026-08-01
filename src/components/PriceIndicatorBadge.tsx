import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus, Award, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";


type PriceRating = "great" | "good" | "fair" | "high";

type PriceCheckResult = {
  rating: PriceRating;
  explanation: string;
  market_average: number;
  source?: "ai" | "fallback";
  warning?: string;
};

interface PriceIndicatorBadgeProps {
  price: number;
  make: string;
  model: string;
  year: number;
  mileage?: number | null;
  country?: string;
  className?: string;
}

const ratingConfig: Record<PriceRating, { labelKey: string; icon: typeof Award; className: string }> = {
  great: { labelKey: "priceIndicator.great", icon: Award, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  good: { labelKey: "priceIndicator.good", icon: TrendingDown, className: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20" },
  fair: { labelKey: "priceIndicator.fair", icon: Minus, className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  high: { labelKey: "priceIndicator.high", icon: TrendingUp, className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20" },
};


// In-memory caches to prevent duplicate checks and repeated failing calls
const priceCache = new Map<string, PriceCheckResult>();
const inFlightChecks = new Map<string, Promise<PriceCheckResult | null>>();
let aiCreditsExhausted = false;

const PriceIndicatorBadge = ({ price, make, model, year, mileage, country = "GB", className = "" }: PriceIndicatorBadgeProps) => {
  const { t } = useTranslation();
  const [result, setResult] = useState<PriceCheckResult | null>(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (!make || !model || !year || !price) return;

    const cacheKey = `${make}-${model}-${year}-${mileage || 0}-${price}-${country}`;

    if (priceCache.has(cacheKey)) {
      setResult(priceCache.get(cacheKey)!);
      return;
    }

    if (aiCreditsExhausted) {
      setResult(null);
      return;
    }

    let cancelled = false;

    if (inFlightChecks.has(cacheKey)) {
      setLoading(true);
      inFlightChecks
        .get(cacheKey)!
        .then((res) => {
          if (cancelled) return;
          if (res) setResult(res);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => { cancelled = true; };
    }

    setLoading(true);

    const requestPromise = supabase.functions
      .invoke("price-check", {
        body: { make, model, year, mileage, price, country },
      })
      .then(({ data, error }) => {
        if (error || data?.error) {
          const isCreditsError =
            data?.error === "AI credits exhausted" ||
            `${error?.message ?? ""}`.includes("402");

          if (isCreditsError) {
            aiCreditsExhausted = true;
          }

          return null;
        }

        if (data?.rating) {
          const res: PriceCheckResult = {
            rating: data.rating as PriceRating,
            explanation: data.explanation || "",
            market_average: data.market_average || 0,
            source: data.source,
            warning: data.warning,
          };

          if (data.warning === "AI credits exhausted") {
            aiCreditsExhausted = true;
          }

          priceCache.set(cacheKey, res);
          return res;
        }

        return null;
      })
      .catch(() => null);

    inFlightChecks.set(cacheKey, requestPromise);

    requestPromise
      .then((res) => {
        if (cancelled) return;
        if (res) setResult(res);
      })
      .finally(() => {
        inFlightChecks.delete(cacheKey);
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [make, model, year, mileage, price, country]);

  if (loading) {
    return (
      <Badge variant="outline" className={`text-[10px] text-muted-foreground gap-0.5 ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        {t("priceIndicator.checking")}
      </Badge>
    );
  }

  if (!result) return null;

  const config = ratingConfig[result.rating];
  const Icon = config.icon;
  const currencySymbol = country === "DE" ? "€" : country === "US" ? "$" : country === "AE" ? "AED " : country === "PK" ? "₨" : "£";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${config.className} text-[10px] font-semibold gap-0.5 cursor-help ${className}`}>
            <Icon className="h-3 w-3" />
            {t(config.labelKey)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="text-xs max-w-[220px]">
          <p>{result.explanation}</p>
          {result.market_average > 0 && (
            <p className="mt-1 text-muted-foreground">{t("priceIndicator.marketAvg")}: {currencySymbol}{result.market_average.toLocaleString()}</p>

          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PriceIndicatorBadge;
