import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, FunnelChart, Funnel, LabelList, Cell,
} from "recharts";
import {
  Plus, DollarSign, TrendingUp, Users, Target, ArrowRight,
  Clock, CheckCircle, XCircle, Phone, Mail, GripVertical, Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext, closestCenter, DragOverlay, useSensor, useSensors, PointerSensor,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";

type PipelineStage = "lead" | "enquiry" | "viewing" | "offer" | "negotiation" | "sold" | "lost";

interface PipelineLead {
  id: string;
  listing_id: string | null;
  seller_id: string;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_id: string | null;
  stage: PipelineStage;
  notes: string | null;
  expected_value: number;
  actual_value: number | null;
  source: string | null;
  assigned_to: string | null;
  dealer_id: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  lost_reason: string | null;
}

interface SalesPipelineProps {
  mode: "dealer" | "agent" | "admin";
  dealerId?: string;
}

const STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: "lead", label: "Lead", color: "hsl(var(--muted-foreground))" },
  { key: "enquiry", label: "Enquiry", color: "hsl(210, 100%, 52%)" },
  { key: "viewing", label: "Viewing", color: "hsl(280, 70%, 55%)" },
  { key: "offer", label: "Offer", color: "hsl(45, 90%, 50%)" },
  { key: "negotiation", label: "Negotiation", color: "hsl(16, 90%, 54%)" },
  { key: "sold", label: "Sold", color: "hsl(142, 70%, 45%)" },
  { key: "lost", label: "Lost", color: "hsl(0, 70%, 50%)" },
];

const FUNNEL_COLORS = ["#6366f1", "#3b82f6", "#8b5cf6", "#f59e0b", "#f97316", "#22c55e", "#ef4444"];

