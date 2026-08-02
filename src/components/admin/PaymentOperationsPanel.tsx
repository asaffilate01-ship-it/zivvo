import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, CreditCard, RefreshCw, ShieldAlert, Webhook } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Incident {
  id: string;
  incident_type: string;
  provider_object_id: string | null;
  status: "open" | "investigating" | "resolved" | "ignored";
  summary: string;
  amount_cents: number | null;
  currency: string | null;
  created_at: string;
}

interface Dispute {
  stripe_dispute_id: string;
  status: string;
  reason: string | null;
  amount_cents: number;
  currency: string;
  evidence_due_at: string | null;
  updated_at: string;
}

interface WebhookEvent {
  event_id: string;
  event_type: string;
  status: string;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

const PaymentOperationsPanel = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const locale = i18n.language.startsWith("de") ? "de-DE" : "en-GB";

  const load = useCallback(async () => {
    setLoading(true);
    const [incidentResult, disputeResult, webhookResult] = await Promise.all([
      (supabase.from as any)("payment_incidents").select("*").order("created_at", { ascending: false }).limit(200),
      (supabase.from as any)("payment_disputes").select("*").order("updated_at", { ascending: false }).limit(100),
      (supabase.from as any)("stripe_webhook_events").select("event_id,event_type,status,error_message,created_at,processed_at").order("created_at", { ascending: false }).limit(200),
    ]);
    if (incidentResult.error || disputeResult.error || webhookResult.error) {
      toast({ title: t("common.error"), description: incidentResult.error?.message || disputeResult.error?.message || webhookResult.error?.message, variant: "destructive" });
    }
    setIncidents((incidentResult.data || []) as Incident[]);
    setDisputes((disputeResult.data || []) as Dispute[]);
    setWebhooks((webhookResult.data || []) as WebhookEvent[]);
    setLoading(false);
  }, [t, toast]);

  useEffect(() => { void load(); }, [load]);

