import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { TrendingUp, Plus, Receipt, Car, Trash2, Info } from "lucide-react";

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
  { value: "purchase", label: "Purchase price", hint: "What you paid for the car" },
  { value: "repairs", label: "Repairs", hint: "Mechanical repairs (margin scheme: not deductible from VAT margin)" },
  { value: "parts", label: "Parts", hint: "Replacement parts" },
  { value: "labour", label: "Labour", hint: "Workshop labour" },
  { value: "transport", label: "Transportation", hint: "Collection / delivery / trade plates" },
  { value: "mot", label: "HU/AU & service", hint: "HU/AU, service, oil, etc." },
  { value: "valeting", label: "Valeting / detailing", hint: "Cleaning & prep" },
  { value: "warranty", label: "Warranty", hint: "Warranty cover purchased for resale" },
  { value: "advertising", label: "Advertising", hint: "Marketing spend on this car" },
  { value: "finance", label: "Finance / floor-plan", hint: "Interest on stocking finance" },
  { value: "fees", label: "Auction / admin fees", hint: "Auction fees, legal/finance checks, paperwork" },
  { value: "other", label: "Other", hint: "Anything else" },
];

const VAT_SCHEMES = [
  { value: "margin", label: "Margin scheme", hint: "VAT due = (Sale − Purchase) × 1/6. Repairs/transport DO NOT reduce the margin." },
  { value: "standard", label: "Standard VAT", hint: "Reclaim input VAT on costs, charge 20% output VAT on full sale price." },
  { value: "none", label: "Not VAT registered", hint: "No VAT due, no VAT reclaim." },
];

