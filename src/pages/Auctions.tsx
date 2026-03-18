import { useState } from "react";
import heroAuctions from "@/assets/hero-auctions.jpg";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gavel, Shield, Clock, Search, Star, TrendingUp, Users, CheckCircle2, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { useCountry } from "@/contexts/CountryContext";
import { countryConfigs, formatPrice } from "@/lib/countryConfig";
import LiveEventBanner from "@/components/LiveEventBanner";

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

const Auctions = () => {
  const { country } = useCountry();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("ending_soon");
  const [tab, setTab] = useState("live");

  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ["auctions", tab, country],
    queryFn: async () => {
      const statusFilter = tab === "live" ? "live" : tab === "ending" ? "live" : tab === "upcoming" ? "approved" : "sold";
      const { data, error } = await supabase
        .from("auctions")
        .select("*, car_listings!inner(title, make, model, year, images, mileage, fuel_type, transmission, location, country)")
        .eq("status", statusFilter as any)
        .eq("car_listings.country", country)
        .order(tab === "ending" ? "ends_at" : "created_at", { ascending: tab === "ending" });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = auctions.filter((a: any) => {
    const listing = a.car_listings;
    if (!listing) return false;
    const q = search.toLowerCase();
    return !q || listing.title?.toLowerCase().includes(q) || listing.make?.toLowerCase().includes(q) || listing.model?.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a: any, b: any) => {
    if (sortBy === "ending_soon") return new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime();
    if (sortBy === "price_low") return (a.current_bid || a.starting_price) - (b.current_bid || b.starting_price);
    if (sortBy === "price_high") return (b.current_bid || b.starting_price) - (a.current_bid || a.starting_price);
    if (sortBy === "most_bids") return (b.bid_count || 0) - (a.bid_count || 0);
    return 0;
  });

  return (
    <>
      <SEOHead title="Trusted Car Auctions | Verified & Inspected Vehicles" description="Bid on professionally inspected, HPI-checked vehicles with full condition reports. Every seller verified, every car guaranteed." />
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90 text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-[100px]" />
            <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent rounded-full blur-[120px]" />
          </div>
          <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
              <div className="flex items-center gap-2 mb-4">
                <Gavel className="w-6 h-6 text-primary" />
                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 font-semibold">
                  Trusted Auctions
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight mb-4">
                Every Car Inspected.<br />Every Seller Verified.
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/70 mb-8 max-w-2xl">
                Bid with confidence. Professional inspections, HPI checks, and escrow protection on every auction. Only 3% buyer premium — the lowest in the industry.
              </p>
              <div className="flex flex-wrap gap-6 text-sm text-primary-foreground/60">
                {[
                  { icon: Shield, label: "HPI & Ownership Checked" },
                  { icon: Star, label: "1-5 Condition Rating" },
                  { icon: CheckCircle2, label: "Escrow Protected" },
                  { icon: Users, label: "Verified Buyers & Sellers" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Controls */}
        <div className="container mx-auto px-4 -mt-6 relative z-20">
          <Card className="shadow-lg border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search auctions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ending_soon">Ending Soon</SelectItem>
                    <SelectItem value="price_low">Price: Low → High</SelectItem>
                    <SelectItem value="price_high">Price: High → Low</SelectItem>
                    <SelectItem value="most_bids">Most Bids</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs + Grid */}
        <div className="container mx-auto px-4 py-8">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="live" className="gap-2"><Gavel className="w-4 h-4" /> Live</TabsTrigger>
              <TabsTrigger value="ending" className="gap-2"><Timer className="w-4 h-4" /> Ending Soon</TabsTrigger>
              <TabsTrigger value="upcoming" className="gap-2"><Clock className="w-4 h-4" /> Upcoming</TabsTrigger>
              <TabsTrigger value="sold" className="gap-2"><TrendingUp className="w-4 h-4" /> Recently Sold</TabsTrigger>
            </TabsList>

            <TabsContent value={tab}>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="aspect-[16/10] bg-muted rounded-t-lg" />
                      <CardContent className="p-4 space-y-3">
                        <div className="h-5 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : sorted.length === 0 ? (
                <div className="text-center py-16">
                  <Gavel className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-1">No auctions found</h3>
                  <p className="text-muted-foreground">Check back soon — new vehicles are added daily.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sorted.map((auction: any) => {
                    const listing = auction.car_listings;
                    const img = listing?.images?.[0] || "/placeholder.svg";
                    const timeLeft = auction.ends_at ? getTimeLeft(auction.ends_at) : "TBA";
                    const currentPrice = auction.current_bid > 0 ? auction.current_bid : auction.starting_price;
                    const isEnding = auction.ends_at && (new Date(auction.ends_at).getTime() - Date.now()) < 3600000;

                    return (
                      <motion.div key={auction.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Link to={`/auction/${auction.id}`}>
                          <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30">
                            <div className="relative aspect-[16/10] overflow-hidden">
                              <img src={img} alt={listing?.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute top-3 left-3 flex gap-2">
                                {auction.status === "live" && (
                                  <Badge className="bg-red-500 text-white border-0 animate-pulse">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 inline-block" /> LIVE
                                  </Badge>
                                )}
                                {auction.inspection_rating && (
                                  <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                                    <Star className="w-3 h-3 mr-1 fill-primary text-primary" /> {auction.inspection_rating}/5
                                  </Badge>
                                )}
                              </div>
                              <div className="absolute top-3 right-3">
                                {auction.hpi_clear && (
                                  <Badge variant="secondary" className="bg-emerald-500/90 text-white border-0 backdrop-blur-sm">
                                    <Shield className="w-3 h-3 mr-1" /> HPI Clear
                                  </Badge>
                                )}
                              </div>
                              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5">
                                  <p className="text-xs text-muted-foreground">{auction.bid_count || 0} bids</p>
                                  <p className="font-bold text-foreground">{fmtCurrency(currentPrice, country)}</p>
                                </div>
                                <div className={`rounded-lg px-3 py-1.5 backdrop-blur-sm ${isEnding ? "bg-red-500/90 text-white" : "bg-background/90"}`}>
                                  <p className="text-xs opacity-70">Time left</p>
                                  <p className={`font-bold ${isEnding ? "" : "text-foreground"}`}>{timeLeft}</p>
                                </div>
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {listing?.year} {listing?.make} {listing?.model}
                              </h3>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                {listing?.mileage && <span>{listing.mileage.toLocaleString()} mi</span>}
                                {listing?.fuel_type && <span>• {listing.fuel_type}</span>}
                                {listing?.transmission && <span>• {listing.transmission}</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                                {auction.seller_verified && <Badge variant="outline" className="text-[10px] py-0"><CheckCircle2 className="w-3 h-3 mr-1" />Verified Seller</Badge>}
                                {auction.ownership_verified && <Badge variant="outline" className="text-[10px] py-0"><Shield className="w-3 h-3 mr-1" />V5C Confirmed</Badge>}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Events */}
        <LiveEventBanner />

        {/* Trust Strip */}
        <section className="border-t border-border bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-xl font-bold mb-8">How Our Trusted Auction Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { step: "01", title: "Professional Inspection", desc: "Every car inspected by approved specialists with a 1-5 condition rating and full report." },
                { step: "02", title: "HPI & History Check", desc: "Finance, stolen, write-off, mileage anomaly and ownership verification included." },
                { step: "03", title: "Secure Bidding", desc: "Buyers pre-verified with card pre-auth or finance approval. Anti-sniping protection." },
                { step: "04", title: "Escrow & E-Sign", desc: "Funds held in escrow. Released only after V5C, keys handover and signed contract." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto mb-3 text-sm">{step}</div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Auctions;
