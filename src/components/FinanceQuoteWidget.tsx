import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Banknote, Shield, CheckCircle } from "lucide-react";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface FinanceQuoteWidgetProps {
  carPrice: number;
  carTitle: string;
  listingId: string;
}

const FinanceQuoteWidget = ({ carPrice, carTitle, listingId }: FinanceQuoteWidgetProps) => {
  const { config } = useCountry();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isGerman = i18n.language?.startsWith("de");
  const [mode, setMode] = useState<"finance" | "insurance">("finance");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", deposit: "20", term: "48", apr: "6.9" });

  const depositAmount = carPrice * (parseInt(form.deposit) / 100);
  const loanAmount = carPrice - depositAmount;
  const apr = Math.max(0, Number(form.apr) || 0);
  const monthlyRate = apr / 100 / 12;
  const months = Math.max(1, parseInt(form.term) || 1);
  const monthly = monthlyRate === 0
    ? loanAmount / months
    : loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const subject = `${mode === "finance" ? "Finanzierungs" : "Versicherungs"}anfrage: ${carTitle}`;
    const message = [
      `Inserat: ${carTitle} (${listingId})`,
      `Fahrzeugpreis: ${formatPrice(carPrice, config)}`,
      `Telefon: ${form.phone}`,
      mode === "finance" ? `Rechenannahmen: ${form.deposit}% Anzahlung, ${form.term} Monate, ${form.apr}% effektiver Jahreszins` : "Anfrageart: Versicherung",
      "Hinweis: Die Person bittet um Kontakt. Es wurde kein Kredit- oder Versicherungsangebot zugesagt.",
    ].join("\n");
    const { error } = await supabase.functions.invoke("contact-submit", {
      body: { name: form.name, email: form.email, subject, message },
    });
    setLoading(false);
    if (error) {
      toast({ title: isGerman ? "Anfrage nicht gesendet" : "Request not sent", description: error.message, variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: isGerman ? "Anfrage übermittelt" : "Request submitted", description: isGerman ? "Das Plattformteam hat die Anfrage erhalten. Ein Angebot ist nicht garantiert." : "The platform team received the request. An offer is not guaranteed." });
  };

  if (submitted) {
    return (
      <Card className="border-success/30">
        <CardContent className="flex flex-col items-center py-8 text-center">
          <CheckCircle className="h-10 w-10 text-success" />
          <h3 className="mt-3 font-display font-semibold text-card-foreground">{isGerman ? "Anfrage übermittelt" : "Request submitted"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{isGerman ? "Das Plattformteam prüft die Anfrage. Antwort, Verfügbarkeit und Konditionen sind nicht garantiert." : "The platform team will review it. A response, availability, and terms are not guaranteed."}</p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => setSubmitted(false)}>{isGerman ? "Weitere Anfrage" : "Another request"}</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex gap-2">
          <Button
            variant={mode === "finance" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("finance")}
            className={mode === "finance" ? "gradient-primary border-0" : ""}
          >
            <Banknote className="mr-1 h-4 w-4" /> {isGerman ? "Finanzierung" : "Finance"}
          </Button>
          <Button
            variant={mode === "insurance" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("insurance")}
            className={mode === "insurance" ? "gradient-primary border-0" : ""}
          >
            <Shield className="mr-1 h-4 w-4" /> {isGerman ? "Versicherung" : "Insurance"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {mode === "finance" && (
          <div className="mb-4 rounded-lg bg-primary/5 p-3 text-center">
            <p className="text-xs text-muted-foreground">{isGerman ? "Unverbindliche Monatsrate" : "Illustrative monthly payment"}</p>
            <p className="font-display text-2xl font-bold text-primary">{formatPrice(Math.round(monthly), config)}<span className="text-sm font-normal text-muted-foreground">/{isGerman ? "Monat" : "mo"}</span></p>
            <p className="text-[10px] text-muted-foreground">{form.deposit}% {isGerman ? "Anzahlung" : "deposit"} · {form.term} {isGerman ? "Monate" : "months"} · {apr}% {isGerman ? "Beispielzins" : "example APR"}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "finance" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isGerman ? "Anzahlung %" : "Deposit %"}</Label>
                <Select value={form.deposit} onValueChange={(v) => setForm((p) => ({ ...p, deposit: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["10", "15", "20", "25", "30", "40", "50"].map((d) => (
                      <SelectItem key={d} value={d}>{d}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{isGerman ? "Laufzeit" : "Term"}</Label>
                <Select value={form.term} onValueChange={(v) => setForm((p) => ({ ...p, term: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["24", "36", "48", "60"].map((t) => (
                      <SelectItem key={t} value={t}>{t} {isGerman ? "Monate" : "months"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">{isGerman ? "Effektiver Jahreszins für das Rechenbeispiel %" : "Example APR %"}</Label>
                <Input type="number" min="0" max="50" step="0.1" className="h-8 text-sm" value={form.apr} onChange={(e) => setForm((p) => ({ ...p, apr: e.target.value }))} />
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs">{isGerman ? "Vollständiger Name" : "Full name"}</Label>
            <Input className="h-8 text-sm" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">E-Mail</Label>
            <Input type="email" className="h-8 text-sm" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">{isGerman ? "Telefon" : "Phone"}</Label>
            <Input className="h-8 text-sm" required value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </div>

          <Button type="submit" className="w-full gradient-primary border-0 text-sm" disabled={loading}>
            {loading ? (isGerman ? "Wird gesendet…" : "Sending…") : (isGerman ? "Unverbindliche Anfrage senden" : "Send non-binding request")}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            {isGerman ? "Kein Kredit- oder Versicherungsangebot. Anbieter, Verfügbarkeit und Konditionen werden erst nach gesonderter Prüfung bestätigt." : "Not a credit or insurance offer. Provider, availability, and terms are confirmed only after a separate review."}
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default FinanceQuoteWidget;
