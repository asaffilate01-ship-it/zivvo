import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Car, Plus, Eye, MessageSquare, TrendingUp, Package,
  Settings, BarChart3, ExternalLink, CreditCard, Loader2, Edit, Trash2, Rocket,
  Download, CheckSquare, Square,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import BoostListingDialog from "@/components/BoostListingDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { redirectToStripe } from "@/lib/safeNavigation";
import DealerPageBuilder from "@/components/DealerPageBuilder";
import SellerAnalytics from "@/components/SellerAnalytics";
import SalesPipeline from "@/components/SalesPipeline";
import StockBookManager from "@/components/dealer/StockBookManager";
import VehicleCostsManager from "@/components/dealer/VehicleCostsManager";
import StaffManager from "@/components/dealer/StaffManager";
import ReservationsManager from "@/components/dealer/ReservationsManager";
import BookingsManager from "@/components/dealer/BookingsManager";
import AdShopEditor from "@/components/dealer/AdShopEditor";
import DmsConnectionsManager from "@/components/dealer/DmsConnectionsManager";
import DealerLeadInbox from "@/components/dealer/DealerLeadInbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DealerInfo {
  id: string;
  business_name: string;
  tier: string;
  subscription_status: string;
  max_listings: number;
  slug: string;
  kyc_verified: boolean;
}

interface ListingSummary {
  total: number;
  active: number;
  draft: number;
  sold: number;
  totalViews: number;
  totalEnquiries: number;
}

