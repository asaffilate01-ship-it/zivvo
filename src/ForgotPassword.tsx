import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CheckCircle, Zap, Calendar, Percent, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LeasingCalculator from "@/components/LeasingCalculator";

const Finance = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    amount: "",
    term: "48",
    vehicle: "",
    downpayment: "",
    consent: false,
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consent) return;
    setLoading(true);
    const { error } = await supabase.functions.invoke("contact-submit", { body: {
      name: form.name,
      email: form.email,
      subject: "Finanzierungsanfrage",
      message: `Betrag: €${form.amount}\nLaufzeit: ${form.term} Monate\nAnzahlung: €${form.downpayment || "0"}\nFahrzeug: ${form.vehicle || "—"}\nTelefon: ${form.phone}`,
    } });
    setLoading(false);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: t("finance.form.success") });
  };

  const features = [
    { icon: Zap, key: "quick" },
    { icon: Calendar, key: "flexible" },
    { icon: Percent, key: "rates" },
    { icon: ShieldCheck, key: "noFee" },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t("finance.title")} description={t("finance.subtitle")} />
      <Navbar />

      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="gradient-primary border-0 text-primary-foreground gap-1.5">
              <Percent className="h-3 w-3" /> {t("finance.title")}
            </Badge>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              {t("finance.title")}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{t("finance.intro")}</p>
            <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
              {t("finance.partners")}
            </p>
            <p className="mt-1 font-display text-sm text-foreground">
              {t("finance.partnerList")}
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, key }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 font-display font-semibold text-card-foreground">
                      {t(`finance.features.${key}`)}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(`finance.features.${key}Desc`)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pt-12">
        <div className="mx-auto max-w-4xl">
          <LeasingCalculator />
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="font-display text-2xl font-bold text-foreground">
                {t("finance.form.title")}
              </h2>
              {submitted ? (
                <div className="mt-6 flex items-start gap-3 rounded-lg border border-success/40 bg-success/10 p-4 text-success">
                  <CheckCircle className="mt-0.5 h-5 w-5" />
                  <p className="text-sm">{t("finance.form.success")}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="fin-name">{t("finance.form.name")}</Label>
                    <Input id="fin-name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="fin-email">{t("finance.form.email")}</Label>
                    <Input id="fin-email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="fin-phone">{t("finance.form.phone")}</Label>
                    <Input id="fin-phone" required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="fin-amount">{t("finance.form.amount")}</Label>
                    <Input id="fin-amount" type="number" min="500" required value={form.amount} onChange={(e) => set("amount", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="fin-term">{t("finance.form.term")}</Label>
                    <Input id="fin-term" type="number" min="12" max="84" required value={form.term} onChange={(e) => set("term", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="fin-vehicle">{t("finance.form.vehicle")}</Label>
                    <Input id="fin-vehicle" value={form.vehicle} onChange={(e) => set("vehicle", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="fin-down">{t("finance.form.downpayment")}</Label>
                    <Input id="fin-down" type="number" min="0" value={form.downpayment} onChange={(e) => set("downpayment", e.target.value)} />
                  </div>
                  <div className="sm:col-span-2 flex items-start gap-2">
                    <Checkbox id="fin-consent" checked={form.consent} onCheckedChange={(v) => set("consent", Boolean(v))} />
                    <Label htmlFor="fin-consent" className="text-xs leading-relaxed text-muted-foreground">
                      {t("finance.form.consent")}
                    </Label>
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" size="lg" className="gradient-primary w-full border-0" disabled={loading || !form.consent}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {t("finance.form.submit")}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Finance;
