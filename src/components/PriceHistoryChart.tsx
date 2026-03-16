import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PriceChange {
  old_price: number;
  new_price: number;
  changed_at: string;
}

const PriceHistoryChart = ({ listingId, currentPrice }: { listingId: string; currentPrice: number }) => {
  const [history, setHistory] = useState<PriceChange[]>([]);
  const { config } = useCountry();

  useEffect(() => {
    supabase
      .from("price_history" as any)
      .select("old_price, new_price, changed_at")
      .eq("listing_id", listingId)
      .order("changed_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setHistory(data as any);
      });
  }, [listingId]);

  if (history.length === 0) return null;

  const firstPrice = history[history.length - 1]?.old_price || currentPrice;
  const totalChange = currentPrice - firstPrice;
  const percentChange = firstPrice > 0 ? ((totalChange / firstPrice) * 100).toFixed(1) : "0";

  return (
    <div className="mt-8">
      <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
        Price History
        {totalChange < 0 ? (
          <Badge variant="secondary" className="bg-success/10 text-success text-xs">
            <TrendingDown className="mr-1 h-3 w-3" /> {percentChange}%
          </Badge>
        ) : totalChange > 0 ? (
          <Badge variant="secondary" className="bg-destructive/10 text-destructive text-xs">
            <TrendingUp className="mr-1 h-3 w-3" /> +{percentChange}%
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            <Minus className="mr-1 h-3 w-3" /> No change
          </Badge>
        )}
      </h2>

      <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
        {history.map((h, i) => {
          const diff = h.new_price - h.old_price;
          const isDown = diff < 0;
          return (
            <div key={i} className={`flex items-center justify-between px-5 py-3 ${i % 2 === 0 ? "bg-muted/30" : ""}`}>
              <div className="flex items-center gap-2">
                {isDown ? (
                  <TrendingDown className="h-4 w-4 text-success" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-destructive" />
                )}
                <span className="text-sm text-muted-foreground">
                  {new Date(h.changed_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground line-through">{formatPrice(h.old_price, config)}</span>
                <span className="text-sm font-semibold text-card-foreground">{formatPrice(h.new_price, config)}</span>
                <span className={`text-xs font-medium ${isDown ? "text-success" : "text-destructive"}`}>
                  {isDown ? "" : "+"}{formatPrice(Math.abs(diff), config)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PriceHistoryChart;
