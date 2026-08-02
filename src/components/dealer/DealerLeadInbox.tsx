import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, CalendarClock, Mail, MessageSquare, Phone, RefreshCw, Search, UserRound } from "lucide-react";

type LeadStatus = "new" | "contacted" | "qualified" | "appointment" | "offer" | "won" | "lost";
type LeadPriority = "low" | "normal" | "high";

interface DealerLead {
  id: string;
  dealer_id: string;
  listing_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  source: string;
  status: LeadStatus;
  priority: LeadPriority;
  assigned_to: string | null;
  next_action_at: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  user_id: string;
  full_name: string | null;
  email: string;
}

interface LeadEvent {
  id: string;
  event_type: string;
  from_value: string | null;
  to_value: string | null;
  note: string | null;
  created_at: string;
}

const statusOrder: LeadStatus[] = ["new", "contacted", "qualified", "appointment", "offer", "won", "lost"];

const DealerLeadInbox = ({ dealerId }: { dealerId: string }) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [leads, setLeads] = useState<DealerLead[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [selected, setSelected] = useState<DealerLead | null>(null);
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("open");
  const [note, setNote] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const locale = i18n.language.startsWith("de") ? "de-DE" : "en-GB";

  const load = useCallback(async () => {
    const [leadResult, teamResult] = await Promise.all([
      (supabase.from as any)("dealer_leads").select("*").eq("dealer_id", dealerId).order("created_at", { ascending: false }),
      supabase.from("dealer_staff").select("user_id,full_name,email").eq("dealer_id", dealerId).eq("is_active", true).not("user_id", "is", null),
    ]);
    if (leadResult.error) {
      toast({ title: t("common.error"), description: leadResult.error.message, variant: "destructive" });
    } else {
      setLeads((leadResult.data || []) as DealerLead[]);
    }
    setTeam(((teamResult.data || []).filter((member) => member.user_id) as TeamMember[]));
    setLoading(false);
  }, [dealerId, t, toast]);

  useEffect(() => {
    void load();
    const channel = supabase.channel(`dealer-leads:${dealerId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "dealer_leads", filter: `dealer_id=eq.${dealerId}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [dealerId, load]);

  const openLead = async (lead: DealerLead) => {
    setSelected(lead);
    setNextAction(lead.next_action_at ? new Date(lead.next_action_at).toISOString().slice(0, 16) : "");
    const { data } = await (supabase.from as any)("dealer_lead_events")
      .select("id,event_type,from_value,to_value,note,created_at")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false });
    setEvents((data || []) as LeadEvent[]);
  };

  const manage = async (updates: {
    status?: LeadStatus;
    priority?: LeadPriority;
    assignedTo?: string | null;
    nextActionAt?: string | null;
    note?: string;
  }) => {
    if (!selected) return;
    setSaving(true);
    const { error } = await (supabase.rpc as any)("manage_dealer_lead", {
      p_lead_id: selected.id,
      p_status: updates.status ?? null,
      p_priority: updates.priority ?? null,
      p_assigned_to: updates.assignedTo ?? null,
      p_clear_assignee: updates.assignedTo === null,
      p_next_action_at: updates.nextActionAt ? new Date(updates.nextActionAt).toISOString() : null,
      p_clear_next_action: updates.nextActionAt === null,
      p_note: updates.note?.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
      return;
    }
    setNote("");
    const nextSelected: DealerLead = {
      ...selected,
      status: updates.status ?? selected.status,
      priority: updates.priority ?? selected.priority,
      assigned_to: updates.assignedTo === undefined ? selected.assigned_to : updates.assignedTo,
      next_action_at: updates.nextActionAt === undefined ? selected.next_action_at : updates.nextActionAt,
      updated_at: new Date().toISOString(),
    };
    await load();
    await openLead(nextSelected);
    toast({ title: t("productionV2.leads.saved") });
  };

  const filtered = useMemo(() => leads.filter((lead) => {
    const text = `${lead.name} ${lead.email} ${lead.phone || ""} ${lead.message}`.toLowerCase();
    const matchesText = !search || text.includes(search.toLowerCase());
    const matchesStatus = filter === "all" || (filter === "open" ? !["won", "lost"].includes(lead.status) : lead.status === filter);
    return matchesText && matchesStatus;
  }), [filter, leads, search]);

  const counts = useMemo(() => ({
    open: leads.filter((lead) => !["won", "lost"].includes(lead.status)).length,
    due: leads.filter((lead) => lead.next_action_at && new Date(lead.next_action_at) <= new Date() && !["won", "lost"].includes(lead.status)).length,
    won: leads.filter((lead) => lead.status === "won").length,
  }), [leads]);

  const memberName = (userId: string | null) => team.find((member) => member.user_id === userId)?.full_name || team.find((member) => member.user_id === userId)?.email || t("productionV2.leads.unassigned");
  const statusLabel = (status: string) => t(`productionV2.leads.status.${status}`);

  if (loading) {
    return <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-primary" aria-label={t("common.loading")} /></div>;
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />{t("productionV2.leads.title")}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t("productionV2.leads.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />{t("productionV2.leads.refresh")}</Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{t("productionV2.leads.open")}</p><p className="text-2xl font-bold">{counts.open}</p></div>
          <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{t("productionV2.leads.due")}</p><p className="text-2xl font-bold text-warning">{counts.due}</p></div>
          <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{t("productionV2.leads.won")}</p><p className="text-2xl font-bold text-success">{counts.won}</p></div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("productionV2.leads.search")} /></div>
          <Select value={filter} onValueChange={setFilter}><SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="open">{t("productionV2.leads.open")}</SelectItem><SelectItem value="all">{t("productionV2.leads.all")}</SelectItem>
            {statusOrder.map((status) => <SelectItem value={status} key={status}>{statusLabel(status)}</SelectItem>)}
          </SelectContent></Select>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground"><MessageSquare className="mx-auto mb-3 h-10 w-10" /><p>{t("productionV2.leads.empty")}</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((lead) => {
              const overdue = lead.next_action_at && new Date(lead.next_action_at) <= new Date() && !["won", "lost"].includes(lead.status);
              return <button key={lead.id} type="button" onClick={() => void openLead(lead)} className="w-full rounded-xl border p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="font-semibold text-foreground">{lead.name}</p><p className="text-sm text-muted-foreground">{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</p></div>
                  <div className="flex items-center gap-2"><Badge variant={lead.priority === "high" ? "destructive" : "outline"}>{t(`productionV2.leads.priority.${lead.priority}`)}</Badge><Badge>{statusLabel(lead.status)}</Badge></div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-foreground">{lead.message}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span><UserRound className="mr-1 inline h-3 w-3" />{memberName(lead.assigned_to)}</span><span>{new Date(lead.created_at).toLocaleString(locale)}</span>{lead.next_action_at && <span className={overdue ? "font-medium text-destructive" : ""}><CalendarClock className="mr-1 inline h-3 w-3" />{new Date(lead.next_action_at).toLocaleString(locale)}</span>}</div>
              </button>;
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selected && <>
            <DialogHeader><DialogTitle>{selected.name}</DialogTitle><DialogDescription>{t("productionV2.leads.received", { date: new Date(selected.created_at).toLocaleString(locale) })}</DialogDescription></DialogHeader>
            <div className="grid gap-3 rounded-lg bg-muted/40 p-4 sm:grid-cols-2">
              <a className="flex items-center gap-2 text-sm text-primary hover:underline" href={`mailto:${selected.email}`}><Mail className="h-4 w-4" />{selected.email}</a>
              {selected.phone && <a className="flex items-center gap-2 text-sm text-primary hover:underline" href={`tel:${selected.phone}`}><Phone className="h-4 w-4" />{selected.phone}</a>}
              <p className="sm:col-span-2 whitespace-pre-wrap text-sm text-foreground">{selected.message}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>{t("productionV2.leads.statusLabel")}</Label><Select value={selected.status} onValueChange={(value) => void manage({ status: value as LeadStatus })} disabled={saving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusOrder.map((status) => <SelectItem value={status} key={status}>{statusLabel(status)}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>{t("productionV2.leads.priorityLabel")}</Label><Select value={selected.priority} onValueChange={(value) => void manage({ priority: value as LeadPriority })} disabled={saving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["low", "normal", "high"] as LeadPriority[]).map((priority) => <SelectItem value={priority} key={priority}>{t(`productionV2.leads.priority.${priority}`)}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>{t("productionV2.leads.assignee")}</Label><Select value={selected.assigned_to || "unassigned"} onValueChange={(value) => void manage({ assignedTo: value === "unassigned" ? null : value })} disabled={saving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassigned">{t("productionV2.leads.unassigned")}</SelectItem>{team.map((member) => <SelectItem value={member.user_id} key={member.user_id}>{member.full_name || member.email}</SelectItem>)}</SelectContent></Select></div>
              <div><Label htmlFor="lead-next-action">{t("productionV2.leads.nextAction")}</Label><div className="flex gap-2"><Input id="lead-next-action" type="datetime-local" value={nextAction} onChange={(event) => setNextAction(event.target.value)} /><Button variant="outline" onClick={() => void manage({ nextActionAt: nextAction || null })} disabled={saving}>{t("common.save")}</Button></div></div>
            </div>
            <div><Label htmlFor="lead-note">{t("productionV2.leads.note")}</Label><Textarea id="lead-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} placeholder={t("productionV2.leads.notePlaceholder")} /><Button className="mt-2" variant="outline" disabled={saving || note.trim().length < 2} onClick={() => void manage({ note })}>{t("productionV2.leads.addNote")}</Button></div>
            <div><h3 className="mb-2 text-sm font-semibold">{t("productionV2.leads.history")}</h3>{events.length === 0 ? <p className="text-sm text-muted-foreground">{t("productionV2.leads.noHistory")}</p> : <ol className="space-y-2 border-l pl-4">{events.map((event) => <li key={event.id} className="text-sm"><p className="font-medium">{t(`productionV2.leads.event.${event.event_type}`)}</p>{event.note && <p className="whitespace-pre-wrap text-muted-foreground">{event.note}</p>}<p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString(locale)}</p></li>)}</ol>}</div>
            {selected.next_action_at && new Date(selected.next_action_at) <= new Date() && <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{t("productionV2.leads.overdue")}</div>}
          </>}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DealerLeadInbox;