  const updateIncident = async (id: string, status: "investigating" | "resolved" | "ignored") => {
    setUpdating(id);
    const { error } = await (supabase.rpc as any)("resolve_payment_incident", { p_incident_id: id, p_status: status });
    setUpdating(null);
    if (error) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
      return;
    }
    await load();
  };

  const stats = useMemo(() => ({
    open: incidents.filter((item) => item.status === "open" || item.status === "investigating").length,
    disputes: disputes.filter((item) => !["won", "lost", "warning_closed"].includes(item.status)).length,
    failedWebhooks: webhooks.filter((item) => item.status === "failed").length,
  }), [disputes, incidents, webhooks]);

  const money = (cents: number | null, currency: string | null) => cents == null
    ? "—"
    : new Intl.NumberFormat(locale, { style: "currency", currency: (currency || "EUR").toUpperCase() }).format(cents / 100);

  if (loading) return <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-xl font-bold">{t("productionV2.payments.title")}</h2><p className="text-sm text-muted-foreground">{t("productionV2.payments.subtitle")}</p></div>
        <Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />{t("productionV2.payments.refresh")}</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-4"><AlertTriangle className="h-5 w-5 text-warning" /><div><p className="text-xs text-muted-foreground">{t("productionV2.payments.openIncidents")}</p><p className="text-2xl font-bold">{stats.open}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><ShieldAlert className="h-5 w-5 text-destructive" /><div><p className="text-xs text-muted-foreground">{t("productionV2.payments.activeDisputes")}</p><p className="text-2xl font-bold">{stats.disputes}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Webhook className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">{t("productionV2.payments.failedWebhooks")}</p><p className="text-2xl font-bold">{stats.failedWebhooks}</p></div></CardContent></Card>
      </div>
      <Tabs defaultValue="incidents">
        <TabsList><TabsTrigger value="incidents">{t("productionV2.payments.incidents")}</TabsTrigger><TabsTrigger value="disputes">{t("productionV2.payments.disputes")}</TabsTrigger><TabsTrigger value="webhooks">Webhooks</TabsTrigger></TabsList>
        <TabsContent value="incidents">
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4" />{t("productionV2.payments.incidents")}</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t("productionV2.payments.type")}</TableHead><TableHead>{t("productionV2.payments.summary")}</TableHead><TableHead>{t("productionV2.payments.amount")}</TableHead><TableHead>{t("productionV2.payments.status")}</TableHead><TableHead>{t("productionV2.payments.created")}</TableHead><TableHead>{t("productionV2.payments.action")}</TableHead></TableRow></TableHeader><TableBody>
            {incidents.map((incident) => <TableRow key={incident.id}><TableCell className="font-medium">{incident.incident_type}</TableCell><TableCell className="max-w-sm whitespace-normal">{incident.summary}<p className="font-mono text-[10px] text-muted-foreground">{incident.provider_object_id}</p></TableCell><TableCell>{money(incident.amount_cents, incident.currency)}</TableCell><TableCell><Badge variant={incident.status === "open" ? "destructive" : incident.status === "resolved" ? "outline" : "secondary"}>{incident.status}</Badge></TableCell><TableCell>{new Date(incident.created_at).toLocaleString(locale)}</TableCell><TableCell><div className="flex gap-1">{incident.status === "open" && <Button size="sm" variant="outline" disabled={updating === incident.id} onClick={() => void updateIncident(incident.id, "investigating")}>{t("productionV2.payments.investigate")}</Button>}{incident.status !== "resolved" && <Button size="sm" variant="outline" disabled={updating === incident.id} onClick={() => void updateIncident(incident.id, "resolved")}><CheckCircle2 className="mr-1 h-3 w-3" />{t("productionV2.payments.resolve")}</Button>}</div></TableCell></TableRow>)}
            {incidents.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">{t("productionV2.payments.noIncidents")}</TableCell></TableRow>}
          </TableBody></Table></CardContent></Card>
        </TabsContent>
        <TabsContent value="disputes"><Card><CardContent className="overflow-x-auto pt-6"><Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>{t("productionV2.payments.reason")}</TableHead><TableHead>{t("productionV2.payments.amount")}</TableHead><TableHead>{t("productionV2.payments.status")}</TableHead><TableHead>{t("productionV2.payments.evidenceDue")}</TableHead></TableRow></TableHeader><TableBody>{disputes.map((dispute) => <TableRow key={dispute.stripe_dispute_id}><TableCell className="font-mono text-xs">{dispute.stripe_dispute_id}</TableCell><TableCell>{dispute.reason || "—"}</TableCell><TableCell>{money(dispute.amount_cents, dispute.currency)}</TableCell><TableCell><Badge variant="destructive">{dispute.status}</Badge></TableCell><TableCell>{dispute.evidence_due_at ? new Date(dispute.evidence_due_at).toLocaleString(locale) : "—"}</TableCell></TableRow>)}{disputes.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">{t("productionV2.payments.noDisputes")}</TableCell></TableRow>}</TableBody></Table></CardContent></Card></TabsContent>
        <TabsContent value="webhooks"><Card><CardContent className="overflow-x-auto pt-6"><Table><TableHeader><TableRow><TableHead>{t("productionV2.payments.event")}</TableHead><TableHead>{t("productionV2.payments.status")}</TableHead><TableHead>{t("productionV2.payments.created")}</TableHead><TableHead>{t("productionV2.payments.error")}</TableHead></TableRow></TableHeader><TableBody>{webhooks.map((event) => <TableRow key={event.event_id}><TableCell><p className="font-medium">{event.event_type}</p><p className="font-mono text-[10px] text-muted-foreground">{event.event_id}</p></TableCell><TableCell><Badge variant={event.status === "failed" ? "destructive" : "outline"}>{event.status}</Badge></TableCell><TableCell>{new Date(event.created_at).toLocaleString(locale)}</TableCell><TableCell className="max-w-md whitespace-normal text-sm text-destructive">{event.error_message || "—"}</TableCell></TableRow>)}{webhooks.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">{t("productionV2.payments.noWebhooks")}</TableCell></TableRow>}</TableBody></Table></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentOperationsPanel;