const SalesPipeline = ({ mode, dealerId }: SalesPipelineProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<PipelineLead | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLead, setNewLead] = useState({
    buyer_name: "", buyer_email: "", buyer_phone: "", expected_value: "",
    notes: "", source: "website",
  });

  const fetchLeads = useCallback(async () => {
    if (!user) return;
    let query = supabase.from("pipeline_leads").select("*").order("updated_at", { ascending: false });

    if (mode === "dealer") {
      query = query.eq("seller_id", user.id);
    } else if (mode === "agent" && dealerId) {
      query = query.eq("dealer_id", dealerId);
    }
    // admin sees all

    const { data, error } = await query;
    if (error) {
      console.error("Pipeline fetch error:", error);
    } else {
      setLeads((data || []) as PipelineLead[]);
    }
    setLoading(false);
  }, [user, mode, dealerId]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const moveLead = async (leadId: string, newStage: PipelineStage) => {
    const updates: any = { stage: newStage };
    if (newStage === "sold" || newStage === "lost") {
      updates.closed_at = new Date().toISOString();
    }
    const { error } = await supabase.from("pipeline_leads").update(updates).eq("id", leadId);
    if (error) {
      toast({ title: "Error moving lead", variant: "destructive" });
    } else {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
      if (selectedLead?.id === leadId) setSelectedLead(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const addLead = async () => {
    if (!user || !newLead.buyer_name) return;
    const { error } = await supabase.from("pipeline_leads").insert({
      seller_id: user.id,
      buyer_name: newLead.buyer_name,
      buyer_email: newLead.buyer_email || null,
      buyer_phone: newLead.buyer_phone || null,
      expected_value: parseFloat(newLead.expected_value) || 0,
      notes: newLead.notes || null,
      source: newLead.source,
      dealer_id: dealerId || null,
      stage: "lead" as any,
    } as any);
    if (error) {
      toast({ title: "Error adding lead", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead added" });
      setShowAddDialog(false);
      setNewLead({ buyer_name: "", buyer_email: "", buyer_phone: "", expected_value: "", notes: "", source: "website" });
      fetchLeads();
    }
  };

  const updateLeadNotes = async (leadId: string, notes: string) => {
    await supabase.from("pipeline_leads").update({ notes } as any).eq("id", leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes } : l));
  };

  const markLost = async (leadId: string, reason: string) => {
    await supabase.from("pipeline_leads").update({
      stage: "lost" as any,
      lost_reason: reason,
      closed_at: new Date().toISOString(),
    } as any).eq("id", leadId);
    fetchLeads();
    setSelectedLead(null);
  };

  const exportCSV = () => {
    if (!leads.length) return;
    const headers = "Name,Email,Phone,Stage,Expected Value,Source,Created,Notes";
    const rows = leads.map(l =>
      `"${l.buyer_name}","${l.buyer_email}","${l.buyer_phone}","${l.stage}","${l.expected_value}","${l.source}","${l.created_at}","${(l.notes || '').replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "pipeline-leads.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // KPI calculations
  const activeLeads = leads.filter(l => l.stage !== "sold" && l.stage !== "lost");
  const wonLeads = leads.filter(l => l.stage === "sold");
  const lostLeads = leads.filter(l => l.stage === "lost");
  const totalPipelineValue = activeLeads.reduce((s, l) => s + Number(l.expected_value || 0), 0);
  const totalWonValue = wonLeads.reduce((s, l) => s + Number(l.actual_value || l.expected_value || 0), 0);
  const conversionRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;
  const avgDealTime = wonLeads.length > 0
    ? Math.round(wonLeads.reduce((s, l) => {
        const created = new Date(l.created_at).getTime();
        const closed = new Date(l.closed_at || l.updated_at).getTime();
        return s + (closed - created) / (1000 * 60 * 60 * 24);
      }, 0) / wonLeads.length)
    : 0;

  // Funnel data
  const funnelData = STAGES.filter(s => s.key !== "lost").map(s => ({
    name: s.label,
    value: leads.filter(l => l.stage === s.key).length,
  }));

  // Time series - leads created per week (last 8 weeks)
  const timeSeriesData = useMemo(() => {
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      return { start, end, label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
    }).reverse();

    return weeks.map(w => ({
      label: w.label,
      leads: leads.filter(l => {
        const d = new Date(l.created_at);
        return d >= w.start && d < w.end;
      }).length,
      won: leads.filter(l => {
        const d = new Date(l.closed_at || "");
        return l.stage === "sold" && d >= w.start && d < w.end;
      }).length,
    }));
  }, [leads]);

  // Leads grouped by stage for kanban
  const stageGroups = useMemo(() => {
    const groups: Record<PipelineStage, PipelineLead[]> = {
      lead: [], enquiry: [], viewing: [], offer: [], negotiation: [], sold: [], lost: [],
    };
    leads.forEach(l => groups[l.stage]?.push(l));
    return groups;
  }, [leads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pipeline Value", value: `$${totalPipelineValue.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
          { label: "Won Revenue", value: `$${totalWonValue.toLocaleString()}`, icon: TrendingUp, color: "text-success" },
          { label: "Conversion Rate", value: `${conversionRate}%`, icon: Target, color: "text-warning" },
          { label: "Avg Deal Time", value: `${avgDealTime}d`, icon: Clock, color: "text-info" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
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
          </motion.div>
        ))}
      </div>

      {/* Pipeline Tabs */}
      <Tabs defaultValue="kanban">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="funnel">Funnel</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="mr-1 h-4 w-4" /> CSV
            </Button>
            {mode !== "agent" && (
              <Button size="sm" className="gradient-primary border-0" onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-1 h-4 w-4" /> Add Lead
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="kanban" className="mt-4">
          <KanbanBoard
            stages={STAGES}
            stageGroups={stageGroups}
            onMoveLead={moveLead}
            onSelectLead={setSelectedLead}
          />
          {/* Lost leads summary */}
          {stageGroups.lost.length > 0 && (
            <Card className="mt-4 border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-destructive">Lost Leads ({stageGroups.lost.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {stageGroups.lost.slice(0, 10).map(lead => (
                  <Badge key={lead.id} variant="outline" className="cursor-pointer border-destructive/30 text-muted-foreground" onClick={() => setSelectedLead(lead)}>
                    {lead.buyer_name} {lead.lost_reason && `· ${lead.lost_reason}`}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Funnel Chart */}
        <TabsContent value="funnel" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {funnelData.map((stage, i) => {
                    const maxVal = Math.max(...funnelData.map(s => s.value), 1);
                    const pct = (stage.value / maxVal) * 100;
                    const dropOff = i > 0 && funnelData[i - 1].value > 0
                      ? Math.round(((funnelData[i - 1].value - stage.value) / funnelData[i - 1].value) * 100)
                      : 0;
                    return (
                      <div key={stage.name}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-card-foreground">{stage.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-card-foreground font-semibold">{stage.value}</span>
                            {i > 0 && dropOff > 0 && (
                              <span className="text-[10px] text-destructive">-{dropOff}%</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-1 h-6 rounded bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded"
                            style={{ backgroundColor: FUNNEL_COLORS[i] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Stage Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={funnelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} className="fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {funnelData.map((_, i) => (
                        <Cell key={i} fill={FUNNEL_COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Time Series */}
        <TabsContent value="trends" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">New Leads (8 Weeks)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                    <Area type="monotone" dataKey="leads" stroke="hsl(210, 100%, 52%)" fill="hsl(210, 100%, 52%)" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Deals Won (8 Weeks)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                    <Bar dataKey="won" fill="hsl(142, 70%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Source breakdown */}
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Lead Sources</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-4">
                {["website", "referral", "walk-in", "phone"].map(source => {
                  const count = leads.filter(l => l.source === source).length;
                  const won = leads.filter(l => l.source === source && l.stage === "sold").length;
                  return (
                    <div key={source} className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground capitalize">{source}</p>
                      <p className="font-display text-xl font-bold text-card-foreground">{count}</p>
                      <p className="text-[10px] text-success">{won} won</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Lead Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Add New Lead</DialogTitle>
            <DialogDescription>Add a potential buyer to your sales pipeline</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Buyer name *" value={newLead.buyer_name} onChange={e => setNewLead(p => ({ ...p, buyer_name: e.target.value }))} />
            <Input placeholder="Email" type="email" value={newLead.buyer_email} onChange={e => setNewLead(p => ({ ...p, buyer_email: e.target.value }))} />
            <Input placeholder="Phone" value={newLead.buyer_phone} onChange={e => setNewLead(p => ({ ...p, buyer_phone: e.target.value }))} />
            <Input placeholder="Expected value ($)" type="number" value={newLead.expected_value} onChange={e => setNewLead(p => ({ ...p, expected_value: e.target.value }))} />
            <Select value={newLead.source} onValueChange={v => setNewLead(p => ({ ...p, source: v }))}>
              <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="walk-in">Walk-in</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Notes" value={newLead.notes} onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))} />
            <Button className="w-full gradient-primary border-0" onClick={addLead} disabled={!newLead.buyer_name}>
              Add Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedLead?.buyer_name}</DialogTitle>
            <DialogDescription>
              Stage: <Badge variant="secondary" className="ml-1">{selectedLead?.stage}</Badge>
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectedLead.buyer_email && (
                  <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{selectedLead.buyer_email}</span></div>
                )}
                {selectedLead.buyer_phone && (
                  <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{selectedLead.buyer_phone}</span></div>
                )}
                <div><span className="text-muted-foreground">Value:</span> <span className="text-primary font-semibold">${Number(selectedLead.expected_value).toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Source:</span> <span className="text-foreground capitalize">{selectedLead.source}</span></div>
                <div><span className="text-muted-foreground">Created:</span> <span className="text-foreground">{new Date(selectedLead.created_at).toLocaleDateString()}</span></div>
              </div>

              {/* Notes */}
              <div>
                <Textarea
                  placeholder="Add notes..."
                  defaultValue={selectedLead.notes || ""}
                  onBlur={e => updateLeadNotes(selectedLead.id, e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Move stage */}
              {selectedLead.stage !== "sold" && selectedLead.stage !== "lost" && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Move to:</p>
                  <div className="flex flex-wrap gap-2">
                    {STAGES.filter(s =>
                      s.key !== selectedLead.stage && s.key !== "lost"
                    ).map(s => (
                      <Button
                        key={s.key}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => moveLead(selectedLead.id, s.key)}
                      >
                        <div className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.label}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs border-destructive text-destructive"
                    onClick={() => markLost(selectedLead.id, "No response")}
                  >
                    <XCircle className="mr-1 h-3 w-3" /> Mark Lost
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesPipeline;
