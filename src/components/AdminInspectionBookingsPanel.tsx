import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Shield, Loader2, Upload } from "lucide-react";

interface Booking {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  inspection_type: string;
  price: number;
  scheduled_at: string | null;
  score: number | null;
  total_points: number;
  report_url: string | null;
  inspector_notes: string | null;
  buyer_phone: string | null;
  buyer_address: string | null;
  buyer_notes: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-muted text-muted-foreground",
  paid: "bg-warning/20 text-warning",
  scheduled: "bg-primary/20 text-primary",
  in_progress: "bg-accent/20 text-accent",
  completed: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

const AdminInspectionBookingsPanel = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [inspectors, setInspectors] = useState<any[]>([]);
  const [inspectorId, setInspectorId] = useState<string>("");

  const load = async () => {
    setLoading(true);
    const [{ data: bks }, { data: ins }] = await Promise.all([
      supabase.from("inspection_bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("inspector_profiles").select("user_id, full_name, coverage_postcodes, max_travel_miles, is_verified, is_active, total_inspections").eq("is_active", true).eq("is_verified", true),
    ]);
    setBookings((bks as any) || []);
    setInspectors((ins as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (b: Booking) => {
    setEditing(b);
    setScore(b.score?.toString() || "");
    setNotes(b.inspector_notes || "");
    setScheduledAt(b.scheduled_at ? b.scheduled_at.slice(0, 16) : "");
    setStatus(b.status);
    setReportFile(null);
    setInspectorId((b as any).inspector_id || "");
  };

  // Filter inspectors that cover this booking's postcode area
  const matchingInspectors = (b: Booking | null) => {
    if (!b?.buyer_address) return inspectors;
    const upper = b.buyer_address.toUpperCase();
    const matches = inspectors.filter((i) =>
      (i.coverage_postcodes || []).some((pc: string) => upper.includes(pc.toUpperCase()))
    );
    return matches.length > 0 ? matches : inspectors;
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      let reportUrl = editing.report_url;
      if (reportFile) {
        const path = `inspections/${editing.id}/${Date.now()}-${reportFile.name}`;
        const { error: upErr } = await supabase.storage.from("listing-documents").upload(path, reportFile);
        if (upErr) throw upErr;
        reportUrl = path;
      }

      const updates: any = {
        status,
        inspector_notes: notes || null,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        score: score ? parseInt(score) : null,
        report_url: reportUrl,
        inspector_id: inspectorId || null,
      };
      if (status === "completed") updates.completed_at = new Date().toISOString();

      const { error } = await supabase.from("inspection_bookings").update(updates).eq("id", editing.id);
      if (error) throw error;

      // If completed with score, push to listing
      if (status === "completed" && score) {
        await supabase.from("car_listings").update({
          inspection_score: parseInt(score),
          inspection_report_url: reportUrl,
          inspection_completed_at: new Date().toISOString(),
        }).eq("id", editing.listing_id);

        await supabase.from("notifications").insert({
          user_id: editing.buyer_id,
          type: "inspection",
          title: "Inspection report ready 📋",
          message: `Your vehicle inspection is complete (${score}/${editing.total_points}).`,
          link: `/car/${editing.listing_id}`,
        });
      }

      toast({ title: "Booking updated" });
      setEditing(null);
      load();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const viewReport = async (path: string) => {
    const { data } = await supabase.storage.from("listing-documents").createSignedUrl(path, 600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Inspection Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        ) : bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No bookings yet.</p>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={STATUS_COLORS[b.status]}>{b.status.replace("_", " ")}</Badge>
                    <span className="text-sm font-medium">£{b.price} · {b.inspection_type === "premium_300" ? "Premium 300pt" : "Standard 200pt"}</span>
                    {b.score !== null && <Badge variant="outline">{b.score}/{b.total_points}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {b.buyer_phone} · {b.buyer_address} · {new Date(b.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => openEdit(b)}>Manage</Button>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Inspection</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <div><strong>Phone:</strong> {editing.buyer_phone}</div>
                  <div><strong>Address:</strong> {editing.buyer_address}</div>
                  {editing.buyer_notes && <div><strong>Notes:</strong> {editing.buyer_notes}</div>}
                </div>

                <div>
                  <Label>Assign inspector</Label>
                  <Select value={inspectorId} onValueChange={setInspectorId}>
                    <SelectTrigger><SelectValue placeholder="Select inspector..." /></SelectTrigger>
                    <SelectContent>
                      {matchingInspectors(editing).length === 0 && <SelectItem value="none" disabled>No verified inspectors</SelectItem>}
                      {matchingInspectors(editing).map((i) => (
                        <SelectItem key={i.user_id} value={i.user_id}>
                          {i.full_name} · {(i.coverage_postcodes || []).slice(0, 4).join(", ")} · {i.total_inspections || 0} done
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">Filtered by postcode coverage matching buyer address.</p>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Scheduled date/time</Label>
                  <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                </div>

                <div>
                  <Label>Score (out of {editing.total_points})</Label>
                  <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="e.g. 178" />
                </div>

                <div>
                  <Label>Inspector notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>

                <div>
                  <Label>Report PDF</Label>
                  <Input type="file" accept=".pdf" onChange={(e) => setReportFile(e.target.files?.[0] || null)} />
                  {editing.report_url && (
                    <Button size="sm" variant="link" onClick={() => viewReport(editing.report_url!)} className="px-0">
                      View existing report
                    </Button>
                  )}
                </div>

                <Button onClick={save} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Save changes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminInspectionBookingsPanel;
