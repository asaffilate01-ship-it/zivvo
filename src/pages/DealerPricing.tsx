import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check, Zap, Star, ArrowRight, Loader2, User as UserIcon,
  Sparkles, ShieldCheck, BarChart3, Headphones, Globe2, ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import SEOHead from "@/components/SEOHead";

const partners = ["mobile.de", "AutoScout24", "Kleinanzeigen", "AUTO1.com", "eBay Motors"];

const DealerPricing = () => {
  const { t } = useTranslation();
  const { user, subscription } = useAuth();
  const { config } = useCountry();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [showBusinessDialog, setShowBusinessDialog] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState("");
  const [businessName, setBusinessName] = useState("");

  const dealerPlan = config.dealerPlans[0];
  const privatePlan = config.individualPlan;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "canceled") {
      toast({ title: t("pricing.toast.canceledTitle"), description: t("pricing.toast.canceledDesc") });
    }
  }, []);

  const handleSubscribe = async (priceId: string) => {
    if (!user) { navigate("/signup"); return; }
    setSelectedPriceId(priceId);
    setShowBusinessDialog(true);
  };

  const handleCheckout = async () => {
    if (!businessName.trim()) {
      toast({ title: t("pricing.dialog.businessNameRequired"), variant: "destructive" });
      return;
    }
    setLoading(selectedPriceId);
    setShowBusinessDialog(false);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId: selectedPriceId,
          businessName,
          successUrl: `${window.location.origin}/dashboard?checkout=success`,
          cancelUrl: `${window.location.origin}/dealers?checkout=canceled`,
        },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: t("pricing.toast.errorTitle"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const faqs = [
    { q: t("pricing.faq.q1"), a: t("pricing.faq.a1") },
    { q: t("pricing.faq.q2"), a: t("pricing.faq.a2") },
    { q: t("pricing.faq.q3"), a: t("pricing.faq.a3") },
    { q: t("pricing.faq.q4"), a: t("pricing.faq.a4") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${t("pricing.hero.title")} — Zivvo`}
        description={`${t("pricing.dealer.headline")}. ${t("pricing.hero.cheaperThan")}.`}
      />
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.08),transparent_60%)]" />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="gradient-primary border-0 text-primary-foreground gap-1.5">
              <Sparkles className="h-3 w-3" /> {t("pricing.hero.twoMonthsFree")}
            </Badge>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              {t("pricing.hero.title")}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              {t("pricing.hero.subtitle")}
            </p>
            <p className="mt-4 inline-block rounded-full border border-success/40 bg-success/10 px-4 py-1.5 text-sm font-medium text-success">
              💰 {t("pricing.hero.cheaperThan")}
            </p>
          </div>

          {/* PLAN CARDS — 2 up */}
          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
            {/* Private plan */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <div className="relative h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-card-foreground">{t("pricing.private.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("pricing.private.headline")}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-card-foreground">{formatPrice(0, config)}</span>
                  <span className="text-sm text-muted-foreground">/ {t("common.free").toLowerCase()}</span>
                </div>
                <p className="mt-1 text-xs text-success">
                  + {formatPrice(privatePlan.price, config)} {t("pricing.private.perExtra")}
                </p>

                <p className="mt-4 text-sm text-muted-foreground">{t("pricing.private.subtitle")}</p>

                <Button className="mt-6 w-full" variant="outline" onClick={() => navigate("/sell")}>
                  {t("pricing.private.cta")} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>

                <div className="my-6 h-px bg-border" />
                <ul className="space-y-3">
                  {[
                    t("pricing.private.freePerMonth"),
                    t("pricing.private.extraListing"),
                    t("pricing.private.photos"),
                    t("pricing.private.activeUntilSold"),
                    t("pricing.private.noSubscription"),
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-card-foreground">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Dealer plan */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative">
              <div className="absolute -inset-px -z-10 rounded-2xl bg-gradient-to-b from-primary/60 via-accent/40 to-transparent blur-sm opacity-70" />
              <div className="relative h-full rounded-2xl border border-primary/60 bg-card p-6 shadow-2xl shadow-primary/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gradient-primary border-0 text-primary-foreground gap-1">
                    <Star className="h-3 w-3 fill-current" /> {t("common.popular")}
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-card-foreground">{t("pricing.dealer.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("pricing.dealer.vehicles")}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-card-foreground">
                    {formatPrice(dealerPlan.price, config)}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {t("pricing.perMonth")}</span>
                </div>
                <p className="mt-1 text-xs text-success">🎁 {t("pricing.dealer.trial")}</p>

                <p className="mt-4 text-sm text-muted-foreground">{t("pricing.dealer.subtitle")}</p>

                <Button
                  className="mt-6 w-full gradient-primary border-0 shadow-lg shadow-primary/20"
                  onClick={() => handleSubscribe(dealerPlan.priceId)}
                  disabled={loading === dealerPlan.priceId}
                >
                  {loading === dealerPlan.priceId ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("common.loading")}</>
                  ) : (
                    <>{t("pricing.dealer.cta")} <ArrowRight className="ml-1 h-4 w-4" /></>
                  )}
                </Button>

                <div className="my-6 h-px bg-border" />
                <ul className="space-y-3">
                  {[
                    t("pricing.dealer.vehicles"),
                    t("pricing.dealer.photos"),
                    t("pricing.dealer.videos"),
                    t("pricing.dealer.trial"),
                    t("pricing.dealer.analytics"),
                    t("pricing.dealer.landingPage"),
                    t("pricing.dealer.featured"),
                    t("pricing.dealer.support"),
                    t("pricing.dealer.syndication"),
                    t("pricing.dealer.financeIntegration"),
                    t("pricing.dealer.verifiedBadge"),
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-card-foreground">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PORTAL LOGOS */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-10">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("pricing.portalSync")}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-12">
            {partners.map((name) => (
              <span key={name} className="font-display text-base font-semibold text-muted-foreground/70 sm:text-lg">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* VALUE PILLARS */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Alles, was du brauchst, um mehr Autos zu verkaufen
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BarChart3, title: "Live-Analytik", desc: "Aufrufe, Leads und Conversion in Echtzeit." },
            { icon: ShieldCheck, title: "Verifiziertes Abzeichen", desc: "Vertrauen der Käufer durch KYC-Verifizierung." },
            { icon: Globe2, title: "Multi-Portal-Reichweite", desc: "Inserate automatisch zu mobile.de, AutoScout24 & mehr." },
            { icon: Headphones, title: "Deutscher Support", desc: "Priorisierte Hilfe von unserem Team in Deutschland." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display font-semibold text-card-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-border bg-muted/20">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                {t("pricing.faq.title")}
              </h2>
            </div>
            <Accordion type="single" collapsible className="mt-10 rounded-2xl border border-border bg-card divide-y divide-border">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-0 px-5">
                  <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-8 text-center md:p-12">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.15),transparent_60%)]" />
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Bereit, dein Autohaus wachsen zu lassen?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Starte jetzt mit 2 Monaten kostenlos — keine Vertragslaufzeit, jederzeit kündbar.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="gradient-primary border-0 shadow-lg shadow-primary/20" onClick={() => handleSubscribe(dealerPlan.priceId)}>
              {t("pricing.dealer.cta")} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/contact")}>
              Vertrieb kontaktieren
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={showBusinessDialog} onOpenChange={setShowBusinessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Autohaus einrichten</DialogTitle>
            <DialogDescription>Gib deinen Firmennamen ein, um zu starten. Du kannst das später ändern.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="business-name">Firmenname</Label>
              <Input
                id="business-name"
                placeholder="z.B. Premium Autohaus Berlin GmbH"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCheckout()}
              />
            </div>
            <Button className="gradient-primary w-full border-0" onClick={handleCheckout}>
              Weiter zur Zahlung <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default DealerPricing;
