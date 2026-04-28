import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet, CheckCircle2, Clock, XCircle } from "lucide-react";

interface PayoutRow {
  id: string;
  booking_id: string;
  inspector_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_reference: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  inspector_name?: string | null;
  vehicle?: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  approved: "bg-primary/20 text-primary",
  paid: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
};

const AdminInspectorPayoutsPanel = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<PayoutRow | null>(null);
  const [editStatus, setEditStatus] = useState("paid");
  const [editRef, setEditRef] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: payouts, error } = await supabase
      .from("inspector_payouts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading payouts", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const inspectorIds = Array.from(new Set((payouts || []).map((p: any) => p.inspector_id)));
    const bookingIds = Array.from(new Set((payouts || []).map((p: any) => p.booking_id)));

    const [{ data: profs }, { data: bookings }] = await Promise.all([
      inspectorIds.length
        ? supabase.from("profiles_public").select("user_id, full_name").in("user_id", inspectorIds)
        : Promise.resolve({ data: [] as any[] }),
      bookingIds.length
        ? supabase
            .from("inspection_bookings")
            .select("id, listing_id, car_listings(make, model, year)")
            .in("id", bookingIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const merged: PayoutRow[] = (payouts || []).map((p: any) => {
      const insp = profs?.find((x: any) => x.user_id === p.inspector_id);
      const bk: any = bookings?.find((x: any) => x.id === p.booking_id);
      const cl = bk?.car_listings;
      return {
        ...p,
        inspector_name: insp?.full_name ?? null,
        vehicle: cl ? `${cl.year} ${cl.make} ${cl.model}` : null,
      };
    });
    setRows(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter)),
    [rows, statusFilter]
  );

  const totals = useMemo(() => {
    const sum = (status: string) =>
      rows.filter((r) => r.status === status).reduce((a, b) => a + Number(b.amount || 0), 0);
    return { pending: sum("pending"), approved: sum("approved"), paid: sum("paid") };
  }, [rows]);

  const openEdit = (row: PayoutRow) => {
    setEditing(row);
    setEditStatus(row.status === "pending" ? "approved" : "paid");
    setEditRef(row.payment_reference || "");
    setEditNotes(row.notes || "");
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const updates: any = {
      status: editStatus,
      payment_reference: editRef || null,
      notes: editNotes || null,
    };
    if (editStatus === "paid") updates.paid_at = new Date().toISOString();
    const { error } = await supabase.from("inspector_payouts").update(updates).eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Payout updated" });
    setEditing(null);
    load();
  };

  const fmt = (n: number) => `£${Number(n || 0).toFixed(2)}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-warning" />
          <div><p className="text-xs text-muted-foreground">Pending</p><p className="font-bold">{fmt(totals.pending)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Wallet className="h-5 w-5 text-primary" />
          <div><p className="text-xs text-muted-foreground">Approved</p><p className="font-bold">{fmt(totals.approved)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div><p className="text-xs text-muted-foreground">Paid</p><p className="font-bold">{fmt(totals.paid)}</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Inspector Payouts</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No payouts found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.inspector_name || r.inspector_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm">{r.vehicle || "—"}</TableCell>
                    <TableCell>{fmt(r.amount)}</TableCell>
                    <TableCell><Badge className={STATUS_BADGE[r.status]}>{r.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.payment_reference || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {r.status !== "paid" && r.status !== "cancelled" && (
                        <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Update</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update payout</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {editing.inspector_name} · {editing.vehicle || "—"} · <span className="font-medium text-foreground">{fmt(editing.amount)}</span>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Payment reference</label>
                <Input value={editRef} onChange={(e) => setEditRef(e.target.value)} placeholder="e.g. BACS ref / Stripe payout id" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Notes</label>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInspectorPayoutsPanel;
