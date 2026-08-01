import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, KeyRound, Copy, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  dealerId: string;
}

const genKey = () => {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return "zvk_" + Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const sha256Hex = async (s: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const DmsConnectionsManager = ({ dealerId }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [vy, setVy] = useState<any>(null);
  const [vyApiKey, setVyApiKey] = useState("");
  const [vyEnabled, setVyEnabled] = useState(true);
  const [pull, setPull] = useState(true);
  const [push, setPush] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [ingestKeys, setIngestKeys] = useState<any[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const ingestUrl = `https://${projectId}.supabase.co/functions/v1/stock-ingest`;

  const load = async () => {
    setLoading(true);
    const [vyRes, logsRes, keysRes] = await Promise.all([
      supabase.from("dealer_integrations").select("*").eq("dealer_id", dealerId).eq("provider", "virtualyard").maybeSingle(),
      supabase.from("dms_sync_logs").select("*").eq("dealer_id", dealerId).order("created_at", { ascending: false }).limit(10),
      supabase.from("dealer_ingest_keys").select("*").eq("dealer_id", dealerId).order("created_at", { ascending: false }),
    ]);
    if (vyRes.data) {
      setVy(vyRes.data);
      setVyApiKey(vyRes.data.api_key || "");
      setVyEnabled(vyRes.data.is_enabled);
      setPull(vyRes.data.sync_pull);
      setPush(vyRes.data.sync_push);
    }
    setLogs(logsRes.data || []);
    setIngestKeys(keysRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [dealerId]);

  const saveVy = async () => {
    const payload = {
      dealer_id: dealerId,
      provider: "virtualyard",
      api_key: vyApiKey.trim(),
      is_enabled: vyEnabled,
      sync_pull: pull,
      sync_push: push,
    };
    const { error } = vy
      ? await supabase.from("dealer_integrations").update(payload).eq("id", vy.id)
      : await supabase.from("dealer_integrations").insert(payload);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "VirtualYard settings saved" });
    load();
  };

  const runSync = async () => {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("virtualyard-sync", { body: { dealer_id: dealerId } });
    setSyncing(false);
    if (error) return toast({ title: "Sync failed", description: error.message, variant: "destructive" });
    toast({
      title: "Sync complete",
      description: `${data.processed} processed · ${data.created} new · ${data.updated} updated · ${data.failed} failed`,
    });
    load();
  };

  const createIngestKey = async () => {
    const key = genKey();
    const hash = await sha256Hex(key);
    const { error } = await supabase.from("dealer_ingest_keys").insert({
      dealer_id: dealerId,
      key_hash: hash,
      key_prefix: key.slice(0, 12),
      label: "API key",
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setNewKey(key);
    load();
  };

  const revokeKey = async (id: string) => {
    await supabase.from("dealer_ingest_keys").update({ is_active: false, revoked_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  const copy = (s: string) => { navigator.clipboard.writeText(s); toast({ title: "Copied" }); };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* VirtualYard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>VirtualYard DMS</span>
            {vy?.last_sync_status && (
              <Badge variant={vy.last_sync_status === "success" ? "default" : "destructive"}>
                {vy.last_sync_status === "success" ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />}
                {vy.last_sync_status}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste your VirtualYard API key (from Virtual Yard → Shop → API). Stock will be pulled and enquiries will be pushed back automatically.
          </p>
          <div className="space-y-2">
            <Label>VirtualYard API key</Label>
            <Input value={vyApiKey} onChange={(e) => setVyApiKey(e.target.value)} placeholder="vy_..." />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
              <span className="text-sm">Enabled</span>
              <Switch checked={vyEnabled} onCheckedChange={setVyEnabled} />
            </label>
            <label className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
              <span className="text-sm">Pull stock</span>
              <Switch checked={pull} onCheckedChange={setPull} />
            </label>
            <label className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
              <span className="text-sm">Push leads</span>
              <Switch checked={push} onCheckedChange={setPush} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveVy}>Save settings</Button>
            <Button variant="outline" onClick={runSync} disabled={syncing || !vy?.api_key}>
              {syncing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
              Sync now
            </Button>
            {vy?.last_sync_at && (
              <span className="self-center text-xs text-muted-foreground">
                Last sync: {new Date(vy.last_sync_at).toLocaleString()} · {vy.vehicles_imported || 0} vehicles
              </span>
            )}
          </div>
          {vy?.last_sync_error && (
            <p className="text-xs text-destructive">{vy.last_sync_error}</p>
          )}
        </CardContent>
      </Card>

      {/* Inbound ingest key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Push stock TO Zivvo (any DMS)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-xs">
            <p className="font-semibold text-foreground">Endpoint</p>
            <code className="break-all">{ingestUrl}</code>
            <p className="mt-2 font-semibold text-foreground">Header</p>
            <code>X-Zivvo-Api-Key: &lt;your key&gt;</code>
            <p className="mt-2 text-muted-foreground">Accepts JSON, AutoTrader-style XML, or CSV. GET the URL for full docs.</p>
          </div>

          {newKey && (
            <div className="rounded-lg border border-success bg-success/10 p-3">
              <p className="text-xs font-semibold text-success">Copy this now — it won't be shown again</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 break-all text-xs">{newKey}</code>
                <Button size="sm" variant="outline" onClick={() => copy(newKey)}><Copy className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}

          <Button onClick={createIngestKey}><KeyRound className="mr-1.5 h-4 w-4" /> Generate new API key</Button>

          {ingestKeys.length > 0 && (
            <div className="space-y-1.5">
              {ingestKeys.map((k) => (
                <div key={k.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <code className="text-xs">{k.key_prefix}...</code>
                    {!k.is_active && <Badge variant="secondary" className="text-[10px]">Revoked</Badge>}
                    {k.last_used_at && <span className="text-xs text-muted-foreground">last used {new Date(k.last_used_at).toLocaleDateString()}</span>}
                  </div>
                  {k.is_active && (
                    <Button size="sm" variant="ghost" onClick={() => revokeKey(k.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync history */}
      {logs.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Sync history</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1 text-xs">
              {logs.map((l) => (
                <div key={l.id} className="flex flex-wrap items-center gap-2 rounded border border-border px-2 py-1.5">
                  <Badge variant={l.status === "success" ? "default" : l.status === "partial" ? "secondary" : "destructive"}>{l.status}</Badge>
                  <span className="font-medium">{l.provider}</span>
                  <span className="text-muted-foreground">{l.direction}</span>
                  <span>{l.items_created}+/{l.items_updated}~/{l.items_failed}✗</span>
                  <span className="ml-auto text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DmsConnectionsManager;
