import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, Activity } from "lucide-react";

interface IntegrationRow {
  id: string;
  dealer_id: string;
  provider: string;
  is_enabled: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  vehicles_imported: number;
  sync_pull: boolean;
  sync_push: boolean;
  dealer?: { business_name?: string | null; slug?: string | null } | null;
}

const AdminDmsHealthPanel = () => {
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [intRes, logRes] = await Promise.all([
      supabase
        .from("dealer_integrations")
        .select("*, dealer:dealers(business_name, slug)")
        .order("last_sync_at", { ascending: false, nullsFirst: false }),
      supabase
        .from("dms_sync_logs")
        .select("*, dealer:dealers(business_name)")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setRows((intRes.data as any) || []);
    setLogs(logRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const totals = {
    integrations: rows.length,
    healthy: rows.filter((r) => r.last_sync_status === "success").length,
    failing: rows.filter((r) => r.last_sync_status === "error" || r.last_sync_status === "partial").length,
    vehicles: rows.reduce((s, r) => s + (r.vehicles_imported || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Connected dealers", value: totals.integrations, icon: Activity, color: "text-primary" },
          { label: "Healthy", value: totals.healthy, icon: CheckCircle2, color: "text-success" },
          { label: "Failing / partial", value: totals.failing, icon: AlertCircle, color: "text-destructive" },
          { label: "Vehicles synced", value: totals.vehicles, icon: RefreshCw, color: "text-info" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-dealer integration table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Dealer integrations</span>
            <Button size="sm" variant="outline" onClick={load}><RefreshCw className="mr-1.5 h-4 w-4" /> Refresh</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No DMS integrations configured yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3">Dealer</th>
                    <th className="py-2 pr-3">Provider</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Last sync</th>
                    <th className="py-2 pr-3">Vehicles</th>
                    <th className="py-2 pr-3">Mode</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60">
                      <td className="py-2 pr-3 font-medium">{r.dealer?.business_name || r.dealer_id.slice(0, 8)}</td>
                      <td className="py-2 pr-3 capitalize">{r.provider}</td>
                      <td className="py-2 pr-3">
                        {!r.is_enabled ? (
                          <Badge variant="secondary">Disabled</Badge>
                        ) : r.last_sync_status === "success" ? (
                          <Badge className="bg-success text-success-foreground">Healthy</Badge>
                        ) : r.last_sync_status === "partial" ? (
                          <Badge variant="secondary">Partial</Badge>
                        ) : r.last_sync_status === "error" ? (
                          <Badge variant="destructive">Error</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">
                        {r.last_sync_at ? new Date(r.last_sync_at).toLocaleString() : "—"}
                      </td>
                      <td className="py-2 pr-3">{r.vehicles_imported || 0}</td>
                      <td className="py-2 pr-3 text-xs">
                        {r.sync_pull && <Badge variant="outline" className="mr-1">Pull</Badge>}
                        {r.sync_push && <Badge variant="outline">Push</Badge>}
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">Manuell verwaltet</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {rows.some((r) => r.last_sync_error) && (
            <div className="mt-3 space-y-1 text-xs">
              {rows.filter((r) => r.last_sync_error).map((r) => (
                <p key={r.id} className="text-destructive">
                  <span className="font-medium">{r.dealer?.business_name}:</span> {r.last_sync_error}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent log stream */}
      <Card>
        <CardHeader><CardTitle>Recent sync events</CardTitle></CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No sync events recorded.</p>
          ) : (
            <div className="space-y-1 text-xs">
              {logs.map((l) => (
                <div key={l.id} className="flex flex-wrap items-center gap-2 rounded border border-border px-2 py-1.5">
                  <Badge
                    variant={l.status === "success" ? "default" : l.status === "partial" ? "secondary" : "destructive"}
                  >
                    {l.status}
                  </Badge>
                  <span className="font-medium">{l.dealer?.business_name || l.dealer_id.slice(0, 8)}</span>
                  <span className="capitalize text-muted-foreground">{l.provider} · {l.direction}</span>
                  <span>{l.items_created}+/{l.items_updated}~/{l.items_failed}✗</span>
                  <span className="ml-auto text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDmsHealthPanel;