const VehicleCostsManager = ({ dealerId }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<ProfitRow[]>([]);
  const [vatSchemes, setVatSchemes] = useState<Record<string, string>>({});
  const [salePrices, setSalePrices] = useState<Record<string, string>>({});
  const [selectedListing, setSelectedListing] = useState<ProfitRow | null>(null);
  const [costsForListing, setCostsForListing] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [costForm, setCostForm] = useState({ category: "repairs", description: "", amount: "", vat_amount: "", supplier: "", invoice_ref: "", cost_date: new Date().toISOString().slice(0, 10) });

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("dealer_vehicle_profit" as any)
      .select("*")
      .eq("dealer_id", dealerId)
      .order("created_at", { ascending: false } as any)
      .limit(100);
    setRows((data as any) || []);

    const ids = ((data as any) || []).map((r: any) => r.listing_id);
    if (ids.length) {
      const { data: schemeRows } = await supabase
        .from("car_listings")
        .select("id, vat_scheme")
        .in("id", ids);
      const map: Record<string, string> = {};
      (schemeRows as any[] || []).forEach(r => { map[r.id] = (r as any).vat_scheme || "margin"; });
      setVatSchemes(map);
    }
  }, [dealerId]);

  useEffect(() => { void load(); }, [load]);

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

  const removeCost = async (id: string) => {
    const { error } = await supabase.from("vehicle_costs" as any).delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cost removed" });
    if (selectedListing) openListing(selectedListing);
    load();
  };

  const updateScheme = async (listingId: string, scheme: string) => {
    setVatSchemes(prev => ({ ...prev, [listingId]: scheme }));
    const { error } = await supabase.from("car_listings").update({ vat_scheme: scheme } as any).eq("id", listingId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "VAT scheme updated" });
  };

  // VAT calc helpers
  const calcVatDue = (scheme: string, purchase: number, additional: number, inputVat: number, salePrice: number | null) => {
    const sale = salePrice || 0;
    if (scheme === "margin") {
      const margin = Math.max(sale - purchase, 0);
      return margin > 0 ? +((margin * 19) / 119).toFixed(2) : 0;
    }
    if (scheme === "standard") {
      const outputVat = sale > 0 ? +((sale * 19) / 119).toFixed(2) : 0;
      return +(outputVat - inputVat).toFixed(2);
    }
    return 0;
  };

  const calcNetProfit = (scheme: string, purchase: number, additional: number, inputVat: number, salePrice: number | null) => {
    if (!salePrice) return null;
    const vatDue = calcVatDue(scheme, purchase, additional, inputVat, salePrice);
    // Gross profit = sale - all recorded costs - estimated German VAT liability.
    return +(salePrice - purchase - additional - vatDue).toFixed(2);
  };

  const totalRealisedProfit = rows.reduce((s, r) => {
    if (!r.sale_price) return s;
    const scheme = vatSchemes[r.listing_id] || "margin";
    const np = calcNetProfit(scheme, Number(r.purchase_cost), Number(r.additional_costs), Number(r.total_vat), Number(r.sale_price));
    return s + (np || 0);
  }, 0);
  const totalVatLiability = rows.reduce((s, r) => {
    const scheme = vatSchemes[r.listing_id] || "margin";
    return s + calcVatDue(scheme, Number(r.purchase_cost), Number(r.additional_costs), Number(r.total_vat), r.sale_price ? Number(r.sale_price) : 0);
  }, 0);
  const totalInStock = rows.filter(r => !r.sale_price).reduce((s, r) => s + Number(r.total_costs), 0);

  // Selected listing breakdown
  const selScheme = selectedListing ? (vatSchemes[selectedListing.listing_id] || "margin") : "margin";
  const selVatDue = selectedListing ? calcVatDue(selScheme, Number(selectedListing.purchase_cost), Number(selectedListing.additional_costs), Number(selectedListing.total_vat), selectedListing.sale_price ? Number(selectedListing.sale_price) : Number(selectedListing.asking_price)) : 0;
  const selNetProfit = selectedListing ? (selectedListing.sale_price
    ? calcNetProfit(selScheme, Number(selectedListing.purchase_cost), Number(selectedListing.additional_costs), Number(selectedListing.total_vat), Number(selectedListing.sale_price))
    : (Number(selectedListing.asking_price) - Number(selectedListing.total_costs) - selVatDue)) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Costs, VAT & Profit per Vehicle</CardTitle>
        <p className="text-xs text-muted-foreground">Track every expense (purchase, repairs, transport, HU/AU, valeting, finance) and see live VAT due and net profit per car.</p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Vehicles tracked</p><p className="font-display text-xl font-bold">{rows.length}</p></div>
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Capital in stock</p><p className="font-display text-xl font-bold">€{totalInStock.toLocaleString()}</p></div>
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Est. VAT liability</p><p className="font-display text-xl font-bold">€{totalVatLiability.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Net profit (sold)</p><p className={`font-display text-xl font-bold ${totalRealisedProfit >= 0 ? "text-success" : "text-destructive"}`}>€{totalRealisedProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
        </div>

        <div className="space-y-2">
          {rows.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center"><Car className="h-10 w-10 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Add stock to your inventory to start tracking costs</p></div>
          )}
          {rows.map(r => {
            const scheme = vatSchemes[r.listing_id] || "margin";
            const vatDue = calcVatDue(scheme, Number(r.purchase_cost), Number(r.additional_costs), Number(r.total_vat), r.sale_price ? Number(r.sale_price) : Number(r.asking_price));
            const netProfit = r.sale_price
              ? calcNetProfit(scheme, Number(r.purchase_cost), Number(r.additional_costs), Number(r.total_vat), Number(r.sale_price))
              : Number(r.asking_price) - Number(r.total_costs) - vatDue;
            return (
              <div key={r.listing_id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm hover:border-primary/40 cursor-pointer" onClick={() => openListing(r)}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.year} {r.make} {r.model}</p>
                  <p className="text-xs text-muted-foreground">
                    Asking €{Number(r.asking_price).toLocaleString()} · Purchase €{Number(r.purchase_cost).toLocaleString()} · Expenses €{Number(r.additional_costs).toLocaleString()} · VAT due €{vatDue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-[10px] capitalize">{scheme} scheme</Badge>
                  {r.sale_price ? (
                    <Badge className={(netProfit ?? 0) >= 0 ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}>{(netProfit ?? 0) >= 0 ? "+" : ""}€{(netProfit ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Badge>
                  ) : (
                    <Badge variant="outline">~€{netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} fcst</Badge>
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
                {/* VAT scheme selector */}
                <div className="rounded-lg border border-border p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold">VAT scheme for this vehicle</h4>
                      <p className="text-xs text-muted-foreground">Determines how VAT due is calculated on sale.</p>
                    </div>
                    <Select value={selScheme} onValueChange={(v) => updateScheme(selectedListing.listing_id, v)}>
                      <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VAT_SCHEMES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground"><Info className="mt-0.5 h-3 w-3 shrink-0" /> {VAT_SCHEMES.find(s => s.value === selScheme)?.hint}</p>
                </div>

                {/* Breakdown grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded border border-border p-2"><p className="text-xs text-muted-foreground">Purchase</p><p className="font-semibold">€{Number(selectedListing.purchase_cost).toLocaleString()}</p></div>
                  <div className="rounded border border-border p-2"><p className="text-xs text-muted-foreground">Expenses</p><p className="font-semibold">€{Number(selectedListing.additional_costs).toLocaleString()}</p></div>
                  <div className="rounded border border-border p-2"><p className="text-xs text-muted-foreground">{selectedListing.sale_price ? "Sale price" : "Asking"}</p><p className="font-semibold">€{Number(selectedListing.sale_price || selectedListing.asking_price).toLocaleString()}</p></div>
                  <div className="rounded border border-border p-2"><p className="text-xs text-muted-foreground">VAT due</p><p className="font-semibold">€{selVatDue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p></div>
                </div>

                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Net profit {selectedListing.sale_price ? "(actual)" : "(forecast at asking)"}</span><span className={`font-bold ${(selNetProfit ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>€{(selNetProfit ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                  <p className="mt-1 text-[11px] text-muted-foreground">Sale − Purchase − Expenses − VAT due</p>
                </div>

                {/* Add cost form */}
                <div className="rounded-lg border border-border p-3">
                  <h4 className="mb-2 text-sm font-semibold">Add Expense</h4>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Select value={costForm.category} onValueChange={v => setCostForm({ ...costForm, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{COST_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="Amount € (gross)" type="number" step="0.01" value={costForm.amount} onChange={e => setCostForm({ ...costForm, amount: e.target.value })} />
                    <Input placeholder="Input VAT € (opt)" type="number" step="0.01" value={costForm.vat_amount} onChange={e => setCostForm({ ...costForm, vat_amount: e.target.value })} />
                    <Input placeholder="Description" value={costForm.description} onChange={e => setCostForm({ ...costForm, description: e.target.value })} />
                    <Input placeholder="Supplier" value={costForm.supplier} onChange={e => setCostForm({ ...costForm, supplier: e.target.value })} />
                    <Input placeholder="Invoice ref" value={costForm.invoice_ref} onChange={e => setCostForm({ ...costForm, invoice_ref: e.target.value })} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{COST_CATEGORIES.find(c => c.value === costForm.category)?.hint}</p>
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" onClick={addCost} className="gradient-primary border-0"><Plus className="mr-1 h-3 w-3" /> Add Expense</Button>
                  </div>
                </div>

                {/* Cost history */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold flex items-center gap-2"><Receipt className="h-4 w-4" /> Expense History</h4>
                  {costsForListing.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No expenses recorded yet</p>
                  ) : (
                    <div className="space-y-1.5">
                      {costsForListing.map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between rounded border border-border p-2 text-sm">
                          <div className="min-w-0 flex-1">
                            <Badge variant="outline" className="mr-2 capitalize">{COST_CATEGORIES.find(cc => cc.value === c.category)?.label || c.category}</Badge>
                            <span>{c.description || "—"}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{c.supplier || ""} {c.supplier ? "·" : ""} {new Date(c.cost_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="font-semibold">€{Number(c.amount).toLocaleString()}</div>
                              {Number(c.vat_amount) > 0 && <div className="text-[10px] text-muted-foreground">incl. €{Number(c.vat_amount).toLocaleString()} VAT</div>}
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeCost(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
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
