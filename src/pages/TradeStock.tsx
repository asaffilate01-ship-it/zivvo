import { useState } from "react";
import heroTradeStock from "@/assets/hero-trade-stock.jpg";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import { countryConfigs, formatPrice } from "@/lib/countryConfig";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import SellerOffers from "@/components/SellerOffers";
import {
  ArrowRightLeft, TrendingUp, Shield, Clock, CheckCircle2, XCircle,
  DollarSign, Truck, FileText, Search, Plus, Eye, Building2, CreditCard,
  Loader2 as Spinner, Banknote, Receipt,
} from "lucide-react";

const fmt = (amount: number, country: string) => {
  const cfg = countryConfigs[country as keyof typeof countryConfigs] || countryConfigs.GB;
  return formatPrice(amount, cfg);
};

const statusConfig: Record<string, { label: string; color: string }> = {
  sourced: { label: "Sourced", color: "bg-muted text-muted-foreground" },
  offer_sent: { label: "Offer Sent", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  seller_accepted: { label: "Seller Accepted", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  seller_rejected: { label: "Rejected", color: "bg-destructive/20 text-destructive" },
  acquired: { label: "Acquired", color: "bg-primary/20 text-primary" },
  listed_to_dealers: { label: "Listed to Dealers", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  dealer_accepted: { label: "Dealer Accepted", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  seller_paid: { label: "Seller Paid", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground" },
};

const TradeStock = () => {
  const { user, hasRole } = useAuth();
  const { country } = useCountry();
  const queryClient = useQueryClient();
  const isAdmin = hasRole("admin");
  const isSeller = hasRole("seller");
  const [tab, setTab] = useState(isAdmin ? "all" : isSeller ? "my_offers" : "available");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [payingDealId, setPayingDealId] = useState<string | null>(null);
  const [payoutDialog, setPayoutDialog] = useState<any>(null);
  const [payoutRef, setPayoutRef] = useState("");

  // Create deal form state
  const [selectedListing, setSelectedListing] = useState("");
  const [sellerPrice, setSellerPrice] = useState("");
  const [markupPct, setMarkupPct] = useState("5");
  const [adminNotes, setAdminNotes] = useState("");

  const dealerPrice = sellerPrice && markupPct
    ? (parseFloat(sellerPrice) * (1 + parseFloat(markupPct) / 100)).toFixed(0)
    : "";
  const platformMarkup = sellerPrice && dealerPrice
    ? (parseFloat(dealerPrice) - parseFloat(sellerPrice)).toFixed(0)
    : "";

  // Fetch deals
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["arbitrage-deals", tab],
    queryFn: async () => {
      let query = supabase
        .from("arbitrage_deals")
        .select("*, car_listings!inner(title, make, model, year, images, mileage, fuel_type, location, country)")
        .order("created_at", { ascending: false });

      if (tab === "available") {
        query = query.eq("status", "listed_to_dealers" as any);
      } else if (tab === "my_deals") {
        // Dealer's accepted deals
        query = query.in("status", ["dealer_accepted", "completed"] as any[]);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch listings for admin to create deals
  const { data: listings = [] } = useQuery({
    queryKey: ["all-active-listings-for-arb"],
    queryFn: async () => {
      const { data } = await supabase
        .from("car_listings")
        .select("id, title, make, model, year, price, seller_id")
        .eq("status", "active")
        .eq("country", country)
        .limit(100);
      return data || [];
    },
    enabled: isAdmin && showCreate,
  });

  // Fetch audit log for a deal
  const { data: auditLog = [] } = useQuery({
    queryKey: ["arbitrage-audit"],
    queryFn: async () => {
      const { data } = await supabase
        .from("arbitrage_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: isAdmin && tab === "audit",
  });

  // Create deal mutation (admin only)
  const createDeal = useMutation({
    mutationFn: async () => {
      if (!selectedListing || !sellerPrice) throw new Error("Select a listing and set price");
      const listing = listings.find((l: any) => l.id === selectedListing);
      if (!listing) throw new Error("Listing not found");

      const { error } = await supabase.from("arbitrage_deals").insert({
        listing_id: selectedListing,
        seller_id: listing.seller_id,
        seller_price: parseFloat(sellerPrice),
        platform_markup: parseFloat(platformMarkup || "0"),
        dealer_price: parseFloat(dealerPrice || sellerPrice),
        markup_pct: parseFloat(markupPct || "0"),
        status: "sourced" as any,
        sourced_by: user!.id,
        admin_notes: adminNotes || null,
        country,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Arbitrage deal created!");
      setShowCreate(false);
      setSelectedListing("");
      setSellerPrice("");
      queryClient.invalidateQueries({ queryKey: ["arbitrage-deals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Update deal status (admin)
  const updateStatus = useMutation({
    mutationFn: async ({ dealId, newStatus, extra }: { dealId: string; newStatus: string; extra?: Record<string, any> }) => {
      const { error } = await supabase
        .from("arbitrage_deals")
        .update({ status: newStatus as any, ...extra })
        .eq("id", dealId);
      if (error) throw error;

      await supabase.from("arbitrage_audit_log").insert({
        deal_id: dealId,
        actor_id: user!.id,
        actor_role: isAdmin ? "admin" : "dealer",
        action: `status_updated_to_${newStatus}`,
        details: extra || {},
      });
    },
    onSuccess: () => {
      toast.success("Deal updated!");
      queryClient.invalidateQueries({ queryKey: ["arbitrage-deals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Dealer accept deal
  const acceptDeal = useMutation({
    mutationFn: async (dealId: string) => {
      const { data: dealer } = await supabase
        .from("dealers")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      if (!dealer) throw new Error("You must be a registered dealer");

      const { error } = await supabase
        .from("arbitrage_deals")
        .update({
          status: "dealer_accepted" as any,
          buyer_dealer_id: dealer.id,
          dealer_accepted_at: new Date().toISOString(),
        })
        .eq("id", dealId);
      if (error) throw error;

      await supabase.from("arbitrage_audit_log").insert({
        deal_id: dealId,
        actor_id: user!.id,
        actor_role: "dealer",
        action: "dealer_accepted",
        details: { dealer_id: dealer.id },
      });

      // Trigger notification
      await supabase.functions.invoke("notify-arbitrage", {
        body: { deal_id: dealId, action: "dealer_accepted" },
      });
    },
    onSuccess: () => {
      toast.success("Deal accepted! Proceed to payment.");
      queryClient.invalidateQueries({ queryKey: ["arbitrage-deals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Dealer payment
  const payForDeal = useMutation({
    mutationFn: async (dealId: string) => {
      setPayingDealId(dealId);
      const { data, error } = await supabase.functions.invoke("arbitrage-payment", {
        body: { deal_id: dealId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("Failed to create payment session");
      }
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setPayingDealId(null);
    },
    onSettled: () => setPayingDealId(null),
  });

  // Admin: mark seller paid with ref
  const markSellerPaid = useMutation({
    mutationFn: async ({ dealId, ref }: { dealId: string; ref: string }) => {
      const { error } = await supabase
        .from("arbitrage_deals")
        .update({
          status: "seller_paid" as any,
          seller_paid_at: new Date().toISOString(),
          seller_payment_ref: ref,
        })
        .eq("id", dealId);
      if (error) throw error;

      await supabase.from("arbitrage_audit_log").insert({
        deal_id: dealId,
        actor_id: user!.id,
        actor_role: "admin",
        action: "seller_paid",
        details: { payment_ref: ref },
      });

      // Notify seller
      await supabase.functions.invoke("notify-arbitrage", {
        body: { deal_id: dealId, action: "seller_paid" },
      });
    },
    onSuccess: () => {
      toast.success("Seller marked as paid!");
      setPayoutDialog(null);
      setPayoutRef("");
      queryClient.invalidateQueries({ queryKey: ["arbitrage-deals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = deals.filter((d: any) => {
    const listing = d.car_listings;
    if (!listing) return false;
    const q = search.toLowerCase();
    return !q || listing.title?.toLowerCase().includes(q) || listing.make?.toLowerCase().includes(q);
  });

  return (
    <>
      <SEOHead title="Trade Stock — Wholesale Vehicle Arbitrage" description="Access pre-verified wholesale vehicles at competitive trade prices. Platform-sourced, inspected, and ready for your forecourt." />
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="text-white py-16 md:py-20 relative overflow-hidden">
          <img src={heroTradeStock} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5 text-primary" />
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">Trade Stock</Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-display mb-3 tracking-tight">
              Wholesale Vehicle<br className="hidden md:block" /> Arbitrage
            </h1>
            <p className="text-white/70 max-w-2xl text-base md:text-lg leading-relaxed">
              We source verified vehicles from sellers, inspect them, and offer them to our dealer network at a small markup.
              You get trade-ready stock — we handle the seller, paperwork, and logistics.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search trade stock..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            {isAdmin && (
              <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="w-4 h-4" /> Create Deal</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Arbitrage Deal</DialogTitle>
                    <DialogDescription>Source a car from a seller and set your markup for dealer resale.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label>Select Listing</Label>
                      <Select value={selectedListing} onValueChange={setSelectedListing}>
                        <SelectTrigger><SelectValue placeholder="Choose a car..." /></SelectTrigger>
                        <SelectContent>
                          {listings.map((l: any) => (
                            <SelectItem key={l.id} value={l.id}>{l.year} {l.make} {l.model} — {fmt(l.price, country)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Buy from Seller at</Label>
                        <Input type="number" value={sellerPrice} onChange={(e) => setSellerPrice(e.target.value)} placeholder="e.g. 8000" />
                      </div>
                      <div>
                        <Label>Markup %</Label>
                        <Input type="number" value={markupPct} onChange={(e) => setMarkupPct(e.target.value)} placeholder="5" />
                      </div>
                    </div>
                    {sellerPrice && (
                      <Card className="bg-muted/50">
                        <CardContent className="p-4 space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Seller Price</span><span>{fmt(parseFloat(sellerPrice), country)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Platform Markup ({markupPct}%)</span><span className="text-primary font-medium">{fmt(parseFloat(platformMarkup || "0"), country)}</span></div>
                          <Separator />
                          <div className="flex justify-between font-bold"><span>Dealer Pays</span><span>{fmt(parseFloat(dealerPrice || "0"), country)}</span></div>
                        </CardContent>
                      </Card>
                    )}
                    <div>
                      <Label>Admin Notes</Label>
                      <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Why this car? Market observations..." rows={2} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => createDeal.mutate()} disabled={createDeal.isPending}>
                      {createDeal.isPending ? "Creating..." : "Create Deal"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="available" className="gap-1"><Building2 className="w-4 h-4" /> Available Stock</TabsTrigger>
              <TabsTrigger value="my_offers" className="gap-1"><Receipt className="w-4 h-4" /> My Offers</TabsTrigger>
              <TabsTrigger value="my_deals" className="gap-1"><CheckCircle2 className="w-4 h-4" /> My Deals</TabsTrigger>
              {isAdmin && <TabsTrigger value="all" className="gap-1"><Eye className="w-4 h-4" /> All Deals</TabsTrigger>}
              {isAdmin && <TabsTrigger value="audit" className="gap-1"><FileText className="w-4 h-4" /> Audit Log</TabsTrigger>}
            </TabsList>

            {/* Seller offers tab */}
            <TabsContent value="my_offers" className="mt-6">
              <SellerOffers />
            </TabsContent>

            <TabsContent value={tab === "my_offers" ? "__skip__" : tab} className={tab === "my_offers" ? "hidden" : "mt-6"}>
              {tab === "audit" ? (
                <Card>
                  <CardContent className="p-4">
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {auditLog.map((log: any) => (
                          <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium">{log.action.replace(/_/g, " ")}</p>
                              <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()} • {log.actor_role}</p>
                              {log.details && Object.keys(log.details).length > 0 && (
                                <pre className="text-[10px] text-muted-foreground mt-1 bg-muted rounded p-1 overflow-x-auto">{JSON.stringify(log.details, null, 2)}</pre>
                              )}
                            </div>
                          </div>
                        ))}
                        {auditLog.length === 0 && <p className="text-center text-muted-foreground py-6">No audit entries yet</p>}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ) : isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => <Card key={i} className="animate-pulse"><div className="aspect-[16/10] bg-muted rounded-t-lg" /><CardContent className="p-4"><div className="h-5 bg-muted rounded w-3/4 mb-2" /><div className="h-4 bg-muted rounded w-1/2" /></CardContent></Card>)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <ArrowRightLeft className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-1">No trade stock available</h3>
                  <p className="text-muted-foreground">Check back soon — new vehicles are sourced daily.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((deal: any) => {
                    const listing = deal.car_listings;
                    const img = listing?.images?.[0] || "/placeholder.svg";
                    const sc = statusConfig[deal.status] || statusConfig.sourced;
                    const showDealerActions = deal.status === "listed_to_dealers" && !isAdmin;
                    const showAdminActions = isAdmin;

                    return (
                      <Card key={deal.id} className="overflow-hidden hover:shadow-lg transition-shadow border-border/50">
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <img src={img} alt={listing?.title} className="w-full h-full object-cover" />
                          <div className="absolute top-3 left-3">
                            <Badge className={sc.color}>{sc.label}</Badge>
                          </div>
                          <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5">
                            <p className="text-xs text-muted-foreground">Trade Price</p>
                            <p className="font-bold text-foreground">{fmt(deal.dealer_price, deal.country)}</p>
                          </div>
                        </div>
                        <CardContent className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold">{listing?.year} {listing?.make} {listing?.model}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              {listing?.mileage && <span>{listing.mileage.toLocaleString()} mi</span>}
                              {listing?.fuel_type && <span>• {listing.fuel_type}</span>}
                              {listing?.location && <span>• {listing.location}</span>}
                            </div>
                          </div>

                          {isAdmin && (
                            <div className="text-xs space-y-1 p-2 rounded-lg bg-muted/50">
                              <div className="flex justify-between"><span className="text-muted-foreground">Seller price</span><span>{fmt(deal.seller_price, deal.country)}</span></div>
                              <div className="flex justify-between"><span className="text-muted-foreground">Markup ({deal.markup_pct}%)</span><span className="text-primary font-medium">+{fmt(deal.platform_markup, deal.country)}</span></div>
                              <div className="flex justify-between font-medium"><span>Dealer price</span><span>{fmt(deal.dealer_price, deal.country)}</span></div>
                            </div>
                          )}

                          {/* Dealer actions */}
                          {showDealerActions && deal.status === "listed_to_dealers" && (
                            <Button className="w-full gap-2" onClick={() => acceptDeal.mutate(deal.id)} disabled={acceptDeal.isPending}>
                              <CheckCircle2 className="w-4 h-4" /> {acceptDeal.isPending ? "Accepting..." : "Accept & Purchase"}
                            </Button>
                          )}

                          {/* Dealer: pay for accepted deal */}
                          {!isAdmin && deal.status === "dealer_accepted" && (
                            <Button className="w-full gap-2" onClick={() => payForDeal.mutate(deal.id)} disabled={payingDealId === deal.id}>
                              {payingDealId === deal.id ? <Spinner className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                              {payingDealId === deal.id ? "Opening Payment..." : `Pay ${fmt(deal.dealer_price, deal.country)}`}
                            </Button>
                          )}

                          {/* Admin actions */}
                          {showAdminActions && (
                            <div className="flex flex-wrap gap-2">
                              {deal.status === "sourced" && (
                                <Button size="sm" variant="outline" onClick={async () => {
                                  await updateStatus.mutateAsync({ dealId: deal.id, newStatus: "offer_sent", extra: { seller_offer_sent_at: new Date().toISOString() } });
                                  await supabase.functions.invoke("notify-arbitrage", { body: { deal_id: deal.id, action: "offer_sent" } });
                                }}>
                                  Send to Seller
                                </Button>
                              )}
                              {deal.status === "seller_accepted" && (
                                <Button size="sm" onClick={async () => {
                                  await updateStatus.mutateAsync({ dealId: deal.id, newStatus: "listed_to_dealers", extra: { dealer_offer_sent_at: new Date().toISOString() } });
                                  await supabase.functions.invoke("notify-arbitrage", { body: { deal_id: deal.id, action: "listed_to_dealers" } });
                                }}>
                                  List to Dealers
                                </Button>
                              )}
                              {deal.status === "dealer_accepted" && (
                                <Button size="sm" className="gap-1" onClick={() => setPayoutDialog(deal)}>
                                  <Banknote className="w-3.5 h-3.5" /> Pay Seller
                                </Button>
                              )}
                              {deal.status === "seller_paid" && (
                                <Button size="sm" variant="default" onClick={async () => {
                                  await updateStatus.mutateAsync({ dealId: deal.id, newStatus: "completed" });
                                  await supabase.functions.invoke("notify-arbitrage", { body: { deal_id: deal.id, action: "completed" } });
                                }}>
                                  Complete Deal
                                </Button>
                              )}
                              {deal.seller_payment_ref && (
                                <span className="text-[10px] text-muted-foreground self-center">Ref: {deal.seller_payment_ref}</span>
                              )}
                              {!["completed", "cancelled", "seller_rejected"].includes(deal.status) && (
                                <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate({ dealId: deal.id, newStatus: "cancelled" })}>
                                  Cancel
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Seller payout dialog */}
          <Dialog open={!!payoutDialog} onOpenChange={() => { setPayoutDialog(null); setPayoutRef(""); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mark Seller as Paid</DialogTitle>
                <DialogDescription>
                  Record the payment reference for {payoutDialog?.car_listings?.title || "this vehicle"}.
                  Seller receives {payoutDialog ? fmt(payoutDialog.seller_price, payoutDialog.country) : ""}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label>Payment Reference / Bank Transfer Ref</Label>
                  <Input
                    value={payoutRef}
                    onChange={(e) => setPayoutRef(e.target.value)}
                    placeholder="e.g. BACS-2026-03-18-001"
                  />
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Seller Price</span><span>{payoutDialog ? fmt(payoutDialog.seller_price, payoutDialog.country) : ""}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Platform Revenue</span><span className="text-primary">{payoutDialog ? fmt(payoutDialog.platform_markup, payoutDialog.country) : ""}</span></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPayoutDialog(null)}>Cancel</Button>
                <Button
                  onClick={() => payoutDialog && markSellerPaid.mutate({ dealId: payoutDialog.id, ref: payoutRef })}
                  disabled={!payoutRef.trim() || markSellerPaid.isPending}
                  className="gap-2"
                >
                  {markSellerPaid.isPending ? <Spinner className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                  {markSellerPaid.isPending ? "Processing..." : "Confirm Payment Sent"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* How it works */}
          <section className="mt-16 pb-8">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-3">How It Works</Badge>
              <h2 className="text-2xl md:text-3xl font-bold font-display">Arbitrage in 5 Steps</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { icon: Search, step: "01", title: "We Source", desc: "Platform identifies undervalued or high-demand vehicles" },
                { icon: DollarSign, step: "02", title: "We Buy", desc: "We make the seller a fair offer and acquire the car" },
                { icon: Shield, step: "03", title: "We Verify", desc: "Full inspection, HPI check, and condition report" },
                { icon: Building2, step: "04", title: "We Offer", desc: "Listed to our dealer network at a small markup" },
                { icon: Truck, step: "05", title: "We Deliver", desc: "Logistics arranged, seller paid, deal completed" },
              ].map(({ icon: Icon, step, title, desc }, idx) => (
                <div key={step} className="relative text-center group">
                  {idx < 4 && <div className="hidden md:block absolute top-5 left-[60%] w-[80%] h-px bg-border" />}
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-[10px] font-mono text-primary font-semibold tracking-widest mb-1">STEP {step}</p>
                  <h3 className="font-semibold text-sm mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TradeStock;
