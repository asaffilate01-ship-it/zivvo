import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Eye, Clock, BarChart3, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";

interface MarketInsightsProps {
  listingId: string;
  make: string;
  model: string;
  year: number;
  price: number;
}

interface InsightData {
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  totalListings: number;
  avgDaysOnMarket: number;
  demandScore: number;
  views: number;
  enquiries: number;
}

const MarketInsights = ({ listingId, make, model, year, price }: MarketInsightsProps) => {
  const { config } = useCountry();
  const [data, setData] = useState<InsightData | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      // Get similar listings for market comparison
      const { data: similar } = await supabase
        .from("car_listings_public")
        .select("price, created_at, views_count, enquiries_count")
        .eq("make", make)
        .eq("model", model)
        .gte("year", year - 1)
        .lte("year", year + 1)
        .eq("status", "active")
        .limit(50);

      if (!similar || similar.length === 0) return;

      const prices = similar.map((l) => l.price);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const totalViews = similar.reduce((a, l) => a + (l.views_count || 0), 0);
      const totalEnquiries = similar.reduce((a, l) => a + (l.enquiries_count || 0), 0);

      // Simple demand score: higher enquiry-to-listing ratio = higher demand
      const enquiryRate = similar.length > 0 ? totalEnquiries / similar.length : 0;
      const demandScore = Math.min(100, Math.round(enquiryRate * 10 + (totalViews / similar.length) * 0.5));

      // Avg days on market
      const now = Date.now();
      const avgDays = similar.reduce((a, l) => {
        const created = new Date(l.created_at).getTime();
        return a + (now - created) / (1000 * 60 * 60 * 24);
      }, 0) / similar.length;

      setData({
        avgPrice: Math.round(avgPrice),
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        totalListings: similar.length,
        avgDaysOnMarket: Math.round(avgDays),
        demandScore,
        views: totalViews,
        enquiries: totalEnquiries,
      });
    };

    fetchInsights();
  }, [make, model, year, listingId]);

  if (!data) return null;

  const priceDiff = price - data.avgPrice;
  const priceDiffPct = Math.round((priceDiff / data.avgPrice) * 100);
  const isAbove = priceDiff > 0;
  const demandLabel = data.demandScore >= 70 ? "High" : data.demandScore >= 40 ? "Medium" : "Low";
  const demandColor = data.demandScore >= 70 ? "text-emerald-600" : data.demandScore >= 40 ? "text-amber-600" : "text-red-600";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-display">
          <BarChart3 className="h-4 w-4 text-primary" />
          Market Insights
          <Badge variant="outline" className="text-[10px] ml-auto">{data.totalListings} similar listings</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price comparison */}
        <div className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Market Average</span>
            <span className="font-semibold">{formatPrice(data.avgPrice, config)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your Price</span>
            <span className="font-semibold">{formatPrice(price, config)}</span>
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${isAbove ? "text-red-600" : "text-emerald-600"}`}>
            {isAbove ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {Math.abs(priceDiffPct)}% {isAbove ? "above" : "below"} market
          </div>
          <div className="text-[11px] text-muted-foreground">
            Range: {formatPrice(data.minPrice, config)} – {formatPrice(data.maxPrice, config)}
          </div>
        </div>

        {/* Demand Score */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Flame className="h-3.5 w-3.5" /> Demand Score
            </span>
            <span className={`font-semibold ${demandColor}`}>{demandLabel} ({data.demandScore}/100)</span>
          </div>
          <Progress value={data.demandScore} className="h-2" />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-2.5 text-center">
            <Eye className="mx-auto h-4 w-4 text-muted-foreground" />
            <p className="mt-1 text-lg font-bold text-foreground">{Math.round(data.views / data.totalListings)}</p>
            <p className="text-[10px] text-muted-foreground">Avg views/listing</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2.5 text-center">
            <Clock className="mx-auto h-4 w-4 text-muted-foreground" />
            <p className="mt-1 text-lg font-bold text-foreground">{data.avgDaysOnMarket}</p>
            <p className="text-[10px] text-muted-foreground">Avg days on market</p>
          </div>
        </div>

        {/* Recommendation */}
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-xs text-muted-foreground">
          💡 {priceDiffPct > 10
            ? `Your price is ${priceDiffPct}% above average. Consider lowering to attract more enquiries.`
            : priceDiffPct < -10
            ? `Great competitive pricing! You're ${Math.abs(priceDiffPct)}% below average — expect strong interest.`
            : `Your price is in line with the market. Good photos and a detailed description will help you stand out.`
          }
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketInsights;
