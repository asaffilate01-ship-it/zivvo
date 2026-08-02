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
import { useTranslation } from "react-i18next";
import { idempotencyHeaders } from "@/lib/idempotency";

const formatCurrency = (amount: number, country: string) => {
  const cfg = countryConfigs[country as keyof typeof countryConfigs] || countryConfigs.DE;
  return formatPrice(amount, cfg);
};

const AuctionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { country } = useCountry();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
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
      toast.success(t("auctionDetail.toasts.paymentSuccess"));
      queryClient.invalidateQueries({ queryKey: ["auction-escrow", id] });
    }
  }, [searchParams, id, queryClient, t]);

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
      if (diff <= 0) { setTimeLeft(t("auctionDetail.sidebar.auctionEnded")); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m ${s}s` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [auction?.ends_at, t]);

  const toggleWatch = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error(t("auctionDetail.errors.loginRequired"));
      if (isWatching) {
        await supabase.from("auction_watchers").delete().eq("auction_id", id).eq("user_id", user.id);
      } else {
        await supabase.from("auction_watchers").insert({ auction_id: id, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-watching", id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["auction", id] });
      toast.success(isWatching ? t("auctionDetail.toasts.watchRemoved") : t("auctionDetail.toasts.watchAdded"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const placeBid = useMutation({
    mutationFn: async () => {
      if (!user || !auction) throw new Error(t("auctionDetail.errors.loginRequired"));
      const amount = parseFloat(bidAmount);
      const minBid = (auction.current_bid > 0 ? auction.current_bid : auction.starting_price) + getMinIncrement(auction.current_bid || auction.starting_price);
      if (amount < minBid) throw new Error(t("auctionDetail.errors.minimumBid", { amount: formatCurrency(minBid, country) }));
      if (user.id === auction.seller_id) throw new Error(t("auctionDetail.errors.cannotBidOwnAuction"));

      // Check deposit
      if (!deposit || deposit.status !== "authorized") {
        throw new Error(t("auctionDetail.errors.depositRequired"));
      }

      const bidData: any = {
        auction_id: auction.id,
        bidder_id: user.id,
        amount,
        deposit_verified: true,
      };

      if (useAutoBid && maxAutoBid) {
        const maxAuto = parseFloat(maxAutoBid);
        if (maxAuto < amount) throw new Error(t("auctionDetail.errors.maxAutoBidTooLow"));
        bidData.max_auto_bid = maxAuto;
      }

      const { error } = await supabase.from("auction_bids").insert(bidData);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("auctionDetail.toasts.bidPlaced"));
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
      toast.success(t("auctionDetail.toasts.contractSigned"));
      queryClient.invalidateQueries({ queryKey: ["auction-contract", id] });
      setShowContract(false);
    },
    onError: () => toast.error(t("auctionDetail.toasts.contractSignFailed")),
  });

  const confirmHandover = useMutation({
    mutationFn: async (field: "v5c_received" | "keys_handed_over") => {
      if (!escrow) return;
      const { error } = await supabase
        .from("auction_escrow")
        .update({ [field]: true } as never)
        .eq("id", escrow.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("auctionDetail.toasts.handoverConfirmed"));
      queryClient.invalidateQueries({ queryKey: ["auction-escrow", id] });
    },
    onError: () => toast.error(t("auctionDetail.toasts.handoverFailed")),
  });

  const requestDeposit = useMutation({
    mutationFn: async () => {
      // Now handled by StripeDepositForm component
      setShowDepositForm(true);
    },
  });

  const payWinnerBalance = useMutation({
    mutationFn: async () => {
      if (!user || !auction) throw new Error(t("auctionDetail.errors.loginRequired"));
      const { data, error } = await supabase.functions.invoke("winner-payment", {
        body: { auction_id: auction.id },
        headers: idempotencyHeaders(),
      });
      if (error) throw error;
      if (data?.fully_paid) {
        toast.success(t("auctionDetail.toasts.paymentComplete"));
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
  if (!auction) return (<><Navbar /><div className="min-h-screen flex items-center justify-center"><p>{t("auctionDetail.notFound")}</p></div></>);

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
      <SEOHead title={t("auctionDetail.seo.title", { year: listing?.year, make: listing?.make, model: listing?.model })} description={t("auctionDetail.seo.description", { make: listing?.make, model: listing?.model, rating: auction.inspection_rating })} />
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/auctions" className="hover:text-primary">{t("auctionDetail.breadcrumb")}</Link>
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
                  {isLive && <Badge className="bg-red-500 text-white border-0 animate-pulse"><span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 inline-block" />{t("auctionDetail.gallery.live")}</Badge>}
                  {auction.inspection_rating && <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm"><Star className="w-3 h-3 mr-1 fill-primary text-primary" />{t("auctionDetail.gallery.condition", { rating: auction.inspection_rating })}</Badge>}
                </div>
                <div className="absolute top-3 right-3">
                  {user && (
                    <button onClick={() => toggleWatch.mutate()} className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition">
                      {isWatching ? <Heart className="w-5 h-5 fill-red-500 text-red-500" /> : <Heart className="w-5 h-5 text-muted-foreground" />}
                    </button>
                  )}
                </div>
                <div className="absolute bottom-3 left-3 flex gap-2 text-xs">
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">{t("auctionDetail.gallery.photos", { current: imageIdx + 1, total: images.length })}</Badge>
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
                  <TabsTrigger value="condition">{t("auctionDetail.tabs.condition")}</TabsTrigger>
                  <TabsTrigger value="history">{t("auctionDetail.tabs.history")}</TabsTrigger>
                  <TabsTrigger value="assets">{t("auctionDetail.tabs.assets")}</TabsTrigger>
                  <TabsTrigger value="bids">{t("auctionDetail.tabs.bids", { count: bids.length })}</TabsTrigger>
                </TabsList>

                <TabsContent value="condition" className="mt-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{auction.inspection_rating || "—"}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{t("auctionDetail.conditionTab.inspectionRating")}</h3>
                          <p className="text-sm text-muted-foreground">{t("auctionDetail.conditionTab.assessedBy")}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { icon: Paintbrush, label: t("auctionDetail.conditionTab.paintCondition"), value: conditionReport.paint_condition },
                          { icon: Car, label: t("auctionDetail.conditionTab.interiorCondition"), value: conditionReport.interior_condition },
                          { icon: Wrench, label: t("auctionDetail.conditionTab.mechanicalNotes"), value: conditionReport.mechanical_notes },
                          { icon: Eye, label: t("auctionDetail.conditionTab.tyresCondition"), value: conditionReport.tyres_condition },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <Icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm">{label}</p>
                              <p className="text-sm text-muted-foreground">{value || t("auctionDetail.conditionTab.notAssessed")}</p>
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
                          { label: t("auctionDetail.historyTab.hpiCheck"), status: auction.hpi_clear, icon: Shield, ok: t("auctionDetail.historyTab.hpiClear"), bad: t("auctionDetail.historyTab.pending") },
                          { label: t("auctionDetail.historyTab.ownershipVerified"), status: auction.ownership_verified, icon: FileText, ok: t("auctionDetail.historyTab.ownershipOk"), bad: t("auctionDetail.historyTab.pending") },
                          { label: t("auctionDetail.historyTab.sellerVerified"), status: auction.seller_verified, icon: CheckCircle2, ok: t("auctionDetail.historyTab.sellerVerifiedOk"), bad: t("auctionDetail.historyTab.pending") },
                          { label: t("auctionDetail.historyTab.accidentHistory"), status: !conditionReport.accident_history, icon: AlertTriangle, ok: t("auctionDetail.historyTab.noAccidents"), bad: conditionReport.accident_history || t("auctionDetail.historyTab.pending") },
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
                          { icon: Key, label: t("auctionDetail.assetsTab.keys"), value: conditionReport.keys_count ? t("auctionDetail.assetsTab.keysCount", { count: conditionReport.keys_count, spare: conditionReport.spare_key ? t("auctionDetail.assetsTab.plusSpare") : "" }) : t("auctionDetail.assetsTab.notSpecified") },
                          { icon: FileText, label: t("auctionDetail.assetsTab.serviceHistory"), value: conditionReport.service_history || t("auctionDetail.assetsTab.notSpecified") },
                          { icon: Shield, label: t("auctionDetail.assetsTab.warranty"), value: conditionReport.warranty_info || t("auctionDetail.assetsTab.noWarranty") },
                          { icon: Car, label: t("auctionDetail.assetsTab.additionalAssets"), value: conditionReport.assets_included || t("auctionDetail.assetsTab.noneListed") },
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
                              <p className="font-medium text-sm">{t("auctionDetail.assetsTab.deliveryAvailable")}</p>
                              <p className="text-xs text-muted-foreground">
                                {t("auctionDetail.assetsTab.deliveryVia", { estimate: auction.delivery_cost_estimate ? t("auctionDetail.assetsTab.deliveryEstimate", { amount: formatCurrency(auction.delivery_cost_estimate, country) }) : "" })}
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
                        <p className="text-center text-muted-foreground py-6">{t("auctionDetail.bidsTab.noBids")}</p>
                      ) : (
                        <ScrollArea className="h-80">
                          <div className="space-y-2">
                            {bids.map((bid: any, i: number) => (
                              <div key={bid.id} className={`flex items-center justify-between p-3 rounded-lg ${i === 0 ? "bg-primary/10 border border-primary/20" : "bg-muted/30"}`}>
                                <div className="flex items-center gap-3">
                                  {i === 0 && <TrendingUp className="w-4 h-4 text-primary" />}
                                  <div>
                                    <p className="font-medium text-sm flex items-center gap-1.5">
                                      {bid.bidder_id === user?.id ? t("auctionDetail.bidsTab.you") : t("auctionDetail.bidsTab.bidderMasked", { last4: bid.bidder_id.slice(-4) })}
                                      {bid.is_auto_bid && <Badge variant="outline" className="text-[9px] py-0"><Zap className="w-2.5 h-2.5 mr-0.5" />{t("auctionDetail.bidsTab.auto")}</Badge>}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{new Date(bid.created_at).toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`font-bold ${i === 0 ? "text-primary" : ""}`}>{formatCurrency(bid.amount, country)}</p>
                                  {bid.finance_preapproved && <Badge variant="outline" className="text-[9px] py-0">{t("auctionDetail.bidsTab.finance")}</Badge>}
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
                    <p className="text-sm text-muted-foreground mb-1">{auction.bid_count > 0 ? t("auctionDetail.sidebar.currentBid") : t("auctionDetail.sidebar.startingPrice")}</p>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(currentPrice, country)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("auctionDetail.sidebar.bidsWatchers", { bids: auction.bid_count || 0, watchers: auction.watchers_count || 0 })}</p>
                  </div>

                  {!reserveMet && auction.status !== "draft" && (
                    <div className="flex items-center justify-center gap-1 mb-4">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-amber-600 font-medium">{t("auctionDetail.sidebar.reserveNotMet")}</span>
                    </div>
                  )}

                  <div className={`rounded-lg p-3 mb-4 text-center ${isLive ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800" : "bg-muted"}`}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Clock className={`w-4 h-4 ${isLive ? "text-red-500" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium">{isLive ? t("auctionDetail.sidebar.timeRemaining") : t("auctionDetail.sidebar.auctionStatus", { status: auction.status })}</span>
                    </div>
                    <p className={`text-xl font-bold font-mono ${isLive ? "text-red-600 dark:text-red-400" : ""}`}>{timeLeft || "—"}</p>
                  </div>

                  {/* Watch button */}
                  {user && !isSeller && (
                    <Button variant="outline" className="w-full mb-3 gap-2" onClick={() => toggleWatch.mutate()} disabled={toggleWatch.isPending}>
                      {isWatching ? <><HeartOff className="w-4 h-4" /> {t("auctionDetail.sidebar.unwatch")}</> : <><Heart className="w-4 h-4" /> {t("auctionDetail.sidebar.watchAuction")}</>}
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
                              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t("auctionDetail.sidebar.verificationRequired")}</p>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{t("auctionDetail.sidebar.chooseOption")}</p>
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" className="gap-1 flex-1" onClick={() => setShowDepositForm(true)}>
                                  <CreditCard className="w-3 h-3" /> {t("auctionDetail.sidebar.cardDeposit")}
                                </Button>
                                <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => setShowFinanceForm(true)}>
                                  <Banknote className="w-3 h-3" /> {t("auctionDetail.sidebar.financeOption")}
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
                            {deposit?.type === "finance_preapproval" ? t("auctionDetail.sidebar.financePreapproved") : t("auctionDetail.sidebar.depositPreauthorized")}{t("auctionDetail.sidebar.readyToBid")}
                          </span>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t("auctionDetail.sidebar.yourBidMin", { amount: formatCurrency((currentPrice) + getMinIncrement(currentPrice), country) })}</p>
                          <Input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder={`${(currentPrice + getMinIncrement(currentPrice))}`} className="text-lg font-semibold" disabled={!hasDeposit} />
                        </div>

                        {/* Auto-bid toggle */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            <Label className="text-sm cursor-pointer" htmlFor="auto-bid">{t("auctionDetail.sidebar.autoBid")}</Label>
                          </div>
                          <Switch id="auto-bid" checked={useAutoBid} onCheckedChange={setUseAutoBid} disabled={!hasDeposit} />
                        </div>
                        {useAutoBid && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{t("auctionDetail.sidebar.maxAutoBidCeiling")}</p>
                            <Input type="number" value={maxAutoBid} onChange={(e) => setMaxAutoBid(e.target.value)} placeholder="e.g. 15000" disabled={!hasDeposit} />
                            <p className="text-[10px] text-muted-foreground mt-1">{t("auctionDetail.sidebar.autoBidHint")}</p>
                          </div>
                        )}

                        <Button className="w-full h-12 text-lg gap-2" onClick={() => setShowBidConfirm(true)} disabled={!bidAmount || !hasDeposit}>
                          <Gavel className="w-5 h-5" /> {t("auctionDetail.sidebar.placeBid")}
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center mt-2">
                        {t("auctionDetail.sidebar.buyerPremiumNote")}
                      </p>
                    </>
                  )}

                  {!user && isLive && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-3">{t("auctionDetail.sidebar.registerToBid")}</p>
                      <Button asChild className="w-full"><Link to="/signup">{t("auctionDetail.sidebar.createAccount")}</Link></Button>
                    </div>
                  )}

                  {isSeller && (
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <p className="text-sm font-medium">{t("auctionDetail.sidebar.yourAuction")}</p>
                      {auction.reserve_price && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("auctionDetail.sidebar.reserve", { amount: formatCurrency(auction.reserve_price, country), status: reserveMet ? t("auctionDetail.sidebar.reserveMet") : t("auctionDetail.sidebar.reserveNotMetShort") })}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fee Breakdown */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{t("auctionDetail.feeBreakdown.title")}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionDetail.feeBreakdown.hammerPrice")}</span><span>{formatCurrency(currentPrice, country)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionDetail.feeBreakdown.buyerPremium")}</span><span>{formatCurrency(currentPrice * 0.03, country)}</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold"><span>{t("auctionDetail.feeBreakdown.totalForBuyer")}</span><span>{formatCurrency(currentPrice * 1.03, country)}</span></div>
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  {[
                    { icon: Shield, label: t("auctionDetail.trustBadges.paymentProtected"), desc: t("auctionDetail.trustBadges.paymentProtectedDesc") },
                    { icon: CreditCard, label: t("auctionDetail.trustBadges.depositPreauth"), desc: t("auctionDetail.trustBadges.depositPreauthDesc") },
                    { icon: FileText, label: t("auctionDetail.trustBadges.eSignContract"), desc: t("auctionDetail.trustBadges.eSignContractDesc") },
                    { icon: CheckCircle2, label: t("auctionDetail.trustBadges.auditTrail"), desc: t("auctionDetail.trustBadges.auditTrailDesc") },
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

              {/* Post-Sale: Winner Payment Button */}
              {(isSold || auction.status === "ended") && isWinner && escrow && escrow.status === "pending_deposit" && (
                <Card className="border-amber-200 dark:border-amber-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 text-amber-600" /> {t("auctionDetail.winnerPayment.title")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionDetail.winnerPayment.totalDue")}</span><span className="font-bold">{formatCurrency(Number(escrow.total_amount), country)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionDetail.winnerPayment.depositHeld")}</span><span>{deposit ? formatCurrency(Number(deposit.amount), country) : "—"}</span></div>
                      <Separator />
                      <div className="flex justify-between font-bold"><span>{t("auctionDetail.winnerPayment.remainingBalance")}</span><span className="text-primary">{formatCurrency(Number(escrow.total_amount) - (deposit ? Number(deposit.amount) : 0), country)}</span></div>
                    </div>
                    {(escrow as any).payment_deadline && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <Timer className="w-4 h-4 text-amber-600" />
                        <div>
                          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">{t("auctionDetail.winnerPayment.paymentDeadline")}</p>
                          <p className="text-xs text-amber-600 dark:text-amber-400">{new Date((escrow as any).payment_deadline).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    <Button className="w-full gap-2" onClick={() => payWinnerBalance.mutate()} disabled={payWinnerBalance.isPending}>
                      {payWinnerBalance.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                      {payWinnerBalance.isPending ? t("auctionDetail.winnerPayment.processing") : t("auctionDetail.winnerPayment.payRemainingBalance")}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Post-Sale: Contract section for winner/seller */}
              {(isSold || auction.status === "ended") && (isWinner || isSeller) && contract && (
                <Card className="border-primary/30">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> {t("auctionDetail.contract.title")}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionDetail.contract.buyerSigned")}</span><span>{contract.buyer_signed ? `✅ ${new Date(contract.buyer_signed_at).toLocaleDateString()}` : t("auctionDetail.contract.pending")}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionDetail.contract.sellerSigned")}</span><span>{contract.seller_signed ? `✅ ${new Date(contract.seller_signed_at).toLocaleDateString()}` : t("auctionDetail.contract.pending")}</span></div>
                    </div>
                    {((isWinner && !contract.buyer_signed) || (isSeller && !contract.seller_signed)) && (
                      <Dialog open={showContract} onOpenChange={setShowContract}>
                        <DialogTrigger asChild>
                          <Button className="w-full" variant="default">{t("auctionDetail.contract.reviewAndSign")}</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{t("auctionDetail.contract.dialogTitle")}</DialogTitle>
                            <DialogDescription>{t("auctionDetail.contract.dialogDesc")}</DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="h-80 border rounded-lg p-4 text-sm">
                            <div dangerouslySetInnerHTML={{ __html: contract.contract_html || generateContractHTML(auction, listing, currentPrice, country) }} />
                          </ScrollArea>
                          <DialogFooter>
                            <p className="text-xs text-muted-foreground mr-auto">{t("auctionDetail.contract.agreeNote")}</p>
                            <Button onClick={() => signContract.mutate(isSeller ? "seller" : "buyer")} disabled={signContract.isPending}>
                              {signContract.isPending ? t("auctionDetail.contract.signing") : t("auctionDetail.contract.signButton")}
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
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Package className="w-4 h-4" /> {t("auctionDetail.handover.title")}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">{t("auctionDetail.handover.fundsNote")}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm">{t("auctionDetail.handover.v5cReceived")}</span>
                        </div>
                        {escrow.v5c_received ? (
                          <Badge className="bg-emerald-500 text-white border-0">{t("auctionDetail.handover.confirmed")}</Badge>
                        ) : (
                          isSeller ? (
                            <Button size="sm" variant="outline" onClick={() => confirmHandover.mutate("v5c_received")} disabled={confirmHandover.isPending}>
                              {t("auctionDetail.handover.confirmSent")}
                            </Button>
                          ) : <Badge variant="outline">{t("auctionDetail.handover.pending")}</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-primary" />
                          <span className="text-sm">{t("auctionDetail.handover.keysHandedOver")}</span>
                        </div>
                        {escrow.keys_handed_over ? (
                          <Badge className="bg-emerald-500 text-white border-0">{t("auctionDetail.handover.confirmed")}</Badge>
                        ) : (
                          isSeller ? (
                            <Button size="sm" variant="outline" onClick={() => confirmHandover.mutate("keys_handed_over")} disabled={confirmHandover.isPending}>
                              {t("auctionDetail.handover.confirmHanded")}
                            </Button>
                          ) : <Badge variant="outline">{t("auctionDetail.handover.pending")}</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm">{t("auctionDetail.handover.contractSigned")}</span>
                        </div>
                        {escrow.contract_signed || (contract?.buyer_signed && contract?.seller_signed) ? (
                          <Badge className="bg-emerald-500 text-white border-0">{t("auctionDetail.handover.bothSigned")}</Badge>
                        ) : <Badge variant="outline">{t("auctionDetail.handover.pending")}</Badge>}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t("auctionDetail.handover.protectionStatus")}</span>
                      <Badge variant="outline" className="capitalize">{(escrow.status as string).replace(/_/g, " ")}</Badge>
                    </div>

                    {/* Delivery request */}
                    {isWinner && auction.delivery_available && (
                      <div className="pt-2">
                        <Button variant="outline" className="w-full gap-2" onClick={() => setShowDeliveryRequest(true)}>
                          <Truck className="w-4 h-4" /> {t("auctionDetail.handover.requestDelivery")}
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
            <DialogTitle>{t("auctionDetail.bidDialog.title")}</DialogTitle>
            <DialogDescription>{t("auctionDetail.bidDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("auctionDetail.bidDialog.yourBid")}</span><span className="font-bold">{bidAmount ? formatCurrency(parseFloat(bidAmount), country) : "—"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("auctionDetail.bidDialog.buyerPremium")}</span><span>{bidAmount ? formatCurrency(parseFloat(bidAmount) * 0.03, country) : "—"}</span></div>
            <Separator />
            <div className="flex justify-between font-bold"><span>{t("auctionDetail.bidDialog.totalIfWin")}</span><span className="text-primary">{bidAmount ? formatCurrency(parseFloat(bidAmount) * 1.03, country) : "—"}</span></div>
            {useAutoBid && maxAutoBid && (
              <>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><Zap className="w-3 h-3" /> {t("auctionDetail.bidDialog.autoBidCeiling")}</span>
                  <span className="font-medium">{formatCurrency(parseFloat(maxAutoBid), country)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{t("auctionDetail.bidDialog.autoBidHint")}</p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBidConfirm(false)}>{t("auctionDetail.bidDialog.cancel")}</Button>
            <Button onClick={() => placeBid.mutate()} disabled={placeBid.isPending}>
              {placeBid.isPending ? t("auctionDetail.bidDialog.placing") : t("auctionDetail.bidDialog.confirmBid")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery request dialog */}
      <Dialog open={showDeliveryRequest} onOpenChange={setShowDeliveryRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Truck className="w-5 h-5" /> {t("auctionDetail.deliveryDialog.title")}</DialogTitle>
            <DialogDescription>{t("auctionDetail.deliveryDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionDetail.deliveryDialog.collectionFrom")}</span><span className="font-medium">{auction.collection_address || listing?.location || t("auctionDetail.deliveryDialog.tbc")}</span></div>
              {auction.delivery_cost_estimate && (
                <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionDetail.deliveryDialog.estimatedCost")}</span><span className="font-medium">{formatCurrency(auction.delivery_cost_estimate, country)}</span></div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t("auctionDetail.deliveryDialog.note")}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeliveryRequest(false)}>{t("auctionDetail.deliveryDialog.cancel")}</Button>
            <Button onClick={() => { toast.success(t("auctionDetail.toasts.deliveryRequestSubmitted")); setShowDeliveryRequest(false); }}>
              <Send className="w-4 h-4 mr-1" /> {t("auctionDetail.deliveryDialog.submitRequest")}
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
    <p><strong>Hammer Price:</strong> €${price}</p>
    <p><strong>Buyer Premium (3%):</strong> €${(price * 0.03).toFixed(2)}</p>
    <p><strong>Total Due from Buyer:</strong> €${(price * 1.03).toFixed(2)}</p>
    <p><strong>Seller Fee (1.5%):</strong> €${(price * 0.015).toFixed(2)}</p>
    <p><strong>Seller Receives:</strong> €${(price * 0.985).toFixed(2)}</p>
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
