import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Car, Plus, Eye, MessageSquare, TrendingUp, Package,
  Settings, BarChart3, ExternalLink,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardChart from "@/components/DashboardChart";

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [dealer, setDealer] = useState<DealerInfo | null>(null);
  const [summary, setSummary] = useState<ListingSummary>({
    total: 0, active: 0, draft: 0, sold: 0, totalViews: 0, totalEnquiries: 0,
  });
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Generate chart data from listings
  const viewsChartData = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { label: d.toLocaleDateString("en-US", { weekday: "short" }), value: 0 };
    });
    // Distribute views evenly for demo; in production would use daily analytics table
    const perDay = Math.round(summary.totalViews / 7);
    return last7.map((d, i) => ({ ...d, value: perDay + Math.round(Math.random() * perDay * 0.4) }));
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{dealer.business_name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge className={tierColors[dealer.tier] || ""}>{dealer.tier.charAt(0).toUpperCase() + dealer.tier.slice(1)}</Badge>
              <Badge variant={dealer.subscription_status === "active" ? "default" : "destructive"}>{dealer.subscription_status}</Badge>
              {dealer.kyc_verified && <Badge variant="outline" className="border-success text-success">KYC Verified</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/dealer/${dealer.slug}`}><Button variant="outline" size="sm"><ExternalLink className="mr-1 h-4 w-4" /> View Landing Page</Button></Link>
            <Link to="/dashboard/listings/new"><Button size="sm" className="gradient-primary border-0"><Plus className="mr-1 h-4 w-4" /> Add Listing</Button></Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active Listings", value: summary.active, max: dealer.max_listings, icon: Car, color: "text-primary" },
            { label: "Total Views", value: summary.totalViews, icon: Eye, color: "text-info" },
            { label: "Enquiries", value: summary.totalEnquiries, icon: MessageSquare, color: "text-success" },
            { label: "Sold", value: summary.sold, icon: TrendingUp, color: "text-warning" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-muted`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-display text-2xl font-bold text-card-foreground">
                    {stat.value}
                    {stat.max && <span className="text-sm font-normal text-muted-foreground">/{stat.max === 9999 ? "∞" : stat.max}</span>}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <DashboardChart title="Views (Last 7 Days)" data={viewsChartData} type="area" color="hsl(210, 100%, 52%)" />
          <DashboardChart title="Enquiries (Last 7 Days)" data={enquiriesChartData} type="bar" color="hsl(152, 60%, 42%)" />
        </div>

        {/* Recent Listings */}
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold text-foreground">Recent Listings</h2>
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
              {listings.slice(0, 5).map((listing) => (
                <Card key={listing.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Car className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{listing.title}</p>
                        <p className="text-sm text-muted-foreground">{listing.make} {listing.model} · {listing.year}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={listing.status === "active" ? "default" : "secondary"}>{listing.status}</Badge>
                      <span className="font-display font-semibold text-card-foreground">${Number(listing.price).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealerDashboard;
