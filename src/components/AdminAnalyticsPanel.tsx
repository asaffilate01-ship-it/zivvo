import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, MousePointerClick, Smartphone, Globe } from "lucide-react";
import DashboardChart from "@/components/DashboardChart";

const AdminAnalyticsPanel = () => {
  const [loading, setLoading] = useState(true);
  const [pageViews, setPageViews] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [pv, ev] = await Promise.all([
        (supabase.from("page_views") as any).select("path, device, utm_source, session_id, created_at").gte("created_at", since).limit(5000),
        (supabase.from("analytics_events") as any).select("event_name, path, created_at").gte("created_at", since).limit(5000),
      ]);
      setPageViews(pv.data || []);
      setEvents(ev.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const sessions = new Set(pageViews.map((p) => p.session_id).filter(Boolean));
    const devices: Record<string, number> = {};
    const sources: Record<string, number> = {};
    const paths: Record<string, number> = {};
    pageViews.forEach((p) => {
      devices[p.device || "unknown"] = (devices[p.device || "unknown"] || 0) + 1;
      const src = p.utm_source || "direct";
      sources[src] = (sources[src] || 0) + 1;
      paths[p.path] = (paths[p.path] || 0) + 1;
    });
    const eventCounts: Record<string, number> = {};
    events.forEach((e) => {
      eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1;
    });
    return {
      totalViews: pageViews.length,
      uniqueSessions: sessions.size,
      totalEvents: events.length,
      devices: Object.entries(devices).map(([label, value]) => ({ label, value })),
      sources: Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value })),
      topPaths: Object.entries(paths).sort((a, b) => b[1] - a[1]).slice(0, 10),
      eventCounts: Object.entries(eventCounts).sort((a, b) => b[1] - a[1]),
    };
  }, [pageViews, events]);

  // Daily trend (last 14 days)
  const dailyViews = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = 0;
    }
    pageViews.forEach((p) => {
      const k = (p.created_at || "").slice(0, 10);
      if (k in buckets) buckets[k]++;
    });
    return Object.entries(buckets).map(([k, v]) => ({
      label: new Date(k).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      value: v,
    }));
  }, [pageViews]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Page Views (30d)", value: stats.totalViews, icon: Eye },
          { label: "Unique Sessions", value: stats.uniqueSessions, icon: Globe },
          { label: "Conversion Events", value: stats.totalEvents, icon: MousePointerClick },
          { label: "Mobile Share", value: `${Math.round(((stats.devices.find((d) => d.label === "mobile")?.value || 0) / Math.max(stats.totalViews, 1)) * 100)}%`, icon: Smartphone },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display text-xl font-bold text-card-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardChart title="Daily Page Views (14 days)" data={dailyViews} type="area" color="hsl(265, 75%, 58%)" />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Top Pages</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {stats.topPaths.length === 0 && <p className="text-muted-foreground">No page views yet.</p>}
              {stats.topPaths.map(([path, count]) => (
                <div key={path} className="flex items-center justify-between gap-2">
                  <span className="truncate text-card-foreground">{path}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Traffic Sources</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {stats.sources.length === 0 && <p className="text-muted-foreground">No traffic data yet.</p>}
              {stats.sources.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="capitalize text-card-foreground">{s.label}</span>
                  <Badge variant="secondary">{s.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Conversion Events</CardTitle></CardHeader>
        <CardContent>
          {stats.eventCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No consented conversion events have been captured in this period.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {stats.eventCounts.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span className="font-medium text-card-foreground">{name}</span>
                  <Badge>{count}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsPanel;
