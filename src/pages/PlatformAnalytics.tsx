import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import DashboardChart from "@/components/DashboardChart";
import {
  DollarSign, TrendingUp, Car, Users, Building2, Gavel, ArrowRightLeft,
  Download, BarChart3, ShoppingCart, Percent, Clock, Package,
} from "lucide-react";
import { motion } from "framer-motion";

const PlatformAnalytics = () => {
  // Fetch all data in parallel
  const { data: listings = [] } = useQuery({
    queryKey: ["analytics-listings"],
    queryFn: async () => {
      const { data } = await supabase.from("car_listings").select("id, price, status, created_at, seller_id, dealer_id").limit(1000);
      return data || [];
    },
  });

  const { data: dealers = [] } = useQuery({
    queryKey: ["analytics-dealers"],
    queryFn: async () => {
      const { data } = await supabase.from("dealers").select("id, tier, subscription_status, created_at").limit(1000);
      return data || [];
    },
  });

  const { data: auctions = [] } = useQuery({
    queryKey: ["analytics-auctions"],
    queryFn: async () => {
      const { data } = await supabase.from("auctions").select("id, status, current_bid, starting_price, created_at, buyer_premium_pct, seller_fee_pct").limit(1000);
      return data || [];
    },
  });

  const { data: escrows = [] } = useQuery({
    queryKey: ["analytics-escrows"],
    queryFn: async () => {
      const { data } = await supabase.from("auction_escrow").select("id, total_amount, platform_revenue, buyer_premium, seller_fee, status, created_at").limit(1000);
      return data || [];
    },
  });

  const { data: arbDeals = [] } = useQuery({
    queryKey: ["analytics-arb"],
    queryFn: async () => {
      const { data } = await supabase.from("arbitrage_deals").select("id, status, seller_price, dealer_price, platform_markup, created_at").limit(1000);
      return data || [];
    },
  });

  const { data: enquiries = [] } = useQuery({
    queryKey: ["analytics-enquiries"],
    queryFn: async () => {
      const { data } = await supabase.from("enquiries").select("id, created_at, status").limit(1000);
      return data || [];
    },
  });

  const { data: pipelineLeads = [] } = useQuery({
    queryKey: ["analytics-pipeline"],
    queryFn: async () => {
      const { data } = await supabase.from("pipeline_leads").select("id, stage, expected_value, actual_value, created_at").limit(1000);
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["analytics-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, created_at").limit(1000);
      return data || [];
    },
  });

  // Calculate KPIs
  const stats = useMemo(() => {
    const prices: Record<string, number> = { starter: 49, professional: 99, enterprise: 199 };
    const activeDealers = dealers.filter((d: any) => d.subscription_status === "active");
    const mrr = activeDealers.reduce((a: number, d: any) => a + (prices[d.tier] || 0), 0);

    const activeListings = listings.filter((l: any) => l.status === "active");
    const soldListings = listings.filter((l: any) => l.status === "sold");
    const gmvListings = soldListings.reduce((a: number, l: any) => a + (l.price || 0), 0);

    const soldAuctions = auctions.filter((a: any) => a.status === "sold");
    const gmvAuctions = soldAuctions.reduce((a: number, au: any) => a + (au.current_bid || 0), 0);
    const auctionRevenue = escrows.reduce((a: number, e: any) => a + (e.platform_revenue || 0), 0);

    const completedArb = arbDeals.filter((d: any) => ["completed", "seller_paid", "dealer_accepted"].includes(d.status));
    const gmvArb = completedArb.reduce((a: number, d: any) => a + (d.dealer_price || 0), 0);
    const arbRevenue = completedArb.reduce((a: number, d: any) => a + (d.platform_markup || 0), 0);

    const totalGMV = gmvListings + gmvAuctions + gmvArb;
    const totalRevenue = mrr + auctionRevenue + arbRevenue;

    const soldPipeline = pipelineLeads.filter((p: any) => p.stage === "sold");
    const pipelineConversion = pipelineLeads.length > 0 ? (soldPipeline.length / pipelineLeads.length * 100) : 0;

    const auctionConversion = auctions.length > 0 ? (soldAuctions.length / auctions.length * 100) : 0;

    return {
      totalUsers: profiles.length,
      totalDealers: dealers.length,
      activeDealers: activeDealers.length,
      activeListings: activeListings.length,
      totalListings: listings.length,
      soldListings: soldListings.length,
      mrr,
      gmvListings,
      gmvAuctions,
      gmvArb,
      totalGMV,
      auctionRevenue,
      arbRevenue,
      totalRevenue,
      totalAuctions: auctions.length,
      soldAuctions: soldAuctions.length,
      auctionConversion,
      totalEnquiries: enquiries.length,
      pipelineConversion,
      totalArbDeals: arbDeals.length,
      completedArbDeals: completedArb.length,
    };
  }, [listings, dealers, auctions, escrows, arbDeals, enquiries, pipelineLeads, profiles]);

  // Chart data
  const revenueBreakdown = useMemo(() => [
    { label: "MRR", value: stats.mrr },
    { label: "Auction Fees", value: stats.auctionRevenue },
    { label: "Trade Markup", value: stats.arbRevenue },
  ], [stats]);

  const gmvBreakdown = useMemo(() => [
    { label: "Listings", value: stats.gmvListings },
    { label: "Auctions", value: stats.gmvAuctions },
    { label: "Trade Stock", value: stats.gmvArb },
  ], [stats]);

  const userGrowth = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const count = profiles.filter((p: any) => new Date(p.created_at) <= end).length;
      return { label: d.toLocaleDateString("en-US", { month: "short" }), value: count };
    });
  }, [profiles]);

  const listingVolume = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const count = listings.filter((l: any) => {
        const c = new Date(l.created_at);
        return c >= start && c <= end;
      }).length;
      return { label: d.toLocaleDateString("en-US", { month: "short" }), value: count };
    });
  }, [listings]);

  const funnelData = useMemo(() => {
    const stages = ["lead", "enquiry", "viewing", "offer", "negotiation", "sold"];
    return stages.map((s) => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      value: pipelineLeads.filter((p: any) => p.stage === s).length,
    }));
  }, [pipelineLeads]);

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((r) => Object.values(r).map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (n: number) => `€${n.toLocaleString()}`;

  return (
    <>
      <SEOHead title="Platform Analytics" description="Platform-wide analytics, GMV tracking, and revenue reports." />
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
                <BarChart3 className="h-7 w-7 text-primary" /> Platform Analytics
              </h1>
              <p className="text-muted-foreground">GMV, revenue, conversion funnels, and growth metrics</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCSV([stats], "platform-stats")}>
              <Download className="h-4 w-4" /> Export Summary
            </Button>
          </div>

          {/* Top-level KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[
              { label: "Total GMV", value: formatCurrency(stats.totalGMV), icon: ShoppingCart, sub: "All sold vehicles" },
              { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: DollarSign, sub: "MRR + fees + markups" },
              { label: "Monthly Recurring", value: formatCurrency(stats.mrr), icon: TrendingUp, sub: `${stats.activeDealers} active dealers` },
              { label: "Conversion Rate", value: `${stats.pipelineConversion.toFixed(1)}%`, icon: Percent, sub: `${pipelineLeads.length} total leads` },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <s.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="font-display text-2xl font-bold text-card-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.sub}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Secondary KPIs */}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
            {[
              { label: "Users", value: stats.totalUsers, icon: Users },
              { label: "Dealers", value: stats.totalDealers, icon: Building2 },
              { label: "Listings", value: stats.activeListings, icon: Car },
              { label: "Auctions", value: stats.totalAuctions, icon: Gavel },
              { label: "Enquiries", value: stats.totalEnquiries, icon: Package },
              { label: "Trade Deals", value: stats.totalArbDeals, icon: ArrowRightLeft },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 text-center">
                  <s.icon className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                  <p className="font-display text-xl font-bold text-card-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <DashboardChart title="Revenue Breakdown" data={revenueBreakdown} type="bar" color="hsl(16, 90%, 54%)" />
            <DashboardChart title="GMV by Channel" data={gmvBreakdown} type="bar" color="hsl(210, 100%, 52%)" />
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <DashboardChart title="User Growth (6 Months)" data={userGrowth} type="area" color="hsl(142, 76%, 36%)" />
            <DashboardChart title="Listing Volume (6 Months)" data={listingVolume} type="bar" color="hsl(280, 80%, 60%)" />
          </div>

          {/* Conversion Funnel */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Sales Pipeline Conversion Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40">
                {funnelData.map((stage, i) => {
                  const maxVal = Math.max(...funnelData.map((f) => f.value), 1);
                  const height = (stage.value / maxVal) * 100;
                  return (
                    <div key={stage.label} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-card-foreground">{stage.value}</span>
                      <div
                        className="w-full rounded-t-md bg-primary/80 transition-all"
                        style={{ height: `${Math.max(height, 4)}%`, opacity: 1 - i * 0.1 }}
                      />
                      <span className="text-[10px] text-muted-foreground text-center">{stage.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Auction & Trade Stock metrics */}
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Gavel className="h-4 w-4" /> Auction Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Auctions</span><span className="font-medium">{stats.totalAuctions}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sold</span><span className="font-medium text-emerald-600">{stats.soldAuctions}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Conversion Rate</span><span className="font-medium">{stats.auctionConversion.toFixed(1)}%</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">GMV (Hammer Total)</span><span className="font-bold text-card-foreground">{formatCurrency(stats.gmvAuctions)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Platform Revenue (Fees)</span><span className="font-bold text-primary">{formatCurrency(stats.auctionRevenue)}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" /> Trade Stock Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Deals</span><span className="font-medium">{stats.totalArbDeals}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span className="font-medium text-emerald-600">{stats.completedArbDeals}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Completion Rate</span><span className="font-medium">{stats.totalArbDeals > 0 ? (stats.completedArbDeals / stats.totalArbDeals * 100).toFixed(1) : 0}%</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">GMV (Dealer Payments)</span><span className="font-bold text-card-foreground">{formatCurrency(stats.gmvArb)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Platform Revenue (Markup)</span><span className="font-bold text-primary">{formatCurrency(stats.arbRevenue)}</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PlatformAnalytics;
