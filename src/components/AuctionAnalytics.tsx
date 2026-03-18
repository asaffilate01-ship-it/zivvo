import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import { countryConfigs, formatPrice } from "@/lib/countryConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gavel, TrendingUp, Eye, Users, DollarSign, BarChart3, Target, Clock } from "lucide-react";

const fmtCurrency = (amount: number, country: string) => {
  const cfg = countryConfigs[country as keyof typeof countryConfigs] || countryConfigs.GB;
  return formatPrice(amount, cfg);
};

const AuctionAnalytics = () => {
  const { user } = useAuth();
  const { country } = useCountry();

  const { data: sellerAuctions = [] } = useQuery({
    queryKey: ["seller-auction-analytics", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("auctions")
        .select("*, car_listings!inner(title, make, model, year)")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: sellerBids = [] } = useQuery({
    queryKey: ["seller-auction-bids", user?.id],
    queryFn: async () => {
      if (!sellerAuctions.length) return [];
      const ids = sellerAuctions.map((a: any) => a.id);
      const { data } = await supabase
        .from("auction_bids")
        .select("auction_id, amount, created_at, bidder_id")
        .in("auction_id", ids)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: sellerAuctions.length > 0,
  });

  const totalAuctions = sellerAuctions.length;
  const liveAuctions = sellerAuctions.filter((a: any) => a.status === "live").length;
  const soldAuctions = sellerAuctions.filter((a: any) => a.status === "sold").length;
  const totalRevenue = sellerAuctions
    .filter((a: any) => a.status === "sold")
    .reduce((sum: number, a: any) => sum + (a.current_bid || 0) * 0.985, 0);
  const totalBids = sellerBids.length;
  const uniqueBidders = new Set(sellerBids.map((b: any) => b.bidder_id)).size;
  const totalWatchers = sellerAuctions.reduce((sum: number, a: any) => sum + (a.watchers_count || 0), 0);
  const conversionRate = totalAuctions > 0 ? Math.round((soldAuctions / totalAuctions) * 100) : 0;
  const avgBidsPerAuction = totalAuctions > 0 ? Math.round(totalBids / totalAuctions) : 0;

  const stats = [
    { icon: Gavel, label: "Total Auctions", value: totalAuctions, color: "text-primary" },
    { icon: TrendingUp, label: "Currently Live", value: liveAuctions, color: "text-red-500" },
    { icon: DollarSign, label: "Revenue (net)", value: fmtCurrency(totalRevenue, country), color: "text-emerald-500" },
    { icon: Target, label: "Conversion Rate", value: `${conversionRate}%`, color: "text-blue-500" },
    { icon: BarChart3, label: "Total Bids", value: totalBids, color: "text-purple-500" },
    { icon: Users, label: "Unique Bidders", value: uniqueBidders, color: "text-orange-500" },
    { icon: Eye, label: "Total Watchers", value: totalWatchers, color: "text-cyan-500" },
    { icon: Clock, label: "Avg Bids/Auction", value: avgBidsPerAuction, color: "text-pink-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Auction Performance</h3>
        <p className="text-sm text-muted-foreground">Track your auction activity and revenue</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
              <p className="text-xl font-bold">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-auction breakdown */}
      {sellerAuctions.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Auction Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sellerAuctions.slice(0, 10).map((auction: any) => {
                const listing = auction.car_listings;
                const auctionBids = sellerBids.filter((b: any) => b.auction_id === auction.id);
                return (
                  <div key={auction.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-medium truncate">{listing?.year} {listing?.make} {listing?.model}</span>
                      <Badge variant="outline" className="text-[10px] py-0 capitalize flex-shrink-0">{auction.status?.replace(/_/g, " ")}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                      <span>{auctionBids.length} bids</span>
                      <span>{auction.watchers_count || 0} watchers</span>
                      <span className="font-semibold text-foreground">
                        {fmtCurrency(auction.current_bid > 0 ? auction.current_bid : auction.starting_price, country)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuctionAnalytics;
