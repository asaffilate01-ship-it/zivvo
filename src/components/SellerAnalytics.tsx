import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, TrendingUp, MessageSquare, BarChart3, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardChart from "@/components/DashboardChart";

interface AnalyticsData {
  totalViews: number;
  viewsToday: number;
  viewsThisWeek: number;
  dailyViews: { label: string; value: number }[];
  topListings: { title: string; views: number; enquiries: number }[];
  conversionRate: number;
}

const SellerAnalytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      // Get all user listings
      const { data: listings } = await supabase
        .from("car_listings")
        .select("id, title, views_count, enquiries_count")
        .eq("seller_id", user.id);

      if (!listings) {
        setLoading(false);
        return;
      }

      const listingIds = listings.map((l) => l.id);
      const totalViews = listings.reduce((s, l) => s + (l.views_count || 0), 0);
      const totalEnquiries = listings.reduce((s, l) => s + (l.enquiries_count || 0), 0);

      // Get view records for time-based analytics
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);

      let viewsToday = 0;
      let viewsThisWeek = 0;
      const dailyMap: Record<string, number> = {};

      if (listingIds.length > 0) {
        const { data: views } = await supabase
          .from("listing_views")
          .select("created_at")
          .in("listing_id", listingIds)
          .gte("created_at", weekAgo.toISOString())
          .order("created_at", { ascending: true });

        if (views) {
          const todayStr = now.toISOString().split("T")[0];
          views.forEach((v) => {
            const dayStr = v.created_at.split("T")[0];
            dailyMap[dayStr] = (dailyMap[dayStr] || 0) + 1;
            if (dayStr === todayStr) viewsToday++;
            viewsThisWeek++;
          });
        }
      }

      // Build daily chart data for last 7 days
      const dailyViews = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toISOString().split("T")[0];
        return {
          label: d.toLocaleDateString("en-US", { weekday: "short" }),
          value: dailyMap[key] || 0,
        };
      });

      // Top listings by views
      const topListings = [...listings]
        .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
        .slice(0, 5)
        .map((l) => ({
          title: l.title,
          views: l.views_count || 0,
          enquiries: l.enquiries_count || 0,
        }));

      const conversionRate = totalViews > 0 ? (totalEnquiries / totalViews) * 100 : 0;

      setData({
        totalViews,
        viewsToday,
        viewsThisWeek,
        dailyViews,
        topListings,
        conversionRate,
      });
      setLoading(false);
    };

    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Views", value: data.totalViews, icon: Eye, color: "text-primary" },
          { label: "Views Today", value: data.viewsToday, icon: TrendingUp, color: "text-accent" },
          { label: "This Week", value: data.viewsThisWeek, icon: BarChart3, color: "text-info" },
          { label: "Conversion Rate", value: `${data.conversionRate.toFixed(1)}%`, icon: MessageSquare, color: "text-success" },
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

      {/* Views Chart */}
      <DashboardChart title="Views (Last 7 Days)" data={data.dailyViews} type="area" color="hsl(210, 100%, 52%)" />

      {/* Top Listings */}
      {data.topListings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Performing Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topListings.map((listing, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-card-foreground">{listing.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {listing.views} views · {listing.enquiries} enquiries
                    </p>
                  </div>
                  <div className="ml-3 text-right">
                    <p className="text-sm font-semibold text-primary">
                      {listing.views > 0 ? ((listing.enquiries / listing.views) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">conversion</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellerAnalytics;
