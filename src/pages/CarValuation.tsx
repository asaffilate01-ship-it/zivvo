import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Car, TrendingUp, TrendingDown, Gauge, ArrowRight, Calculator } from "lucide-react";
import { motion } from "framer-motion";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice, formatDistance } from "@/lib/countryConfig";
import { Link } from "react-router-dom";

const currentYear = new Date().getFullYear();

const CarValuation = () => {
  const { t } = useTranslation();
  const { config } = useCountry();
  const [form, setForm] = useState({ make: "", model: "", year: String(currentYear - 3), mileage: "30000", fuel_type: "", transmission: "", body_type: "" });
  const [result, setResult] = useState<null | { low: number; mid: number; high: number; factors: string[] }>(null);
  const [loading, setLoading] = useState(false);

  const handleValuation = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulated valuation algorithm based on depreciation curves
    setTimeout(() => {
      const age = currentYear - parseInt(form.year);
      const miles = parseInt(form.mileage) || 30000;

      // Base price estimate by make tier
      const premiumMakes = ["BMW", "Mercedes-Benz", "Audi", "Porsche", "Land Rover", "Jaguar", "Lexus", "Volvo"];
      const luxuryMakes = ["Bentley", "Rolls-Royce", "Ferrari", "Lamborghini", "Maserati", "McLaren", "Aston Martin"];
      const basePriceMap = luxuryMakes.includes(form.make) ? 80000 : premiumMakes.includes(form.make) ? 35000 : 18000;

      // Depreciation: ~15% year 1, ~10% year 2-3, ~8% year 4-5, ~5% after
      let depreciatedValue = basePriceMap;
      for (let y = 0; y < age; y++) {
        const rate = y === 0 ? 0.15 : y < 3 ? 0.10 : y < 5 ? 0.08 : 0.05;
        depreciatedValue *= (1 - rate);
      }

      // Mileage adjustment: -€0.05 per mile over avg, +€0.03 per mile under
      const avgMiles = age * 10000;
      const mileDiff = miles - avgMiles;
      const mileAdj = mileDiff > 0 ? -mileDiff * 0.05 : -mileDiff * 0.03;
      depreciatedValue += mileAdj;

      // Fuel premium/discount
      if (form.fuel_type === "Electric") depreciatedValue *= 1.12;
      if (form.fuel_type === "Hybrid") depreciatedValue *= 1.08;
      if (form.fuel_type === "Diesel" && age < 5) depreciatedValue *= 0.95;

      // Transmission premium
      if (form.transmission === "Automatic") depreciatedValue *= 1.05;

      const mid = Math.max(500, Math.round(depreciatedValue));
      const low = Math.round(mid * 0.85);
      const high = Math.round(mid * 1.15);

      const factors: string[] = [];
      if (miles > avgMiles * 1.3) factors.push(t("carValuation.factors.highMileage"));
      if (miles < avgMiles * 0.7) factors.push(t("carValuation.factors.lowMileage"));
      if (form.fuel_type === "Electric") factors.push(t("carValuation.factors.electric"));
      if (form.fuel_type === "Diesel" && age < 5) factors.push(t("carValuation.factors.diesel"));
      if (age <= 2) factors.push(t("carValuation.factors.nearlyNew"));
      if (age >= 8) factors.push(t("carValuation.factors.older"));
      if (premiumMakes.includes(form.make)) factors.push(t("carValuation.factors.premiumBrand"));

      setResult({ low, mid, high, factors });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t("carValuation.seo.title")} description={t("carValuation.seo.description")} />
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4 text-xs">{t("carValuation.badge")}</Badge>
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            {t("carValuation.title1")}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> {t("carValuation.title2")}</span>
          </h1>
          <p className="mt-3 text-muted-foreground">{t("carValuation.subtitle")}</p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleValuation} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("carValuation.form.make")} *</Label>
                    <Select value={form.make} onValueChange={(v) => setForm((p) => ({ ...p, make: v }))}>
                      <SelectTrigger><SelectValue placeholder={t("carValuation.form.selectMake")} /></SelectTrigger>
                      <SelectContent>
                        {config.makes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("carValuation.form.model")} *</Label>
                    <Input required placeholder={t("carValuation.form.modelPlaceholder")} value={form.model} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>{t("carValuation.form.year")} *</Label>
                    <Input type="number" required min={1990} max={currentYear} value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("carValuation.form.mileage")} *</Label>
                    <Input type="number" required placeholder="30000" value={form.mileage} onChange={(e) => setForm((p) => ({ ...p, mileage: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("carValuation.form.fuelType")}</Label>
                    <Select value={form.fuel_type} onValueChange={(v) => setForm((p) => ({ ...p, fuel_type: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {config.fuelTypes.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("carValuation.form.transmission")}</Label>
                    <Select value={form.transmission} onValueChange={(v) => setForm((p) => ({ ...p, transmission: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {config.transmissions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("carValuation.form.bodyType")}</Label>
                    <Select value={form.body_type} onValueChange={(v) => setForm((p) => ({ ...p, body_type: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {config.bodyTypes.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full gradient-primary border-0" disabled={loading || !form.make || !form.model}>
                  {loading ? (
                    <>
                      <Calculator className="mr-2 h-4 w-4 animate-spin" /> {t("carValuation.form.calculating")}
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-2 h-4 w-4" /> {t("carValuation.form.submit")}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
              <Card className="border-primary/30 overflow-hidden">
                <div className="gradient-primary px-6 py-4">
                  <p className="text-sm text-primary-foreground/80">{t("carValuation.result.estimatedFor")}</p>
                  <h2 className="font-display text-xl font-bold text-primary-foreground">
                    {form.year} {form.make} {form.model}
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-xl bg-muted/50 p-4">
                      <TrendingDown className="mx-auto h-5 w-5 text-muted-foreground" />
                      <p className="mt-1 text-xs text-muted-foreground">{t("carValuation.result.tradeIn")}</p>
                      <p className="font-display text-lg font-bold text-foreground">{formatPrice(result.low, config)}</p>
                    </div>
                    <div className="rounded-xl border-2 border-primary bg-primary/5 p-4">
                      <Car className="mx-auto h-5 w-5 text-primary" />
                      <p className="mt-1 text-xs text-primary">{t("carValuation.result.marketValue")}</p>
                      <p className="font-display text-2xl font-bold text-primary">{formatPrice(result.mid, config)}</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-4">
                      <TrendingUp className="mx-auto h-5 w-5 text-muted-foreground" />
                      <p className="mt-1 text-xs text-muted-foreground">{t("carValuation.result.privateSale")}</p>
                      <p className="font-display text-lg font-bold text-foreground">{formatPrice(result.high, config)}</p>
                    </div>
                  </div>

                  {result.factors.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-foreground">{t("carValuation.result.keyFactors")}</h3>
                      <ul className="mt-2 space-y-1">
                        {result.factors.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <Link to="/sell" className="flex-1">
                      <Button className="w-full gradient-primary border-0">
                        {t("carValuation.result.sellYourCar")} <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to={`/browse?make=${form.make}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        {t("carValuation.result.compareSimilar")}
                      </Button>
                    </Link>
                  </div>

                  <p className="mt-4 text-[10px] text-center text-muted-foreground">
                    {t("carValuation.result.disclaimer")}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CarValuation;
