import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Car, TrendingUp, TrendingDown, ArrowRight, Calculator, Database } from "lucide-react";
import { motion } from "framer-motion";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const currentYear = new Date().getFullYear();

type ComparableResult = {
  available: boolean;
  market_low?: number;
  market_average?: number;
  market_high?: number;
  sample_size: number;
  explanation?: string;
  warning?: string;
};

const CarValuation = () => {
  const { config } = useCountry();
  const [form, setForm] = useState({ make: "", model: "", year: String(currentYear - 3) });
  const [result, setResult] = useState<ComparableResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCompare = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    const { data, error: functionError } = await supabase.functions.invoke<ComparableResult>("price-check", {
      body: { make: form.make, model: form.model.trim(), year: Number(form.year) },
    });
    if (functionError || !data) {
      setError("Der Angebotsvergleich ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut.");
    } else {
      setResult(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Fahrzeugpreise vergleichen — Zivvo" description="Vergleichen Sie aktive Zivvo-Angebotspreise ähnlicher Fahrzeuge in Deutschland." />
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4 text-xs">Transparenter Angebotsvergleich</Badge>
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Preisniveau ähnlicher <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Fahrzeuge prüfen</span>
          </h1>
          <p className="mt-3 text-muted-foreground">Reale aktive Zivvo-Inserate statt einer erfundenen Einzelbewertung. Zustand, Ausstattung und Historie müssen Sie zusätzlich beurteilen.</p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleCompare} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Marke *</Label>
                    <Select value={form.make} onValueChange={(make) => setForm((previous) => ({ ...previous, make }))}>
                      <SelectTrigger><SelectValue placeholder="Marke wählen" /></SelectTrigger>
                      <SelectContent>{config.makes.map((make) => <SelectItem key={make} value={make}>{make}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Modell *</Label>
                    <Input required maxLength={120} placeholder="z. B. Golf" value={form.model} onChange={(event) => setForm((previous) => ({ ...previous, model: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Baujahr *</Label>
                    <Input type="number" required min={1886} max={currentYear + 1} value={form.year} onChange={(event) => setForm((previous) => ({ ...previous, year: event.target.value }))} />
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-primary border-0" disabled={loading || !form.make || !form.model.trim()}>
                  <Calculator className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Vergleich wird geladen …" : "Aktive Angebote vergleichen"}
                </Button>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              </form>
            </CardContent>
          </Card>

          {result && !result.available && (
            <Card className="mt-8 border-amber-500/30">
              <CardContent className="p-6 text-center">
                <Database className="mx-auto h-8 w-8 text-amber-600" />
                <h2 className="mt-3 font-display text-lg font-semibold">Noch zu wenige Vergleichsangebote</h2>
                <p className="mt-1 text-sm text-muted-foreground">Für eine belastbare Spanne werden mindestens drei aktive Angebote desselben Modells aus ±2 Baujahren benötigt. Aktuell gefunden: {result.sample_size}.</p>
              </CardContent>
            </Card>
          )}

          {result?.available && result.market_low !== undefined && result.market_average !== undefined && result.market_high !== undefined && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
              <Card className="overflow-hidden border-primary/30">
                <div className="gradient-primary px-6 py-4 text-primary-foreground">
                  <p className="text-sm text-primary-foreground/80">Aktive Angebotspreise für</p>
                  <h2 className="font-display text-xl font-bold">{form.year} {form.make} {form.model}</h2>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
                    <div className="rounded-xl bg-muted/50 p-4"><TrendingDown className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-1 text-xs text-muted-foreground">Unteres Quartil</p><p className="font-display text-lg font-bold">{formatPrice(result.market_low, config)}</p></div>
                    <div className="rounded-xl border-2 border-primary bg-primary/5 p-4"><Car className="mx-auto h-5 w-5 text-primary" /><p className="mt-1 text-xs text-primary">Median</p><p className="font-display text-2xl font-bold text-primary">{formatPrice(result.market_average, config)}</p></div>
                    <div className="rounded-xl bg-muted/50 p-4"><TrendingUp className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-1 text-xs text-muted-foreground">Oberes Quartil</p><p className="font-display text-lg font-bold">{formatPrice(result.market_high, config)}</p></div>
                  </div>
                  <p className="mt-5 text-sm text-muted-foreground">{result.explanation} Berücksichtigt werden Angebotspreise, keine Verkaufspreise. Stichprobe: {result.sample_size}.</p>
                  <p className="mt-2 text-xs text-muted-foreground">{result.warning}</p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link to="/sell" className="flex-1"><Button className="w-full gradient-primary border-0">Fahrzeug inserieren <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
                    <Link to={`/browse?make=${encodeURIComponent(form.make)}&model=${encodeURIComponent(form.model)}`} className="flex-1"><Button variant="outline" className="w-full">Vergleichsangebote ansehen</Button></Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CarValuation;
