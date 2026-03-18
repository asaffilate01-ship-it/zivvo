import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import { countryConfigs, formatPrice } from "@/lib/countryConfig";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gavel, Heart, Trophy, TrendingUp, Clock, Eye, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const fmtCurrency = (amount: number, country: string) => {
  const cfg = countryConfigs[country as keyof typeof countryConfigs] || countryConfigs.GB;
  return formatPrice(amount, cfg);
};

const getTimeLeft = (endsAt: string) => {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const MyAuctions = () => {
  const { user } = useAuth();
  const { country } = useCountry();

  const { data: watchedAuctions = [], isLoading: loadingWatched } = useQuery({
    queryKey: ["my-watched-auctions", user?.id],
    queryFn: async () => {
      const { data: watchers } = await supabase
        .from("auction_watchers")
        .select("auction_id")
        .eq("user_id", user!.id);
      if (!watchers?.length) return [];
      const ids = watchers.map((w) => w.auction_id);
      const { data } = await supabase
        .from("auctions")
        .select("*, car_listings!inner(title, make, model, year, images, mileage)")
        .in("id", ids)
        .order("ends_at", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: myBids = [], isLoading: loadingBids } = useQuery({
    queryKey: ["my-auction-bids", user?.id],
    queryFn: async () => {
      const { data: bids } = await supabase
        .from("auction_bids")
        .select("auction_id, amount, is_winning, created_at")
        .eq("bidder_id", user!.id)
        .order("created_at", { ascending: false });
      if (!bids?.length) return [];
      const uniqueIds = [...new Set(bids.map((b) => b.auction_id))];
      const { data: auctions } = await supabase
        .from("auctions")
        .select("*, car_listings!inner(title, make, model, year, images)")
        .in("id", uniqueIds);
      return (auctions || []).map((a: any) => {
        const userBids = bids.filter((b) => b.auction_id === a.id);
        const highestBid = Math.max(...userBids.map((b) => b.amount));
        const isCurrentlyWinning = userBids.some((b) => b.is_winning);
        return { ...a, userHighestBid: highestBid, isCurrentlyWinning, bidCount: userBids.length };
      });
    },
    enabled: !!user,
  });

  const { data: wonAuctions = [], isLoading: loadingWon } = useQuery({
    queryKey: ["my-won-auctions", user?.id],
    queryFn: async () => {
      const { data: winningBids } = await supabase
        .from("auction_bids")
        .select("auction_id, amount")
        .eq("bidder_id", user!.id)
        .eq("is_winning", true);
      if (!winningBids?.length) return [];
      const ids = [...new Set(winningBids.map((b) => b.auction_id))];
      const { data } = await supabase
        .from("auctions")
        .select("*, car_listings!inner(title, make, model, year, images), auction_escrow(*), auction_contracts(*)")
        .in("id", ids)
        .in("status", ["sold", "ended"] as any[]);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: sellingAuctions = [], isLoading: loadingSelling } = useQuery({
    queryKey: ["my-selling-auctions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("auctions")
        .select("*, car_listings!inner(title, make, model, year, images)")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const renderAuctionCard = (auction: any, extra?: React.ReactNode) => {
    const listing = auction.car_listings;
    const img = listing?.images?.[0] || "/placeholder.svg";
    const statusColors: Record<string, string> = {
      live: "bg-red-500 text-white border-0",
      ended: "bg-muted text-muted-foreground",
      sold: "bg-emerald-500 text-white border-0",
      draft: "bg-muted text-muted-foreground",
      pending_inspection: "bg-amber-500 text-white border-0",
      approved: "bg-blue-500 text-white border-0",
    };

    return (
      <Link to={`/auction/${auction.id}`} key={auction.id}>
        <Card className="group hover:shadow-md transition-all hover:border-primary/30">
          <CardContent className="p-3 flex gap-4">
            <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                  {listing?.year} {listing?.make} {listing?.model}
                </h4>
                <Badge className={`text-[10px] py-0 ${statusColors[auction.status] || ""}`}>
                  {auction.status?.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {fmtCurrency(auction.current_bid > 0 ? auction.current_bid : auction.starting_price, country)}
                </span>
                <span>{auction.bid_count || 0} bids</span>
                {auction.ends_at && auction.status === "live" && (
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{getTimeLeft(auction.ends_at)}</span>
                )}
              </div>
              {extra}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const renderSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}><CardContent className="p-3 flex gap-4">
          <Skeleton className="w-24 h-16 rounded-lg" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
        </CardContent></Card>
      ))}
    </div>
  );

  const emptyState = (icon: React.ReactNode, text: string) => (
    <div className="flex flex-col items-center py-12 text-center">
      {icon}
      <p className="mt-3 text-muted-foreground text-sm">{text}</p>
    </div>
  );

  return (
    <Tabs defaultValue="watching" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="watching" className="gap-1 text-xs"><Heart className="w-3 h-3" /> Watching ({watchedAuctions.length})</TabsTrigger>
        <TabsTrigger value="bidding" className="gap-1 text-xs"><Gavel className="w-3 h-3" /> My Bids ({myBids.length})</TabsTrigger>
        <TabsTrigger value="won" className="gap-1 text-xs"><Trophy className="w-3 h-3" /> Won ({wonAuctions.length})</TabsTrigger>
        <TabsTrigger value="selling" className="gap-1 text-xs"><TrendingUp className="w-3 h-3" /> Selling ({sellingAuctions.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="watching" className="mt-4 space-y-3">
        {loadingWatched ? renderSkeleton() : watchedAuctions.length === 0
          ? emptyState(<Heart className="w-10 h-10 text-muted-foreground" />, "You're not watching any auctions yet. Browse auctions to add to your watchlist.")
          : watchedAuctions.map((a: any) => renderAuctionCard(a))}
      </TabsContent>

      <TabsContent value="bidding" className="mt-4 space-y-3">
        {loadingBids ? renderSkeleton() : myBids.length === 0
          ? emptyState(<Gavel className="w-10 h-10 text-muted-foreground" />, "You haven't placed any bids yet.")
          : myBids.map((a: any) => renderAuctionCard(a, (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={a.isCurrentlyWinning ? "default" : "outline"} className={`text-[10px] py-0 ${a.isCurrentlyWinning ? "bg-emerald-500 border-0 text-white" : "text-amber-600 border-amber-300"}`}>
                {a.isCurrentlyWinning ? "✓ Winning" : "Outbid"}
              </Badge>
              <span className="text-[10px] text-muted-foreground">Your max: {fmtCurrency(a.userHighestBid, country)}</span>
            </div>
          )))}
      </TabsContent>

      <TabsContent value="won" className="mt-4 space-y-3">
        {loadingWon ? renderSkeleton() : wonAuctions.length === 0
          ? emptyState(<Trophy className="w-10 h-10 text-muted-foreground" />, "No won auctions yet. Keep bidding!")
          : wonAuctions.map((a: any) => {
            const escrow = a.auction_escrow?.[0];
            const contract = a.auction_contracts?.[0];
            return renderAuctionCard(a, (
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-emerald-500 text-white border-0 text-[10px] py-0"><Trophy className="w-2.5 h-2.5 mr-0.5" /> Won</Badge>
                {escrow && <Badge variant="outline" className="text-[10px] py-0 capitalize">{(escrow.status as string).replace(/_/g, " ")}</Badge>}
                {contract && <Badge variant="outline" className={`text-[10px] py-0 ${contract.buyer_signed && contract.seller_signed ? "text-emerald-600" : "text-amber-600"}`}>
                  {contract.buyer_signed && contract.seller_signed ? "✓ Signed" : "Contract pending"}
                </Badge>}
              </div>
            ));
          })}
      </TabsContent>

      <TabsContent value="selling" className="mt-4 space-y-3">
        {loadingSelling ? renderSkeleton() : sellingAuctions.length === 0
          ? emptyState(<TrendingUp className="w-10 h-10 text-muted-foreground" />, "You haven't created any auctions. List a car for auction to get started.")
          : sellingAuctions.map((a: any) => renderAuctionCard(a, (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" />{a.watchers_count || 0} watchers</span>
              {a.reserve_price && (
                <Badge variant="outline" className={`text-[10px] py-0 ${(a.current_bid || 0) >= a.reserve_price ? "text-emerald-600" : "text-amber-600"}`}>
                  Reserve {(a.current_bid || 0) >= a.reserve_price ? "met" : "not met"}
                </Badge>
              )}
            </div>
          )))}
      </TabsContent>
    </Tabs>
  );
};

export default MyAuctions;
