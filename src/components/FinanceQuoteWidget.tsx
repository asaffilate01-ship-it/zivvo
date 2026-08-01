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

interface FinanceQuoteWidgetProps {
  carPrice: number;
  carTitle: string;
  listingId: string;
}

const FinanceQuoteWidget = ({ carPrice, carTitle, listingId }: FinanceQuoteWidgetProps) => {
  const { config } = useCountry();
  const { toast } = useToast();
  const [mode, setMode] = useState<"finance" | "insurance">("finance");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", deposit: "20", term: "48" });

  const depositAmount = carPrice * (parseInt(form.deposit) / 100);
  const loanAmount = carPrice - depositAmount;
  const apr = 6.9;
  const monthlyRate = apr / 100 / 12;
  const months = parseInt(form.term);
  const monthly = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast({ title: `${mode === "finance" ? "Finance" : "Insurance"} quote request sent!`, description: "A specialist will contact you shortly." });
  };

  if (submitted) {
    return (
      <Card className="border-success/30">
        <CardContent className="flex flex-col items-center py-8 text-center">
          <CheckCircle className="h-10 w-10 text-success" />
          <h3 className="mt-3 font-display font-semibold text-card-foreground">Quote Request Sent</h3>
          <p className="mt-1 text-sm text-muted-foreground">We'll be in touch within 24 hours with your personalised {mode} quote.</p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => setSubmitted(false)}>Request Another</Button>
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
            <Banknote className="mr-1 h-4 w-4" /> Finance
          </Button>
          <Button
            variant={mode === "insurance" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("insurance")}
            className={mode === "insurance" ? "gradient-primary border-0" : ""}
          >
            <Shield className="mr-1 h-4 w-4" /> Insurance
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {mode === "finance" && (
          <div className="mb-4 rounded-lg bg-primary/5 p-3 text-center">
            <p className="text-xs text-muted-foreground">Estimated Monthly Payment</p>
            <p className="font-display text-2xl font-bold text-primary">{formatPrice(Math.round(monthly), config)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            <p className="text-[10px] text-muted-foreground">{form.deposit}% deposit · {form.term} months · {apr}% APR representative</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "finance" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Deposit %</Label>
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
                <Label className="text-xs">Term</Label>
                <Select value={form.term} onValueChange={(v) => setForm((p) => ({ ...p, term: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["24", "36", "48", "60"].map((t) => (
                      <SelectItem key={t} value={t}>{t} months</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs">Full Name</Label>
            <Input className="h-8 text-sm" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input type="email" className="h-8 text-sm" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Phone</Label>
            <Input className="h-8 text-sm" required value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </div>

          <Button type="submit" className="w-full gradient-primary border-0 text-sm">
            Get {mode === "finance" ? "Finance" : "Insurance"} Quote
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            {mode === "finance" ? "Representative example. Rates may vary based on credit history." : "Quotes from leading providers. No obligation."}
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default FinanceQuoteWidget;
