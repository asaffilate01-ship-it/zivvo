import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Download, FileText, BookOpen } from "lucide-react";

interface Props { dealerId: string; }

interface StockEntry {
  id: string;
  entry_type: string;
  registration: string | null;
  make: string | null;
  model: string | null;
  party_name: string | null;
  amount: number;
  entry_date: string;
  notes: string | null;
}

const StockBookManager = ({ dealerId }: Props) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    entry_type: "purchase",
    registration: "", make: "", model: "", vin: "", mileage: "",
    party_name: "", party_address: "", party_email: "", party_phone: "",
    amount: "", payment_method: "bank_transfer", entry_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const load = async () => {
    const { data } = await supabase
      .from("stock_book_entries" as any)
      .select("*")
      .eq("dealer_id", dealerId)
      .order("entry_date", { ascending: false })
      .limit(200);
    setEntries((data as any) || []);
  };

  // Reload when the dashboard changes dealer context.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [dealerId]);

  const submit = async () => {
    if (!form.party_name || !form.amount) {
      toast({ title: "Missing fields", description: "Party name and amount required", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("stock_book_entries" as any).insert({
      dealer_id: dealerId,
      entry_type: form.entry_type,
      registration: form.registration || null,
      make: form.make || null,
      model: form.model || null,
      vin: form.vin || null,
      mileage: form.mileage ? parseInt(form.mileage) : null,
      party_name: form.party_name,
      party_address: form.party_address || null,
      party_email: form.party_email || null,
      party_phone: form.party_phone || null,
      amount: parseFloat(form.amount),
      payment_method: form.payment_method,
      entry_date: form.entry_date,
      notes: form.notes || null,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Stock book entry added" });
      setOpen(false);
      setForm({ ...form, registration: "", make: "", model: "", vin: "", mileage: "", party_name: "", party_address: "", party_email: "", party_phone: "", amount: "", notes: "" });
      load();
    }
  };

  const exportCSV = () => {
    const headers = ["Date", "Type", "Reg", "Make", "Model", "VIN", "Mileage", "Party", "Address", "Email", "Phone", "Amount", "Payment", "Notes"];
    const rows = entries.map(e => [
      e.entry_date, e.entry_type, e.registration || "", e.make || "", e.model || "",
      (e as any).vin || "", (e as any).mileage || "", e.party_name || "", (e as any).party_address || "",
      (e as any).party_email || "", (e as any).party_phone || "", e.amount, (e as any).payment_method || "", e.notes || "",
    ].map(v => `"${String(v).replace(/"/g, '""')}"`));
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `stock-book-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Stock book exported (HMRC ready)" });
  };

  const purchases = entries.filter(e => e.entry_type === "purchase");
  const sales = entries.filter(e => e.entry_type === "sale");
  const totalIn = purchases.reduce((s, e) => s + Number(e.amount), 0);
  const totalOut = sales.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Stock Book</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">HMRC-compliant record of every vehicle purchase and sale.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!entries.length}>
            <Download className="mr-1 h-4 w-4" /> Export
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary border-0"><Plus className="mr-1 h-4 w-4" /> New Entry</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader><DialogTitle>New Stock Book Entry</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Entry Type</Label>
                  <Select value={form.entry_type} onValueChange={v => setForm({ ...form, entry_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase (vehicle in)</SelectItem>
                      <SelectItem value="sale">Sale (vehicle out)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Registration</Label><Input value={form.registration} onChange={e => setForm({ ...form, registration: e.target.value.toUpperCase() })} /></div>
                <div><Label>VIN</Label><Input value={form.vin} onChange={e => setForm({ ...form, vin: e.target.value })} /></div>
                <div><Label>Make</Label><Input value={form.make} onChange={e => setForm({ ...form, make: e.target.value })} /></div>
                <div><Label>Model</Label><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></div>
                <div><Label>Mileage</Label><Input type="number" value={form.mileage} onChange={e => setForm({ ...form, mileage: e.target.value })} /></div>
                <div><Label>Date</Label><Input type="date" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>{form.entry_type === "purchase" ? "Bought from" : "Sold to"} (name) *</Label><Input value={form.party_name} onChange={e => setForm({ ...form, party_name: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Address</Label><Input value={form.party_address} onChange={e => setForm({ ...form, party_address: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.party_email} onChange={e => setForm({ ...form, party_email: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={form.party_phone} onChange={e => setForm({ ...form, party_phone: e.target.value })} /></div>
                <div><Label>Amount (€) *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="part_exchange">Part Exchange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={loading} className="gradient-primary border-0">{loading ? "Saving…" : "Save Entry"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Purchases</p><p className="font-display text-xl font-bold">{purchases.length}</p></div>
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Sales</p><p className="font-display text-xl font-bold">{sales.length}</p></div>
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Cash Out</p><p className="font-display text-lg font-bold text-destructive">€{totalIn.toLocaleString()}</p></div>
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Cash In</p><p className="font-display text-lg font-bold text-success">€{totalOut.toLocaleString()}</p></div>
        </div>

        <Tabs defaultValue="all">
          <TabsList><TabsTrigger value="all">All ({entries.length})</TabsTrigger><TabsTrigger value="purchase">Purchases</TabsTrigger><TabsTrigger value="sale">Sales</TabsTrigger></TabsList>
          {(["all", "purchase", "sale"] as const).map(tab => (
            <TabsContent key={tab} value={tab} className="space-y-2">
              {(tab === "all" ? entries : entries.filter(e => e.entry_type === tab)).slice(0, 50).map(e => (
                <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant={e.entry_type === "sale" ? "default" : "secondary"}>{e.entry_type}</Badge>
                    <div>
                      <p className="font-medium">{[e.registration, e.make, e.model].filter(Boolean).join(" · ") || "Vehicle"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(e.entry_date).toLocaleDateString()} · {e.party_name}</p>
                    </div>
                  </div>
                  <div className={`font-display font-semibold ${e.entry_type === "sale" ? "text-success" : "text-destructive"}`}>
                    {e.entry_type === "sale" ? "+" : "−"}€{Number(e.amount).toLocaleString()}
                  </div>
                </div>
              ))}
              {entries.length === 0 && (
                <div className="flex flex-col items-center py-8 text-center"><FileText className="h-10 w-10 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">No entries yet</p></div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StockBookManager;