const DealerDashboard = () => {
  const { t } = useTranslation();
  const { user, subscription, refreshSubscription } = useAuth();
  const { config } = useCountry();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dealer, setDealer] = useState<DealerInfo | null>(null);
  const [summary, setSummary] = useState<ListingSummary>({
    total: 0, active: 0, draft: 0, sold: 0, totalViews: 0, totalEnquiries: 0,
  });
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Handle checkout success
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast({ title: t("dealerDashboard.toasts.subActivated"), description: t("dealerDashboard.toasts.subActivatedDesc") });
      refreshSubscription();
    }
  }, [refreshSubscription, searchParams, t, toast]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: dealerData } = await supabase
        .from("dealers").select("*").eq("user_id", user.id).maybeSingle();

      if (dealerData) {
        setDealer(dealerData as any);
        const { data: listingsData } = await supabase
          .from("car_listings").select("*").eq("dealer_id", dealerData.id).order("created_at", { ascending: false });

        if (listingsData) {
          setListings(listingsData);
          setSummary({
            total: listingsData.length,
            active: listingsData.filter((l) => l.status === "active").length,
            draft: listingsData.filter((l) => l.status === "draft").length,
            sold: listingsData.filter((l) => l.status === "sold").length,
            totalViews: listingsData.reduce((acc, l) => acc + (l.views_count || 0), 0),
            totalEnquiries: listingsData.reduce((acc, l) => acc + (l.enquiries_count || 0), 0),
          });
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.error === "NO_SUBSCRIPTION") {
        toast({
          title: t("dealerDashboard.toasts.noSub"),
          description: data.message || t("dealerDashboard.toasts.noSubDesc"),
        });
        return;
      }
      if (data?.url) redirectToStripe(data.url);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const deleteListing = async (listingId: string) => {
    const { error } = await supabase.from("car_listings").delete().eq("id", listingId);
    if (error) {
      toast({ title: t("dealerDashboard.toasts.deleteError"), variant: "destructive" });
    } else {
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      toast({ title: t("dealerDashboard.toasts.deleted") });
    }
  };

  const toggleStatus = async (listingId: string, currentStatus: string) => {
    // Block toggling under_review or expired listings
    if (currentStatus === "under_review") {
      toast({ title: t("dealerDashboard.toasts.underReview"), description: t("dealerDashboard.toasts.underReviewDesc"), variant: "destructive" });
      return;
    }
    if (currentStatus === "expired") {
      toast({ title: t("dealerDashboard.toasts.expired"), description: t("dealerDashboard.toasts.expiredDesc"), variant: "destructive" });
      return;
    }
    const newStatus = currentStatus === "active" ? "draft" : "active";
    // Check listing limits
    if (newStatus === "active" && dealer && summary.active >= dealer.max_listings) {
      toast({ title: t("dealerDashboard.toasts.limitReached"), description: t("dealerDashboard.toasts.limitReachedDesc"), variant: "destructive" });
      return;
    }
    // When activating, check logbook exists
    const listing = listings.find(l => l.id === listingId);
    if (newStatus === "active" && listing && !listing.logbook_url) {
      toast({ title: t("dealerDashboard.toasts.logbookRequired"), description: t("dealerDashboard.toasts.logbookRequiredDesc"), variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("car_listings").update({ status: newStatus }).eq("id", listingId);
    if (!error) {
      setListings((prev) => prev.map((l) => l.id === listingId ? { ...l, status: newStatus } : l));
      setSummary((prev) => ({
        ...prev,
        active: prev.active + (newStatus === "active" ? 1 : -1),
        draft: prev.draft + (newStatus === "draft" ? 1 : -1),
      }));
      toast({ title: t("dealerDashboard.toasts.listingStatus", { status: newStatus }) });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === listings.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(listings.map(l => l.id)));
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("car_listings").update({ status: newStatus } as any).in("id", ids);
    if (!error) {
      setListings(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: newStatus } : l));
      setSelectedIds(new Set());
      toast({ title: t("dealerDashboard.toasts.bulkUpdated", { count: ids.length, status: newStatus }) });
    } else {
      toast({ title: t("dealerDashboard.toasts.bulkFailed"), variant: "destructive" });
    }
  };

  const exportCSV = () => {
    const headers = ["Title","Make","Model","Year","Price","Mileage","Status","Views","Enquiries","Created"];
    const rows = listings.map(l => [
      `"${(l.title||'').replace(/"/g,'""')}"`, l.make, l.model, l.year, l.price, l.mileage||"",
      l.status, l.views_count||0, l.enquiries_count||0, new Date(l.created_at).toLocaleDateString(),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `listings-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: t("dealerDashboard.toasts.csvExported") });
  };

  const tierColors: Record<string, string> = {
    starter: "bg-secondary text-secondary-foreground",
    professional: "bg-primary/10 text-primary",
    enterprise: "bg-accent text-accent-foreground",
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
          <Package className="h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl font-bold text-foreground">{t("dealerDashboard.noDealer.title")}</h2>
          <p className="mt-2 text-muted-foreground">{t("dealerDashboard.noDealer.desc")}</p>
          <Link to="/dealers"><Button className="gradient-primary mt-6 border-0">{t("dealerDashboard.noDealer.cta")}</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const listingLimitPercent = dealer.max_listings === 9999 ? 0 : Math.round((summary.active / dealer.max_listings) * 100);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{dealer.business_name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge className={tierColors[dealer.tier] || ""}>{dealer.tier.charAt(0).toUpperCase() + dealer.tier.slice(1)}</Badge>
              <Badge variant={dealer.subscription_status === "active" ? "default" : "destructive"}>{dealer.subscription_status}</Badge>
              {dealer.kyc_verified && <Badge variant="outline" className="border-success text-success">{t("dealerDashboard.kycVerified")}</Badge>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
              <CreditCard className="mr-1 h-4 w-4" />
              {portalLoading ? t("common.loading") : t("dealerDashboard.manageSubscription")}
            </Button>
            <DealerPageBuilder
              dealerId={dealer.id}
              currentConfig={(dealer as any).landing_page_config || {}}
              businessName={dealer.business_name}
              onSaved={() => {}}
            />
            <Link to={`/dealer/${dealer.slug}`}><Button variant="outline" size="sm"><ExternalLink className="mr-1 h-4 w-4" /> {t("dealerDashboard.landingPage")}</Button></Link>
            <Link to="/dashboard/listings/new">
              <Button size="sm" className="gradient-primary border-0" disabled={summary.active >= dealer.max_listings && dealer.max_listings !== 9999}>
                <Plus className="mr-1 h-4 w-4" /> {t("dealerDashboard.addListing")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Listing Limit Bar */}
        {dealer.max_listings !== 9999 && (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("dealerDashboard.activeListings")}</span>
              <span className="font-medium text-card-foreground">{summary.active} / {dealer.max_listings}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${listingLimitPercent >= 90 ? "bg-destructive" : listingLimitPercent >= 70 ? "bg-warning" : "bg-primary"}`}
                style={{ width: `${Math.min(listingLimitPercent, 100)}%` }}
              />
            </div>
            {listingLimitPercent >= 90 && (
              <p className="mt-2 text-xs text-destructive">
                {t("dealerDashboard.nearLimit")} <Link to="/dealers" className="underline">{t("dealerDashboard.upgradePlan")}</Link> {t("dealerDashboard.forMore")}
              </p>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("dealerDashboard.activeListings"), value: summary.active, icon: Car, color: "text-primary" },
            { label: t("dealerDashboard.totalViews"), value: summary.totalViews, icon: Eye, color: "text-info" },
            { label: t("dealerDashboard.enquiries"), value: summary.totalEnquiries, icon: MessageSquare, color: "text-success" },
            { label: t("dealerDashboard.sold"), value: summary.sold, icon: TrendingUp, color: "text-warning" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-display text-2xl font-bold text-card-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* DMS Tools */}
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">{t("dealerDashboard.managementTools")}</h2>
          <Tabs value={searchParams.get("tab") || "stock-book"} onValueChange={(tab) => setSearchParams(tab === "stock-book" ? {} : { tab }, { replace: true })}>
            <TabsList className="flex w-full flex-wrap justify-start gap-1 h-auto">
              <TabsTrigger value="stock-book">{t("dealerDashboard.tabs.stockBook")}</TabsTrigger>
              <TabsTrigger value="leads">{t("productionV2.leads.tab")}</TabsTrigger>
              <TabsTrigger value="costs">{t("dealerDashboard.tabs.costs")}</TabsTrigger>
              <TabsTrigger value="reservations">{t("dealerDashboard.tabs.reservations")}</TabsTrigger>
              <TabsTrigger value="bookings">{t("dealerDashboard.tabs.bookings")}</TabsTrigger>
              <TabsTrigger value="staff">{t("dealerDashboard.tabs.staff")}</TabsTrigger>
              <TabsTrigger value="ad-shop">{t("dealerDashboard.tabs.adShop")}</TabsTrigger>
              <TabsTrigger value="pipeline">{t("dealerDashboard.tabs.pipeline")}</TabsTrigger>
              <TabsTrigger value="integrations">{t("dealerDashboard.tabs.integrations")}</TabsTrigger>
              <TabsTrigger value="analytics">{t("dealerDashboard.tabs.analytics")}</TabsTrigger>
            </TabsList>
            <TabsContent value="stock-book" className="mt-4"><StockBookManager dealerId={dealer.id} /></TabsContent>
            <TabsContent value="leads" className="mt-4"><DealerLeadInbox dealerId={dealer.id} /></TabsContent>
            <TabsContent value="costs" className="mt-4"><VehicleCostsManager dealerId={dealer.id} /></TabsContent>
            <TabsContent value="reservations" className="mt-4"><ReservationsManager dealerId={dealer.id} /></TabsContent>
            <TabsContent value="bookings" className="mt-4"><BookingsManager dealerId={dealer.id} /></TabsContent>
            <TabsContent value="staff" className="mt-4"><StaffManager dealerId={dealer.id} /></TabsContent>
            <TabsContent value="ad-shop" className="mt-4">
              <AdShopEditor dealerId={dealer.id} logoUrl={(dealer as any).logo_url} businessName={dealer.business_name} />
            </TabsContent>
            <TabsContent value="pipeline" className="mt-4"><SalesPipeline mode="dealer" dealerId={dealer.id} /></TabsContent>
            <TabsContent value="integrations" className="mt-4"><DmsConnectionsManager dealerId={dealer.id} /></TabsContent>
            <TabsContent value="analytics" className="mt-4"><SellerAnalytics /></TabsContent>
          </Tabs>
        </div>

        {/* Recent Listings */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">{t("dealerDashboard.yourListings")}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={listings.length === 0}>
                <Download className="mr-1 h-4 w-4" /> {t("dealerDashboard.exportCsv")}
              </Button>
              <Link to="/inbox"><Button variant="ghost" size="sm">{t("dealerDashboard.viewEnquiries")}</Button></Link>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <span className="text-sm font-medium text-foreground">{t("dealerDashboard.selected", { count: selectedIds.size })}</span>
              <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus("active")}>{t("dealerDashboard.setActive")}</Button>
              <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus("draft")}>{t("dealerDashboard.setDraft")}</Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => setSelectedIds(new Set())}>{t("common.close")}</Button>
            </div>
          )}

          {listings.length === 0 ? (
            <Card className="mt-4">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Car className="h-12 w-12 text-muted-foreground" />
                <p className="mt-3 text-muted-foreground">{t("dealerDashboard.noListings")}</p>
                <Link to="/dashboard/listings/new"><Button className="gradient-primary mt-4 border-0" size="sm"><Plus className="mr-1 h-4 w-4" /> {t("dealerDashboard.addFirstListing")}</Button></Link>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Checkbox
                  checked={selectedIds.size === listings.length && listings.length > 0}
                  onCheckedChange={selectAll}
                />
                <span className="text-xs text-muted-foreground">{t("dealerDashboard.selectAll")}</span>
              </div>
              {listings.map((listing) => (
                <Card key={listing.id} className={selectedIds.has(listing.id) ? "border-primary/40" : ""}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedIds.has(listing.id)}
                        onCheckedChange={() => toggleSelect(listing.id)}
                      />
                      {listing.images?.[0] ? (
                        <img src={listing.images[0]} alt="" className="h-12 w-16 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-muted">
                          <Car className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <Link to={`/car/${listing.id}`} className="font-medium text-card-foreground hover:text-primary">{listing.title}</Link>
                        <p className="text-sm text-muted-foreground">{t("dealerDashboard.viewsEnquiries", { views: listing.views_count || 0, enquiries: listing.enquiries_count || 0 })}</p>
                      </div>
                      <Badge variant={listing.status === "active" ? "default" : "secondary"}>{listing.status}</Badge>
                      <span className="font-display font-semibold text-card-foreground">{formatPrice(Number(listing.price), config)}</span>
                      {listing.status === "active" && (
                        <BoostListingDialog listingId={listing.id} listingTitle={listing.title} isPromoted={listing.is_promoted} />
                      )}
                      <Link to={`/dashboard/listings/edit?edit=${listing.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStatus(listing.id, listing.status)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("dealerDashboard.deleteTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>{t("dealerDashboard.deleteDesc", { title: listing.title })}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteListing(listing.id)} className="bg-destructive text-destructive-foreground">{t("common.delete", "Delete")}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DealerDashboard;
