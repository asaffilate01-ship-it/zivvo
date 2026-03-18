import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import StripeDepositForm from "@/components/StripeDepositForm";
import FinancePreApprovalForm from "@/components/FinancePreApprovalForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Gavel, Shield, Star, Clock, CheckCircle2, AlertTriangle, Key, FileText, Truck,
  ChevronLeft, ChevronRight, Eye, Users, TrendingUp, History, Car, Wrench, Paintbrush,
  Heart, HeartOff, Zap, CreditCard, Package, Send, Banknote, Loader2, Timer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { countryConfigs, formatPrice } from "@/lib/countryConfig";

const formatCurrency = (amount: number, country: string) => {
  const cfg = countryConfigs[country as keyof typeof countryConfigs] || countryConfigs.GB;
  return formatPrice(amount, cfg);
};

const AuctionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { country } = useCountry();
  const queryClient = useQueryClient();
  const [bidAmount, setBidAmount] = useState("");
  const [maxAutoBid, setMaxAutoBid] = useState("");
  const [useAutoBid, setUseAutoBid] = useState(false);
  const [imageIdx, setImageIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");
  const [showBidConfirm, setShowBidConfirm] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [showDeliveryRequest, setShowDeliveryRequest] = useState(false);
  const [payingWinner, setPayingWinner] = useState(false);

  // Handle payment success redirect
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast.success("Payment successful! Your purchase is being processed.");
      queryClient.invalidateQueries({ queryKey: ["auction-escrow", id] });
    }
  }, [searchParams]);

  const { data: auction, isLoading } = useQuery({
    queryKey: ["auction", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auctions")
        .select("*, car_listings!inner(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: bids = [] } = useQuery({
    queryKey: ["auction-bids", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auction_bids")
        .select("*")
        .eq("auction_id", id!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: contract } = useQuery({
    queryKey: ["auction-contract", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("auction_contracts")
        .select("*")
        .eq("auction_id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: escrow } = useQuery({
    queryKey: ["auction-escrow", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("auction_escrow")
        .select("*")
        .eq("auction_id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: deposit } = useQuery({
    queryKey: ["auction-deposit", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("auction_deposits")
        .select("*")
        .eq("auction_id", id!)
        .eq("user_id", user!.id)
        .in("status", ["authorized", "pending"])
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: isWatching } = useQuery({
    queryKey: ["auction-watching", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("auction_watchers")
        .select("id")
        .eq("auction_id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!id && !!user,
  });

  // Realtime bid subscription
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`auction-bids-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "auction_bids", filter: `auction_id=eq.${id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["auction-bids", id] });
        queryClient.invalidateQueries({ queryKey: ["auction", id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);

  // Countdown timer
  useEffect(() => {
    if (!auction?.ends_at) return;
    const tick = () => {
      const diff = new Date(auction.ends_at).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Auction Ended"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m ${s}s` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [auction?.ends_at]);

  const toggleWatch = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("Login required");
      if (isWatching) {
        await supabase.from("auction_watchers").delete().eq("auction_id", id).eq("user_id", user.id);
      } else {
        await supabase.from("auction_watchers").insert({ auction_id: id, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-watching", id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["auction", id] });
      toast.success(isWatching ? "Removed from watchlist" : "Added to watchlist");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const placeBid = useMutation({
    mutationFn: async () => {
      if (!user || !auction) throw new Error("Login required");
      const amount = parseFloat(bidAmount);
      const minBid = (auction.current_bid > 0 ? auction.current_bid : auction.starting_price) + getMinIncrement(auction.current_bid || auction.starting_price);
      if (amount < minBid) throw new Error(`Minimum bid is ${formatCurrency(minBid, country)}`);
      if (user.id === auction.seller_id) throw new Error("You cannot bid on your own auction");

      // Check deposit
      if (!deposit || deposit.status !== "authorized") {
        throw new Error("You need to pre-authorize a deposit before bidding");
      }

      const bidData: any = {
        auction_id: auction.id,
        bidder_id: user.id,
        amount,
        deposit_verified: true,
      };

      if (useAutoBid && maxAutoBid) {
        const maxAuto = parseFloat(maxAutoBid);
        if (maxAuto < amount) throw new Error("Max auto-bid must be higher than your bid");
        bidData.max_auto_bid = maxAuto;
      }

      const { error } = await supabase.from("auction_bids").insert(bidData);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bid placed successfully!");
      setBidAmount("");
      setMaxAutoBid("");
      setShowBidConfirm(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signContract = useMutation({
    mutationFn: async (role: "buyer" | "seller") => {
      if (!contract || !user) return;
      const update = role === "buyer"
        ? { buyer_signed: true, buyer_signed_at: new Date().toISOString(), buyer_ip: "recorded", status: "pending_seller" as const }
        : { seller_signed: true, seller_signed_at: new Date().toISOString(), seller_ip: "recorded" };

      const { error } = await supabase
        .from("auction_contracts")
        .update(update)
        .eq("id", contract.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contract signed successfully!");
      queryClient.invalidateQueries({ queryKey: ["auction-contract", id] });
      setShowContract(false);
    },
    onError: () => toast.error("Failed to sign contract"),
  });

  const confirmHandover = useMutation({
    mutationFn: async (field: "v5c_received" | "keys_handed_over") => {
      if (!escrow) return;
      const { error } = await supabase
        .from("auction_escrow")
        .update({ [field]: true })
        .eq("id", escrow.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Handover step confirmed!");
      queryClient.invalidateQueries({ queryKey: ["auction-escrow", id] });
    },
    onError: () => toast.error("Failed to confirm"),
  });

  const requestDeposit = useMutation({
    mutationFn: async () => {
      // Now handled by StripeDepositForm component
      setShowDepositForm(true);
    },
  });

  const payWinnerBalance = useMutation({
    mutationFn: async () => {
      if (!user || !auction) throw new Error("Login required");
      const { data, error } = await supabase.functions.invoke("winner-payment", {
        body: { auction_id: auction.id },
      });
      if (error) throw error;
      if (data?.fully_paid) {
        toast.success("Payment complete! Deposit covered the full amount.");
        queryClient.invalidateQueries({ queryKey: ["auction-escrow", id] });
        return;
      }
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return (<><Navbar /><div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div></>);
  if (!auction) return (<><Navbar /><div className="min-h-screen flex items-center justify-center"><p>Auction not found</p></div></>);

  const listing = auction.car_listings as any;
  const images = listing?.images || ["/placeholder.svg"];
  const currentPrice = auction.current_bid > 0 ? auction.current_bid : auction.starting_price;
  const conditionReport = (auction.condition_report || {}) as Record<string, any>;
  const isLive = auction.status === "live";
  const isSeller = user?.id === auction.seller_id;
  const isWinner = auction.winning_bid_id && bids[0]?.bidder_id === user?.id;
  const reserveMet = auction.reserve_price ? currentPrice >= auction.reserve_price : true;
  const hasDeposit = deposit?.status === "authorized";
  const isSold = auction.status === "sold";

  return (
    <>
      <SEOHead title={`${listing?.year} ${listing?.make} ${listing?.model} — Auction`} description={`Bid on this inspected ${listing?.make} ${listing?.model}. Condition rated ${auction.inspection_rating}/5. HPI checked.`} />
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/auctions" className="hover:text-primary">Auctions</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">{listing?.year} {listing?.make} {listing?.model}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Gallery + Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Gallery */}
              <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-muted">
                <AnimatePresence mode="wait">
                  <motion.img key={imageIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} src={images[imageIdx]} alt={listing?.title} className="w-full h-full object-cover" />
                </AnimatePresence>
                {images.length > 1 && (
                  <>
                    <button onClick={() => setImageIdx((i) => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition"><ChevronLeft className="w-5 h-5" /></button>
                    <button onClick={() => setImageIdx((i) => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition"><ChevronRight className="w-5 h-5" /></button>
                  </>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  {isLive && <Badge className="bg-red-500 text-white border-0 animate-pulse"><span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 inline-block" />LIVE</Badge>}
                  {auction.inspection_rating && <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm"><Star className="w-3 h-3 mr-1 fill-primary text-primary" />{auction.inspection_rating}/5 Condition</Badge>}
                </div>
                <div className="absolute top-3 right-3">
                  {user && (
                    <button onClick={() => toggleWatch.mutate()} className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition">
                      {isWatching ? <Heart className="w-5 h-5 fill-red-500 text-red-500" /> : <Heart className="w-5 h-5 text-muted-foreground" />}
                    </button>
                  )}
                </div>
                <div className="absolute bottom-3 left-3 flex gap-2 text-xs">
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">{imageIdx + 1}/{images.length} photos</Badge>
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img: string, i: number) => (
                    <button key={i} onClick={() => setImageIdx(i)} className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition ${i === imageIdx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Info Tabs */}
              <Tabs defaultValue="condition" className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="condition">Condition Report</TabsTrigger>
                  <TabsTrigger value="history">History & Checks</TabsTrigger>
                  <TabsTrigger value="assets">What's Included</TabsTrigger>
                  <TabsTrigger value="bids">Bid History ({bids.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="condition" className="mt-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{auction.inspection_rating || "—"}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Inspection Rating</h3>
                          <p className="text-sm text-muted-foreground">Assessed by approved specialist</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { icon: Paintbrush, label: "Paint Condition", value: conditionReport.paint_condition },
                          { icon: Car, label: "Interior Condition", value: conditionReport.interior_condition },
                          { icon: Wrench, label: "Mechanical Notes", value: conditionReport.mechanical_notes },
                          { icon: Eye, label: "Tyres Condition", value: conditionReport.tyres_condition },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <Icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm">{label}</p>
                              <p className="text-sm text-muted-foreground">{value || "Not assessed"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: "HPI Check", status: auction.hpi_clear, icon: Shield, ok: "Clear — No issues found", bad: "Pending" },
                          { label: "Ownership Verified", status: auction.ownership_verified, icon: FileText, ok: "V5C confirmed with DVLA", bad: "Pending" },
                          { label: "Seller Verified", status: auction.seller_verified, icon: CheckCircle2, ok: "Identity & address verified", bad: "Pending" },
                          { label: "Accident History", status: !conditionReport.accident_history, icon: AlertTriangle, ok: "No accidents recorded", bad: conditionReport.accident_history || "Pending" },
                        ].map(({ label, status, icon: Icon, ok, bad }) => (
                          <div key={label} className={`flex items-center gap-3 p-4 rounded-lg border ${status ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30" : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"}`}>
                            <Icon className={`w-5 h-5 ${status ? "text-emerald-600" : "text-amber-600"}`} />
                            <div>
                              <p className="font-medium text-sm">{label}</p>
                              <p className="text-xs text-muted-foreground">{status ? ok : bad}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="assets" className="mt-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { icon: Key, label: "Keys", value: conditionReport.keys_count ? `${conditionReport.keys_count} key(s)${conditionReport.spare_key ? " + spare" : ""}` : "Not specified" },
                          { icon: FileText, label: "Service History", value: conditionReport.service_history || "Not specified" },
                          { icon: Shield, label: "Warranty", value: conditionReport.warranty_info || "No warranty" },
                          { icon: Car, label: "Additional Assets", value: conditionReport.assets_included || "None listed" },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <Icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm">{label}</p>
                              <p className="text-sm text-muted-foreground">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {auction.delivery_available && (
                        <div className="mt-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                          <div className="flex items-center gap-2">
                            <Truck className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium text-sm">Delivery Available</p>
                              <p className="text-xs text-muted-foreground">
                                Via our logistics partners{auction.delivery_cost_estimate ? ` — estimated ${formatCurrency(auction.delivery_cost_estimate, country)}` : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bids" className="mt-4">
                  <Card>
                    <CardContent className="p-6">
                      {bids.length === 0 ? (
                        <p className="text-center text-muted-foreground py-6">No bids yet. Be the first!</p>
                      ) : (
                        <ScrollArea className="h-80">
                          <div className="space-y-2">
                            {bids.map((bid: any, i: number) => (
                              <div key={bid.id} className={`flex items-center justify-between p-3 rounded-lg ${i === 0 ? "bg-primary/10 border border-primary/20" : "bg-muted/30"}`}>
                                <div className="flex items-center gap-3">
                                  {i === 0 && <TrendingUp className="w-4 h-4 text-primary" />}
                                  <div>
                                    <p className="font-medium text-sm flex items-center gap-1.5">
                                      {bid.bidder_id === user?.id ? "You" : `Bidder ***${bid.bidder_id.slice(-4)}`}
                                      {bid.is_auto_bid && <Badge variant="outline" className="text-[9px] py-0"><Zap className="w-2.5 h-2.5 mr-0.5" />Auto</Badge>}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{new Date(bid.created_at).toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`font-bold ${i === 0 ? "text-primary" : ""}`}>{formatCurrency(bid.amount, country)}</p>
                                  {bid.finance_preapproved && <Badge variant="outline" className="text-[9px] py-0">Finance</Badge>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right: Bidding Sidebar */}
            <div className="space-y-4">
              {/* Price & Timer */}
              <Card className="border-primary/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground mb-1">{auction.bid_count > 0 ? "Current Bid" : "Starting Price"}</p>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(currentPrice, country)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{auction.bid_count || 0} bids • {auction.watchers_count || 0} watchers</p>
                  </div>

                  {!reserveMet && auction.status !== "draft" && (
                    <div className="flex items-center justify-center gap-1 mb-4">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-amber-600 font-medium">Reserve not yet met</span>
                    </div>
                  )}

                  <div className={`rounded-lg p-3 mb-4 text-center ${isLive ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800" : "bg-muted"}`}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Clock className={`w-4 h-4 ${isLive ? "text-red-500" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium">{isLive ? "Time Remaining" : "Auction " + auction.status}</span>
                    </div>
                    <p className={`text-xl font-bold font-mono ${isLive ? "text-red-600 dark:text-red-400" : ""}`}>{timeLeft || "—"}</p>
                  </div>

                  {/* Watch button */}
                  {user && !isSeller && (
                    <Button variant="outline" className="w-full mb-3 gap-2" onClick={() => toggleWatch.mutate()} disabled={toggleWatch.isPending}>
                      {isWatching ? <><HeartOff className="w-4 h-4" /> Unwatch</> : <><Heart className="w-4 h-4" /> Watch Auction</>}
                    </Button>
                  )}

                  {isLive && !isSeller && user && (
                    <>
                      {/* Deposit / Finance verification */}
                      {!hasDeposit && !showDepositForm && !showFinanceForm && (
                        <div className="mb-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                          <div className="flex items-start gap-2">
                            <CreditCard className="w-4 h-4 text-amber-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Verification Required</p>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Choose one option to start bidding:</p>
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" className="gap-1 flex-1" onClick={() => setShowDepositForm(true)}>
                                  <CreditCard className="w-3 h-3" /> Card Deposit
                                </Button>
                                <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => setShowFinanceForm(true)}>
                                  <Banknote className="w-3 h-3" /> Finance
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Stripe Elements deposit form */}
                      {showDepositForm && !hasDeposit && (
                        <div className="mb-3">
                          <StripeDepositForm
                            auctionId={auction.id}
                            onSuccess={() => {
                              setShowDepositForm(false);
                              queryClient.invalidateQueries({ queryKey: ["auction-deposit", id, user?.id] });
                            }}
                            onCancel={() => setShowDepositForm(false)}
                          />
                        </div>
                      )}

                      {/* Finance pre-approval form */}
                      {showFinanceForm && !hasDeposit && (
                        <div className="mb-3">
                          <FinancePreApprovalForm
                            auctionId={auction.id}
                            onApproved={() => {
                              setShowFinanceForm(false);
                              queryClient.invalidateQueries({ queryKey: ["auction-deposit", id, user?.id] });
                            }}
                          />
                          <Button variant="ghost" size="sm" className="w-full mt-1" onClick={() => setShowFinanceForm(false)}>Cancel</Button>
                        </div>
                      )}

                      {hasDeposit && (
                        <div className="mb-3 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                            {deposit?.type === "finance_preapproval" ? "Finance pre-approved" : "Deposit pre-authorized"} — Ready to bid
                          </span>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Your bid (min: {formatCurrency((currentPrice) + getMinIncrement(currentPrice), country)})</p>
                          <Input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder={`${(currentPrice + getMinIncrement(currentPrice))}`} className="text-lg font-semibold" disabled={!hasDeposit} />
                        </div>

                        {/* Auto-bid toggle */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            <Label className="text-sm cursor-pointer" htmlFor="auto-bid">Auto-bid (proxy)</Label>
                          </div>
                          <Switch id="auto-bid" checked={useAutoBid} onCheckedChange={setUseAutoBid} disabled={!hasDeposit} />
                        </div>
                        {useAutoBid && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Maximum auto-bid ceiling</p>
                            <Input type="number" value={maxAutoBid} onChange={(e) => setMaxAutoBid(e.target.value)} placeholder="e.g. 15000" disabled={!hasDeposit} />
                            <p className="text-[10px] text-muted-foreground mt-1">System bids minimum increments on your behalf up to this amount</p>
                          </div>
                        )}

                        <Button className="w-full h-12 text-lg gap-2" onClick={() => setShowBidConfirm(true)} disabled={!bidAmount || !hasDeposit}>
                          <Gavel className="w-5 h-5" /> Place Bid
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center mt-2">
                        3% buyer premium applies • Anti-sniping: bids in last 2 min extend auction
                      </p>
                    </>
                  )}

                  {!user && isLive && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-3">Register & verify to bid</p>
                      <Button asChild className="w-full"><Link to="/signup">Create Account</Link></Button>
                    </div>
                  )}

                  {isSeller && (
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <p className="text-sm font-medium">This is your auction</p>
                      {auction.reserve_price && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Reserve: {formatCurrency(auction.reserve_price, country)} {reserveMet ? "✅ Met" : "⏳ Not met"}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fee Breakdown */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Fee Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Hammer Price</span><span>{formatCurrency(currentPrice, country)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Buyer Premium (3%)</span><span>{formatCurrency(currentPrice * 0.03, country)}</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold"><span>Total for Buyer</span><span>{formatCurrency(currentPrice * 1.03, country)}</span></div>
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  {[
                    { icon: Shield, label: "Payment Protected", desc: "Funds held until handover complete" },
                    { icon: CreditCard, label: "Deposit Pre-auth", desc: "£500 held, not charged until you win" },
                    { icon: FileText, label: "E-Sign Contract", desc: "Legally binding digital contract" },
                    { icon: CheckCircle2, label: "Full Audit Trail", desc: "Every action logged & timestamped" },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-3">
                      <Icon className="w-4 h-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Post-Sale: Contract section for winner/seller */}
              {(isSold || auction.status === "ended") && (isWinner || isSeller) && contract && (
                <Card className="border-primary/30">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Sale Contract</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">Buyer signed</span><span>{contract.buyer_signed ? `✅ ${new Date(contract.buyer_signed_at).toLocaleDateString()}` : "⏳ Pending"}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Seller signed</span><span>{contract.seller_signed ? `✅ ${new Date(contract.seller_signed_at).toLocaleDateString()}` : "⏳ Pending"}</span></div>
                    </div>
                    {((isWinner && !contract.buyer_signed) || (isSeller && !contract.seller_signed)) && (
                      <Dialog open={showContract} onOpenChange={setShowContract}>
                        <DialogTrigger asChild>
                          <Button className="w-full" variant="default">Review & Sign Contract</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Sale Contract</DialogTitle>
                            <DialogDescription>Review the contract carefully before signing. Your IP address and timestamp will be recorded.</DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="h-80 border rounded-lg p-4 text-sm">
                            <div dangerouslySetInnerHTML={{ __html: contract.contract_html || generateContractHTML(auction, listing, currentPrice, country) }} />
                          </ScrollArea>
                          <DialogFooter>
                            <p className="text-xs text-muted-foreground mr-auto">By signing, you agree to the terms above.</p>
                            <Button onClick={() => signContract.mutate(isSeller ? "seller" : "buyer")} disabled={signContract.isPending}>
                              {signContract.isPending ? "Signing..." : "I Agree — Sign Contract"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Post-Sale: Handover Checklist */}
              {escrow && (isWinner || isSeller) && (
                <Card className="border-primary/20">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Package className="w-4 h-4" /> Handover Checklist</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">Funds released to seller once all steps confirmed</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm">V5C / Logbook Received</span>
                        </div>
                        {escrow.v5c_received ? (
                          <Badge className="bg-emerald-500 text-white border-0">✓ Confirmed</Badge>
                        ) : (
                          isSeller ? (
                            <Button size="sm" variant="outline" onClick={() => confirmHandover.mutate("v5c_received")} disabled={confirmHandover.isPending}>
                              Confirm Sent
                            </Button>
                          ) : <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-primary" />
                          <span className="text-sm">Keys Handed Over</span>
                        </div>
                        {escrow.keys_handed_over ? (
                          <Badge className="bg-emerald-500 text-white border-0">✓ Confirmed</Badge>
                        ) : (
                          isSeller ? (
                            <Button size="sm" variant="outline" onClick={() => confirmHandover.mutate("keys_handed_over")} disabled={confirmHandover.isPending}>
                              Confirm Handed
                            </Button>
                          ) : <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm">Contract Signed</span>
                        </div>
                        {escrow.contract_signed || (contract?.buyer_signed && contract?.seller_signed) ? (
                          <Badge className="bg-emerald-500 text-white border-0">✓ Both Signed</Badge>
                        ) : <Badge variant="outline">Pending</Badge>}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Protection Status</span>
                      <Badge variant="outline" className="capitalize">{(escrow.status as string).replace(/_/g, " ")}</Badge>
                    </div>

                    {/* Delivery request */}
                    {isWinner && auction.delivery_available && (
                      <div className="pt-2">
                        <Button variant="outline" className="w-full gap-2" onClick={() => setShowDeliveryRequest(true)}>
                          <Truck className="w-4 h-4" /> Request Delivery
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Bid confirmation dialog */}
      <Dialog open={showBidConfirm} onOpenChange={setShowBidConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Bid</DialogTitle>
            <DialogDescription>This is a binding bid. Make sure you're ready to purchase.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Your Bid</span><span className="font-bold">{bidAmount ? formatCurrency(parseFloat(bidAmount), country) : "—"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Buyer Premium (3%)</span><span>{bidAmount ? formatCurrency(parseFloat(bidAmount) * 0.03, country) : "—"}</span></div>
            <Separator />
            <div className="flex justify-between font-bold"><span>Total if you win</span><span className="text-primary">{bidAmount ? formatCurrency(parseFloat(bidAmount) * 1.03, country) : "—"}</span></div>
            {useAutoBid && maxAutoBid && (
              <>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><Zap className="w-3 h-3" /> Auto-bid ceiling</span>
                  <span className="font-medium">{formatCurrency(parseFloat(maxAutoBid), country)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">System will bid minimum increments on your behalf up to this amount</p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBidConfirm(false)}>Cancel</Button>
            <Button onClick={() => placeBid.mutate()} disabled={placeBid.isPending}>
              {placeBid.isPending ? "Placing..." : "Confirm Bid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery request dialog */}
      <Dialog open={showDeliveryRequest} onOpenChange={setShowDeliveryRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Truck className="w-5 h-5" /> Request Delivery</DialogTitle>
            <DialogDescription>Our logistics partners will arrange delivery to your address.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Collection from</span><span className="font-medium">{auction.collection_address || listing?.location || "TBC"}</span></div>
              {auction.delivery_cost_estimate && (
                <div className="flex justify-between"><span className="text-muted-foreground">Estimated cost</span><span className="font-medium">{formatCurrency(auction.delivery_cost_estimate, country)}</span></div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Delivery cost is additional and paid by the buyer. Exact quote will be provided after confirming your delivery address.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeliveryRequest(false)}>Cancel</Button>
            <Button onClick={() => { toast.success("Delivery request submitted! Our team will contact you."); setShowDeliveryRequest(false); }}>
              <Send className="w-4 h-4 mr-1" /> Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

function getMinIncrement(currentPrice: number): number {
  if (currentPrice < 1000) return 50;
  if (currentPrice < 5000) return 100;
  if (currentPrice < 20000) return 250;
  if (currentPrice < 50000) return 500;
  return 1000;
}

function generateContractHTML(auction: any, listing: any, price: number, country: string): string {
  return `
    <h2 style="font-weight:bold;font-size:18px;margin-bottom:16px;">Vehicle Sale Agreement</h2>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    <p><strong>Auction ID:</strong> ${auction.id}</p>
    <hr style="margin:12px 0;"/>
    <p><strong>Vehicle:</strong> ${listing?.year} ${listing?.make} ${listing?.model}</p>
    <p><strong>Registration:</strong> ${listing?.registration || "N/A"}</p>
    <p><strong>VIN:</strong> ${listing?.vin || "N/A"}</p>
    <p><strong>Mileage:</strong> ${listing?.mileage?.toLocaleString() || "N/A"}</p>
    <hr style="margin:12px 0;"/>
    <p><strong>Hammer Price:</strong> ${price}</p>
    <p><strong>Buyer Premium (3%):</strong> ${(price * 0.03).toFixed(2)}</p>
    <p><strong>Total Due from Buyer:</strong> ${(price * 1.03).toFixed(2)}</p>
    <p><strong>Seller Fee (1.5%):</strong> ${(price * 0.015).toFixed(2)}</p>
    <p><strong>Seller Receives:</strong> ${(price * 0.985).toFixed(2)}</p>
    <hr style="margin:12px 0;"/>
    <h3 style="font-weight:bold;">Terms & Conditions</h3>
    <ol style="padding-left:20px;font-size:13px;">
      <li>The Seller agrees to transfer the vehicle to the Buyer upon receipt of full payment and completion of all handover requirements.</li>
      <li>The Buyer agrees to pay the Total Due within 72 hours of auction close.</li>
      <li>Funds are held under Payment Protection and released to the Seller only upon: (a) V5C/logbook transfer, (b) key handover, and (c) mutual contract signing.</li>
      <li>The vehicle is sold as described in the inspection and condition report. The platform makes no additional warranty unless explicitly stated.</li>
      <li>Delivery via logistics partners is at additional cost to the Buyer if arranged.</li>
      <li>This agreement is legally binding upon digital signature by both parties. IP addresses and timestamps are recorded for audit purposes.</li>
      <li>Any disputes shall be resolved through the platform's dispute resolution process.</li>
    </ol>
  `;
}

export default AuctionDetail;
