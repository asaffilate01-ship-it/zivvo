import { useEffect, useState, useMemo } from "react";
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
import DashboardChart from "@/components/DashboardChart";
import DealerPageBuilder from "@/components/DealerPageBuilder";
import SellerAnalytics from "@/components/SellerAnalytics";
import SalesPipeline from "@/components/SalesPipeline";
import PortalSyndication from "@/components/PortalSyndication";
import ListingSyndicationStatus from "@/components/ListingSyndicationStatus";
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
  const { user, subscription, refreshSubscription } = useAuth();
  const { config } = useCountry();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
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
      toast({ title: "Subscription activated!", description: "Welcome to AutoSouq Dealer!" });
      refreshSubscription();
    }
  }, [searchParams]);

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
          title: "No subscription found",
          description: data.message || "Please subscribe to a plan first to manage your subscription.",
        });
        return;
      }
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const deleteListing = async (listingId: string) => {
    const { error } = await supabase.from("car_listings").delete().eq("id", listingId);
    if (error) {
      toast({ title: "Error deleting listing", variant: "destructive" });
    } else {
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      toast({ title: "Listing deleted" });
    }
  };

  const toggleStatus = async (listingId: string, currentStatus: string) => {
    // Block toggling under_review or expired listings
    if (currentStatus === "under_review") {
      toast({ title: "Under Review", description: "This listing is pending admin approval and cannot be changed.", variant: "destructive" });
      return;
    }
    if (currentStatus === "expired") {
      toast({ title: "Listing Expired", description: "Re-submit this listing for review to reactivate it.", variant: "destructive" });
      return;
    }
    const newStatus = currentStatus === "active" ? "draft" : "active";
    // Check listing limits
    if (newStatus === "active" && dealer && summary.active >= dealer.max_listings) {
      toast({ title: "Listing limit reached", description: "Upgrade your plan to add more active listings.", variant: "destructive" });
      return;
    }
    // When activating, check logbook exists
    const listing = listings.find(l => l.id === listingId);
    if (newStatus === "active" && listing && !listing.logbook_url) {
      toast({ title: "Logbook Required", description: "Upload your V5C logbook before activating this listing.", variant: "destructive" });
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
      toast({ title: `Listing ${newStatus}` });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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
      toast({ title: `${ids.length} listings updated to ${newStatus}` });
    } else {
      toast({ title: "Bulk update failed", variant: "destructive" });
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
    toast({ title: "CSV exported" });
  };

  const viewsChartData = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { label: d.toLocaleDateString("en-US", { weekday: "short" }), value: 0 };
    });
    const perDay = Math.round(summary.totalViews / 7);
    return last7.map((d) => ({ ...d, value: Math.max(0, perDay + Math.round(Math.random() * perDay * 0.4)) }));
  }, [summary.totalViews]);

  const enquiriesChartData = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { label: d.toLocaleDateString("en-US", { weekday: "short" }), value: 0 };
    });
    const perDay = Math.round(summary.totalEnquiries / 7);
    return last7.map((d) => ({ ...d, value: Math.max(0, perDay + Math.round(Math.random() * 3 - 1)) }));
  }, [summary.totalEnquiries]);

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
          <h2 className="mt-4 font-display text-2xl font-bold text-foreground">No Dealer Account Found</h2>
          <p className="mt-2 text-muted-foreground">Subscribe to a dealer plan to access your dashboard.</p>
          <Link to="/dealers"><Button className="gradient-primary mt-6 border-0">View Dealer Plans</Button></Link>
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
              {dealer.kyc_verified && <Badge variant="outline" className="border-success text-success">KYC Verified</Badge>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
              <CreditCard className="mr-1 h-4 w-4" />
              {portalLoading ? "Loading..." : "Manage Subscription"}
            </Button>
            <DealerPageBuilder
              dealerId={dealer.id}
              currentConfig={(dealer as any).landing_page_config || {}}
              businessName={dealer.business_name}
              onSaved={() => {}}
            />
            <Link to={`/dealer/${dealer.slug}`}><Button variant="outline" size="sm"><ExternalLink className="mr-1 h-4 w-4" /> Landing Page</Button></Link>
            <Link to="/dashboard/listings/new">
              <Button size="sm" className="gradient-primary border-0" disabled={summary.active >= dealer.max_listings && dealer.max_listings !== 9999}>
                <Plus className="mr-1 h-4 w-4" /> Add Listing
              </Button>
            </Link>
          </div>
        </div>

        {/* Listing Limit Bar */}
        {dealer.max_listings !== 9999 && (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active Listings</span>
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
                You're near your listing limit. <Link to="/dealers" className="underline">Upgrade your plan</Link> for more.
              </p>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active Listings", value: summary.active, icon: Car, color: "text-primary" },
            { label: "Total Views", value: summary.totalViews, icon: Eye, color: "text-info" },
            { label: "Enquiries", value: summary.totalEnquiries, icon: MessageSquare, color: "text-success" },
            { label: "Sold", value: summary.sold, icon: TrendingUp, color: "text-warning" },
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

        {/* Sales Pipeline */}
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Sales Pipeline</h2>
          <SalesPipeline mode="dealer" dealerId={dealer.id} />
        </div>

        {/* Portal Syndication */}
        <div className="mt-8">
          <PortalSyndication dealerId={dealer.id} />
        </div>

        {/* Analytics Section */}
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Analytics & Insights</h2>
          <SellerAnalytics />
        </div>

        {/* Recent Listings */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Your Listings</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={listings.length === 0}>
                <Download className="mr-1 h-4 w-4" /> Export CSV
              </Button>
              <Link to="/inbox"><Button variant="ghost" size="sm">View Enquiries</Button></Link>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus("active")}>Set Active</Button>
              <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus("draft")}>Set Draft</Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => setSelectedIds(new Set())}>Clear</Button>
            </div>
          )}

          {listings.length === 0 ? (
            <Card className="mt-4">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Car className="h-12 w-12 text-muted-foreground" />
                <p className="mt-3 text-muted-foreground">No listings yet</p>
                <Link to="/dashboard/listings/new"><Button className="gradient-primary mt-4 border-0" size="sm"><Plus className="mr-1 h-4 w-4" /> Add Your First Listing</Button></Link>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Checkbox
                  checked={selectedIds.size === listings.length && listings.length > 0}
                  onCheckedChange={selectAll}
                />
                <span className="text-xs text-muted-foreground">Select all</span>
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
                        <p className="text-sm text-muted-foreground">{listing.views_count || 0} views · {listing.enquiries_count || 0} enquiries</p>
                      </div>
                      {listing.status === "active" && dealer && (
                        <ListingSyndicationStatus listingId={listing.id} dealerId={dealer.id} />
                      )}
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
                            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone. This will permanently delete "{listing.title}".</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteListing(listing.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
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
