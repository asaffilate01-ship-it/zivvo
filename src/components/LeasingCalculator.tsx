import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calculator, Euro } from "lucide-react";

/**
 * Leasing-Rechner (Kilometerleasing).
 * Vereinfachte Formel im Stil deutscher Anbieter (Sixt Leasing, ALD, LeasePlan):
 *   Monatsrate ≈ ((Nettopreis - Restwert) / Laufzeit) + Zinsanteil
 * Zinsanteil = ((Nettopreis + Restwert) / 2) * (effZins / 12)
 * Anzahlung reduziert den Nettopreis 1:1.
 */
const LeasingCalculator = () => {
  const [price, setPrice] = useState(35000);
  const [down, setDown] = useState(3000);
  const [months, setMonths] = useState(36);
  const [kmPerYear, setKmPerYear] = useState(15000);
  const [rate, setRate] = useState(4.9); // eff. Jahreszins %

  const { monthly, residual, totalCost, interestPart } = useMemo(() => {
    // Restwertkurve grob nach dt. Marktwerten (Schwacke-orientiert)
    const kmFactor = kmPerYear <= 10000 ? 0.02 : kmPerYear <= 15000 ? 0.03 : kmPerYear <= 20000 ? 0.04 : 0.05;
    const monthlyDepreciation = kmFactor / 12;
    const residualPct = Math.max(0.25, 1 - monthlyDepreciation * months);
    const residual = Math.round(price * residualPct);

    const netFinanced = Math.max(0, price - down);
    const depreciation = (netFinanced - residual * (netFinanced / price)) / months;
    const interestPart = ((netFinanced + residual) / 2) * (rate / 100 / 12);
    const monthly = Math.max(0, depreciation + interestPart);
    const totalCost = monthly * months + down;

    return {
      monthly: Math.round(monthly),
      residual,
      totalCost: Math.round(totalCost),
      interestPart: Math.round(interestPart),
    };
  }, [price, down, months, kmPerYear, rate]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Calculator className="h-5 w-5 text-primary" /> Leasing-Rechner
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-5">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Fahrzeugpreis</Label>
            <div className="relative mt-1">
              <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                value={price}
                min={5000}
                max={250000}
                step={500}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Anzahlung: {fmt(down)}
            </Label>
            <Slider
              value={[down]}
              onValueChange={(v) => setDown(v[0])}
              min={0}
              max={Math.min(price, 30000)}
              step={500}
              className="mt-3"
            />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Laufzeit: {months} Monate
            </Label>
            <Slider
              value={[months]}
              onValueChange={(v) => setMonths(v[0])}
              min={12}
              max={60}
              step={6}
              className="mt-3"
            />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Kilometer/Jahr: {kmPerYear.toLocaleString("de-DE")} km
            </Label>
            <Slider
              value={[kmPerYear]}
              onValueChange={(v) => setKmPerYear(v[0])}
              min={5000}
              max={40000}
              step={2500}
              className="mt-3"
            />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Eff. Jahreszins: {rate.toFixed(1)}%
            </Label>
            <Slider
              value={[rate]}
              onValueChange={(v) => setRate(v[0])}
              min={0.9}
              max={9.9}
              step={0.1}
              className="mt-3"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Monatliche Leasingrate</p>
          <p className="mt-1 font-display text-4xl font-bold text-primary">{fmt(monthly)}</p>
          <p className="mt-1 text-xs text-muted-foreground">zzgl. MwSt. für Gewerbekunden</p>

          <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <Row label="Kalkulierter Restwert" value={fmt(residual)} />
            <Row label="Zinsanteil / Monat" value={fmt(interestPart)} />
            <Row label="Gesamtaufwand" value={fmt(totalCost)} />
            <Row label="Anzahlung" value={fmt(down)} />
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[10px]">Kilometerleasing</Badge>
            <Badge variant="secondary" className="text-[10px]">Ohne Schlussrate</Badge>
            <Badge variant="secondary" className="text-[10px]">GAP-Schutz optional</Badge>
          </div>

          <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
            Repräsentatives Beispiel. Unverbindliche Berechnung — kein Angebot i. S. d. § 6a PAngV.
            Bonität vorausgesetzt. Endgültige Konditionen richten sich nach dem Leasinggeber.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

export default LeasingCalculator;
