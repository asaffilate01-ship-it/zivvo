import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { TrendingUp, Plus, Receipt, Car } from "lucide-react";

interface Props { dealerId: string; }

interface ProfitRow {
  listing_id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  asking_price: number;
  status: string;
  purchase_cost: number;
  additional_costs: number;
  total_costs: number;
  total_vat: number;
  sale_price: number | null;
}

const COST_CATEGORIES = [
  { value: "purchase", label: "Purchase price" },
  { value: "recon", label: "Reconditioning" },
  { value: "transport", label: "Transport" },
  { value: "valeting", label: "Valeting" },
  { value: "advertising", label: "Advertising" },
  { value: "parts", label: "Parts" },
  { value: "labour", label: "Labour" },
  { value: "other", label: "Other" },
];

const VehicleCostsManager = ({ dealerId }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<ProfitRow[]>([]);
  const [selectedListing, setSelectedListing] = useState<ProfitRow | null>(null);
  const [costsForListing, setCostsForListing] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [costForm, setCostForm] = useState({ category: "recon", description: "", amount: "", vat_amount: "", supplier: "", invoice_ref: "", cost_date: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    const { data } = await supabase
      .from("dealer_vehicle_profit" as any)
      .select("*")
      .eq("dealer_id", dealerId)
      .order("created_at", { ascending: false } as any)
      .limit(50);
    setRows((data as any) || []);
  };

  useEffect(() => { load(); }, [dealerId]);

  const openListing = async (row: ProfitRow) => {
    setSelectedListing(row);
    const { data } = await supabase
      .from("vehicle_costs" as any)
      .select("*")
      .eq("listing_id", row.listing_id)
      .order("cost_date", { ascending: false });
    setCostsForListing((data as any) || []);
    setOpen(true);
  };

  const addCost = async () => {
    if (!selectedListing || !costForm.amount) return;
    const { error } = await supabase.from("vehicle_costs" as any).insert({
      listing_id: selectedListing.listing_id,
      dealer_id: dealerId,
      category: costForm.category,
      description: costForm.description || null,
      amount: parseFloat(costForm.amount),
      vat_amount: costForm.vat_amount ? parseFloat(costForm.vat_amount) : 0,
      supplier: costForm.supplier || null,
      invoice_ref: costForm.invoice_ref || null,
      cost_date: costForm.cost_date,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cost added" });
    setCostForm({ ...costForm, description: "", amount: "", vat_amount: "", supplier: "", invoice_ref: "" });
    openListing(selectedListing);
    load();
  };

  const totalProfit = rows.reduce((s, r) => {
    if (!r.sale_price) return s;
    return s + (Number(r.sale_price) - Number(r.total_costs));
  }, 0);
  const totalInStock = rows.filter(r => !r.sale_price).reduce((s, r) => s + Number(r.total_costs), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Costs & Profit per Vehicle</CardTitle>
        <p className="text-xs text-muted-foreground">Track every cost (purchase, recon, transport, ad spend) and see live gross profit on each car.</p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Vehicles tracked</p><p className="font-display text-xl font-bold">{rows.length}</p></div>
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Capital in stock</p><p className="font-display text-xl font-bold">£{totalInStock.toLocaleString()}</p></div>
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Realised profit</p><p className={`font-display text-xl font-bold ${totalProfit >= 0 ? "text-success" : "text-destructive"}`}>£{totalProfit.toLocaleString()}</p></div>
        </div>

        <div className="space-y-2">
          {rows.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center"><Car className="h-10 w-10 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Add stock to your inventory to start tracking costs</p></div>
          )}
          {rows.map(r => {
            const profit = r.sale_price ? Number(r.sale_price) - Number(r.total_costs) : null;
            const margin = r.asking_price ? ((Number(r.asking_price) - Number(r.total_costs)) / Number(r.asking_price)) * 100 : 0;
            return (
              <div key={r.listing_id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm hover:border-primary/40 cursor-pointer" onClick={() => openListing(r)}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.year} {r.make} {r.model}</p>
                  <p className="text-xs text-muted-foreground">Asking £{Number(r.asking_price).toLocaleString()} · Costs £{Number(r.total_costs).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  {profit !== null ? (
                    <Badge className={profit >= 0 ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}>{profit >= 0 ? "+" : ""}£{profit.toLocaleString()}</Badge>
                  ) : (
                    <Badge variant="outline">~{margin.toFixed(0)}% margin</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader><DialogTitle>{selectedListing?.year} {selectedListing?.make} {selectedListing?.model}</DialogTitle></DialogHeader>
            {selectedListing && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded border border-border p-2"><p className="text-xs text-muted-foreground">Asking</p><p className="font-semibold">£{Number(selectedListing.asking_price).toLocaleString()}</p></div>
                  <div className="rounded border border-border p-2"><p className="text-xs text-muted-foreground">Total Costs</p><p className="font-semibold">£{Number(selectedListing.total_costs).toLocaleString()}</p></div>
                  <div className="rounded border border-border p-2"><p className="text-xs text-muted-foreground">VAT</p><p className="font-semibold">£{Number(selectedListing.total_vat).toLocaleString()}</p></div>
                  <div className="rounded border border-border p-2"><p className="text-xs text-muted-foreground">Gross Margin</p><p className="font-semibold">£{(Number(selectedListing.asking_price) - Number(selectedListing.total_costs)).toLocaleString()}</p></div>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <h4 className="mb-2 text-sm font-semibold">Add Cost</h4>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Select value={costForm.category} onValueChange={v => setCostForm({ ...costForm, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{COST_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="Amount £" type="number" step="0.01" value={costForm.amount} onChange={e => setCostForm({ ...costForm, amount: e.target.value })} />
                    <Input placeholder="VAT £ (opt)" type="number" step="0.01" value={costForm.vat_amount} onChange={e => setCostForm({ ...costForm, vat_amount: e.target.value })} />
                    <Input placeholder="Description" value={costForm.description} onChange={e => setCostForm({ ...costForm, description: e.target.value })} />
                    <Input placeholder="Supplier" value={costForm.supplier} onChange={e => setCostForm({ ...costForm, supplier: e.target.value })} />
                    <Input placeholder="Invoice ref" value={costForm.invoice_ref} onChange={e => setCostForm({ ...costForm, invoice_ref: e.target.value })} />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" onClick={addCost} className="gradient-primary border-0"><Plus className="mr-1 h-3 w-3" /> Add Cost</Button>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-semibold flex items-center gap-2"><Receipt className="h-4 w-4" /> Cost History</h4>
                  {costsForListing.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No costs recorded yet</p>
                  ) : (
                    <div className="space-y-1.5">
                      {costsForListing.map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between rounded border border-border p-2 text-sm">
                          <div>
                            <Badge variant="outline" className="mr-2 capitalize">{c.category}</Badge>
                            <span>{c.description || "—"}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{c.supplier} · {new Date(c.cost_date).toLocaleDateString()}</span>
                          </div>
                          <span className="font-semibold">£{Number(c.amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Close</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default VehicleCostsManager;
