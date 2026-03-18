import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus, Award, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

type PriceRating = "great" | "good" | "fair" | "high";

interface PriceIndicatorBadgeProps {
  price: number;
  make: string;
  model: string;
  year: number;
  mileage?: number | null;
  country?: string;
  className?: string;
}

const ratingConfig: Record<PriceRating, { label: string; icon: typeof Award; className: string }> = {
  great: { label: "Great Price", icon: Award, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  good: { label: "Good Price", icon: TrendingDown, className: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20" },
  fair: { label: "Fair Price", icon: Minus, className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  high: { label: "Above Market", icon: TrendingUp, className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20" },
};

// Simple in-memory cache to avoid repeated AI calls for the same vehicle
const priceCache = new Map<string, { rating: PriceRating; explanation: string; market_average: number }>();

const PriceIndicatorBadge = ({ price, make, model, year, mileage, country = "GB", className = "" }: PriceIndicatorBadgeProps) => {
  const [result, setResult] = useState<{ rating: PriceRating; explanation: string; market_average: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!make || !model || !year || !price) return;

    const cacheKey = `${make}-${model}-${year}-${mileage || 0}-${price}-${country}`;

    if (priceCache.has(cacheKey)) {
      setResult(priceCache.get(cacheKey)!);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase.functions
      .invoke("price-check", {
        body: { make, model, year, mileage, price, country },
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data?.rating) {
          const res = { rating: data.rating as PriceRating, explanation: data.explanation || "", market_average: data.market_average || 0 };
          priceCache.set(cacheKey, res);
          setResult(res);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [make, model, year, mileage, price, country]);

  if (loading) {
    return (
      <Badge variant="outline" className={`text-[10px] text-muted-foreground gap-0.5 ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking...
      </Badge>
    );
  }

  if (!result) return null;

  const config = ratingConfig[result.rating];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${config.className} text-[10px] font-semibold gap-0.5 cursor-help ${className}`}>
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="text-xs max-w-[220px]">
          <p>{result.explanation}</p>
          {result.market_average > 0 && (
            <p className="mt-1 text-muted-foreground">Market avg: £{result.market_average.toLocaleString()}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PriceIndicatorBadge;
