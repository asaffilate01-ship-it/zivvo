import { useState } from "react";
import { ArrowLeftRight, Calculator, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import { supabase } from "@/integrations/supabase/client";

interface Props { targetPrice?: number }
type Comparison = { available: boolean; market_average?: number; sample_size: number; warning?: string };

const PartExchangeWidget = ({ targetPrice }: Props) => {
  const { config } = useCountry();
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({ make: "", model: "", year: String(currentYear - 4) });
  const [result, setResult] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const compare = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true); setError(""); setResult(null);
    const { data, error: functionError } = await supabase.functions.invoke<Comparison>("price-check", {
      body: { make: form.make, model: form.model.trim(), year: Number(form.year) },
    });
    if (functionError || !data) setError("Vergleich momentan nicht verfügbar.");
    else setResult(data);
    setLoading(false);
  };

  const remaining = result?.market_average !== undefined && targetPrice ? Math.max(0, targetPrice - result.market_average) : null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><ArrowLeftRight className="h-4 w-4 text-primary" /> Inzahlungnahme einordnen</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={compare} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1"><Label className="text-xs">Marke</Label><Select value={form.make} onValueChange={(make) => setForm((previous) => ({ ...previous, make }))}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Marke" /></SelectTrigger><SelectContent>{config.makes.map((make) => <SelectItem key={make} value={make}>{make}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Modell</Label><Input required maxLength={120} className="h-9 text-xs" value={form.model} onChange={(event) => setForm((previous) => ({ ...previous, model: event.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">Baujahr</Label><Input required type="number" min={1886} max={currentYear + 1} className="h-9 text-xs" value={form.year} onChange={(event) => setForm((previous) => ({ ...previous, year: event.target.value }))} /></div>
          </div>
          <Button type="submit" className="w-full" disabled={loading || !form.make || !form.model.trim()}><Calculator className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />{loading ? "Vergleich lädt …" : "Angebotspreise vergleichen"}</Button>
        </form>
        {error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
        {result && !result.available && <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground"><Database className="mr-1 inline h-3.5 w-3.5" />Noch zu wenige aktive Vergleichsangebote (gefunden: {result.sample_size}).</div>}
        {result?.available && result.market_average !== undefined && <div className="mt-4 rounded-lg bg-primary/5 p-4"><p className="text-xs text-muted-foreground">Median aktiver Zivvo-Angebote</p><p className="text-xl font-bold text-primary">{formatPrice(result.market_average, config)}</p>{remaining !== null && <p className="mt-1 text-xs text-muted-foreground">Rechnerische Differenz zum ausgewählten Fahrzeug: {formatPrice(remaining, config)}</p>}<p className="mt-2 text-[10px] text-muted-foreground">Keine Inzahlungnahme-Zusage. Zustand, Ausstattung und Händlerangebot sind nicht berücksichtigt.</p></div>}
      </CardContent>
    </Card>
  );
};

export default PartExchangeWidget;
