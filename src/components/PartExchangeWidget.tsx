import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, Calculator, CheckCircle } from "lucide-react";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";

interface Props {
  targetPrice?: number;
}

const PartExchangeWidget = ({ targetPrice }: Props) => {
  const { config } = useCountry();
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({ make: "", model: "", year: String(currentYear - 4), mileage: "40000" });
  const [result, setResult] = useState<{ value: number; remaining: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const age = currentYear - parseInt(form.year);
      const miles = parseInt(form.mileage) || 40000;
      const premiumMakes = ["BMW", "Mercedes-Benz", "Audi", "Porsche", "Land Rover", "Jaguar", "Lexus", "Volvo"];
      const base = premiumMakes.includes(form.make) ? 30000 : 15000;

      let value = base;
      for (let y = 0; y < age; y++) {
        const rate = y === 0 ? 0.18 : y < 3 ? 0.12 : y < 5 ? 0.09 : 0.06;
        value *= (1 - rate);
      }

      const avgMiles = age * 10000;
      const mileDiff = miles - avgMiles;
      value += mileDiff > 0 ? -mileDiff * 0.04 : -mileDiff * 0.02;
      value = Math.max(300, Math.round(value * 0.85)); // trade-in discount

      const remaining = targetPrice ? Math.max(0, targetPrice - value) : 0;
      setResult({ value, remaining });
      setLoading(false);
    }, 1000);
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowLeftRight className="h-4 w-4 text-primary" />
          Part-Exchange Estimator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCalculate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Your Car's Make</Label>
              <Select value={form.make} onValueChange={(v) => setForm((p) => ({ ...p, make: v }))}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Make" />
                </SelectTrigger>
                <SelectContent>
                  {config.makes.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Model</Label>
              <Input
                placeholder="e.g. Golf"
                value={form.model}
                onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Year</Label>
              <Input
                type="number"
                min={2000}
                max={currentYear}
                value={form.year}
                onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mileage</Label>
              <Input
                type="number"
                value={form.mileage}
                onChange={(e) => setForm((p) => ({ ...p, mileage: e.target.value }))}
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary border-0 h-9 text-xs"
            disabled={loading || !form.make || !form.model}
          >
            <Calculator className="mr-1.5 h-3.5 w-3.5" />
            {loading ? "Calculating..." : "Estimate Part-Exchange"}
          </Button>
        </form>

        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 space-y-3"
          >
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
              <p className="text-xs text-muted-foreground">Your car's estimated trade-in value</p>
              <p className="font-display text-2xl font-bold text-primary">{formatPrice(result.value, config)}</p>
            </div>

            {targetPrice && targetPrice > 0 && (
              <div className="rounded-xl bg-muted/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">You'd pay approximately</p>
                <p className="font-display text-xl font-bold text-foreground">
                  {formatPrice(result.remaining, config)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">after part-exchange</p>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
              <CheckCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <p className="text-[11px] text-muted-foreground">
                This is an estimate. Final trade-in value depends on vehicle condition, service history, and inspection.
              </p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default PartExchangeWidget;
