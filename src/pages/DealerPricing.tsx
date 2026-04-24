import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check, Zap, Star, Crown, ArrowRight, Loader2, User as UserIcon,
  Sparkles, ShieldCheck, BarChart3, Headphones, Globe2, X, ChevronRight,
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

const planIcons = [Zap, Star, Crown];

// Comparison matrix rows — values map to plan index 0,1,2
const comparisonRows: { label: string; values: (string | boolean)[] }[] = [
  { label: "Active listings",            values: ["5", "15", "Unlimited"] },
  { label: "Analytics dashboard",        values: ["Basic", "Full", "Advanced"] },
  { label: "Verified dealer badge",      values: [true, true, true] },
  { label: "Custom landing page",        values: [false, true, "White-label"] },
  { label: "Featured placements",        values: [false, true, "Priority"] },
  { label: "Portal syndication",         values: [false, "AutoTrader, eBay & more", "6 portals"] },
  { label: "Finance check integration",  values: [false, true, true] },
  { label: "Call tracking & recording",  values: [false, true, true] },
  { label: "Bulk import & API access",   values: [false, false, true] },
  { label: "Dedicated account manager",  values: [false, false, true] },
  { label: "Support",                    values: ["Email", "Priority", "24/7 dedicated"] },
];

const faqs = [
  { q: "Can I cancel or change my plan anytime?", a: "Yes — you can upgrade, downgrade or cancel from your billing portal at any time. Changes take effect at the next billing cycle and you keep access for the period you've already paid." },
  { q: "What's the difference between individual and dealer plans?", a: "Individual sellers pay a one-time fee per listing, which stays live until the car is sold. Dealer plans are monthly subscriptions designed for businesses who list multiple cars and need analytics, syndication and a custom dealer page." },
  { q: "Do you offer a free trial?", a: "We don't offer a free trial, but plans are month-to-month with no contracts. If your first month doesn't deliver value, contact support and we'll make it right." },
  { q: "How does portal syndication work?", a: "On Medium and Large plans, your listings can be automatically pushed to AutoTrader, eBay Motors, PistonHeads and other partner portals — managed from one dashboard." },
  { q: "Can I add team members to my dealer account?", a: "Yes — Medium and Large plans support multi-user access, with role-based permissions for sales staff, managers and admins." },
  { q: "Do you take commission on sales?", a: "No. We never take commission on vehicle sales. Your subscription covers everything — what you sell is yours." },
];

const trustLogos = [
  "AutoTrader", "eBay Motors", "PistonHeads", "Gumtree", "Cazoo", "Heycar",
];

const DealerPricing = () => {
  const { user, subscription, refreshSubscription } = useAuth();
  const { config } = useCountry();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [showBusinessDialog, setShowBusinessDialog] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const plans = config.dealerPlans.map((p, i) => ({
    ...p,
    icon: planIcons[i] || Zap,
    popular: i === 1,
    description:
      i === 0 ? "Perfect for small dealerships getting started"
      : i === 1 ? "For growing dealerships that need more"
      : "For large dealerships and dealer groups",
  }));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "canceled") {
      toast({ title: "Checkout canceled", description: "You can try again anytime." });
    }
  }, []);

  const currentTier = subscription.tier;

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      navigate("/signup");
      return;
    }
    setSelectedPriceId(priceId);
    setShowBusinessDialog(true);
  };

  const handleCheckout = async () => {
    if (!businessName.trim()) {
      toast({ title: "Business name required", variant: "destructive" });
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
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.error === "NO_SUBSCRIPTION") {
        toast({ title: "No subscription found", description: data.message || "Please subscribe to a plan first." });
        return;
      }
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const displayPrice = (price: number) =>
    billing === "annual" ? Math.round(price * 10) / 12 : price;

  const renderCell = (v: string | boolean) => {
    if (v === true)  return <Check className="mx-auto h-4 w-4 text-success" />;
    if (v === false) return <X className="mx-auto h-4 w-4 text-muted-foreground/40" />;
    return <span className="text-sm text-foreground">{v}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Dealer Plans & Pricing"
        description={`Choose a dealer plan to scale your dealership on AutoSouq. Starting from ${formatPrice(plans[0].price, config)}/month.`}
      />
      <Navbar />

      {/* ============== HERO ============== */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Decorative gradient blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.08),transparent_60%)]" />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="gradient-primary border-0 text-primary-foreground gap-1.5">
              <Sparkles className="h-3 w-3" /> For Dealers
            </Badge>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Plans built to <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">grow your dealership</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              Powerful tools, beautiful listings and a dedicated landing page.
              Cancel anytime — no contracts, no commission.
            </p>

            {subscription.subscribed && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-success bg-success/10 px-4 py-2 text-sm text-success">
                <Check className="h-4 w-4" /> You're on the
                <span className="font-semibold capitalize">{currentTier}</span> plan
                <Button variant="ghost" size="sm" className="ml-1 text-success underline" onClick={handleManageSubscription}>
                  Manage
                </Button>
              </div>
            )}

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  billing === "monthly"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={`relative rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  billing === "annual"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
                <Badge className="ml-2 h-5 bg-success/15 text-success border-0 px-1.5 text-[10px]">
                  Save 17%
                </Badge>
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Annual billing = 2 months free
            </p>
          </div>

          {/* ============== PLAN CARDS ============== */}
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => {
              const isCurrentPlan = currentTier === plan.name.toLowerCase();
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  {/* Glow ring for popular */}
                  {plan.popular && !isCurrentPlan && (
                    <div className="absolute -inset-px -z-10 rounded-2xl bg-gradient-to-b from-primary/60 via-accent/40 to-transparent blur-sm opacity-70" />
                  )}

                  <div
                    className={`relative h-full rounded-2xl border bg-card p-6 transition-all duration-300 ${
                      isCurrentPlan
                        ? "border-success shadow-xl ring-2 ring-success/20"
                        : plan.popular
                        ? "border-primary/60 shadow-2xl shadow-primary/10 md:-translate-y-2"
                        : "border-border shadow-sm hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                    }`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-success text-success-foreground border-0">Your Plan</Badge>
                      </div>
                    )}
                    {plan.popular && !isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="gradient-primary border-0 text-primary-foreground gap-1">
                          <Star className="h-3 w-3 fill-current" /> Most Popular
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        plan.popular ? "bg-gradient-to-br from-primary to-accent text-primary-foreground" : "bg-primary/10 text-primary"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-card-foreground">{plan.name}</h3>
                        <p className="text-xs text-muted-foreground">Up to {plan.maxListings >= 9999 ? "unlimited" : plan.maxListings} listings</p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-muted-foreground">{plan.description}</p>

                    <div className="mt-5 flex items-baseline gap-1">
                      <span className="font-display text-4xl font-bold text-card-foreground">
                        {formatPrice(displayPrice(plan.price), config)}
                      </span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                    {billing === "annual" && (
                      <p className="mt-1 text-xs text-success">
                        Billed {formatPrice(plan.price * 10, config)} yearly
                      </p>
                    )}

                    {isCurrentPlan ? (
                      <Button className="mt-6 w-full" variant="outline" onClick={handleManageSubscription}>
                        Manage Subscription
                      </Button>
                    ) : (
                      <Button
                        className={`mt-6 w-full ${plan.popular ? "gradient-primary border-0 shadow-lg shadow-primary/20" : ""}`}
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => handleSubscribe(plan.priceId)}
                        disabled={loading === plan.priceId}
                      >
                        {loading === plan.priceId ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
                        ) : (
                          <>Get Started <ArrowRight className="ml-1 h-4 w-4" /></>
                        )}
                      </Button>
                    )}

                    <div className="my-6 h-px bg-border" />

                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      What's included
                    </p>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm text-card-foreground">
                          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Individual seller CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mx-auto mt-10 max-w-3xl rounded-2xl border border-dashed border-border bg-card/60 p-5 backdrop-blur-sm sm:p-6"
          >
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">
                    Selling just one car?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Pay a one-time {formatPrice(config.individualPlan.price, config)} per listing — stays live until sold.
                    No subscription needed.
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate("/sell-my-car")} className="w-full sm:w-auto">
                List my car <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============== TRUST STRIP ============== */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-10">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Syndicate to the UK's biggest portals
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-12">
            {trustLogos.map((name) => (
              <span
                key={name}
                className="font-display text-base font-semibold text-muted-foreground/70 transition-colors hover:text-foreground sm:text-lg"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============== VALUE PILLARS ============== */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Everything you need to sell more cars
          </h2>
          <p className="mt-3 text-muted-foreground">
            Each plan includes the tools modern dealers rely on every day.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BarChart3, title: "Live analytics", desc: "Track views, leads and conversion in real time." },
            { icon: ShieldCheck, title: "Verified badges", desc: "Build buyer trust with KYC verification." },
            { icon: Globe2, title: "Multi-portal reach", desc: "Push listings to 6+ external portals automatically." },
            { icon: Headphones, title: "Real human support", desc: "Priority help from a UK-based team." },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display font-semibold text-card-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============== COMPARISON TABLE ============== */}
      <section className="border-y border-border bg-muted/20">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Compare plans side-by-side
            </h2>
            <p className="mt-3 text-muted-foreground">
              Find the right fit — every feature in every plan, at a glance.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="p-4 text-left font-semibold text-muted-foreground">Feature</th>
                  {plans.map((p) => (
                    <th key={p.name} className={`p-4 text-center font-display text-base font-bold ${
                      p.popular ? "text-primary" : "text-foreground"
                    }`}>
                      {p.name}
                      {p.popular && <Badge className="ml-2 bg-primary/15 text-primary border-0 text-[10px]">Popular</Badge>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, ri) => (
                  <tr key={row.label} className={`border-b border-border last:border-0 ${ri % 2 === 1 ? "bg-muted/10" : ""}`}>
                    <td className="p-4 text-left font-medium text-foreground">{row.label}</td>
                    {row.values.map((v, vi) => (
                      <td key={vi} className="p-4 text-center">{renderCell(v)}</td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-muted/30">
                  <td className="p-4"></td>
                  {plans.map((p) => {
                    const isCurrentPlan = currentTier === p.name.toLowerCase();
                    return (
                      <td key={p.name} className="p-4 text-center">
                        {isCurrentPlan ? (
                          <Badge variant="outline" className="border-success text-success">Current</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant={p.popular ? "default" : "outline"}
                            className={p.popular ? "gradient-primary border-0" : ""}
                            onClick={() => handleSubscribe(p.priceId)}
                          >
                            Choose {p.name}
                          </Button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ============== FAQ ============== */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-muted-foreground">
              Can't find what you're looking for? <a href="/contact" className="text-primary underline-offset-4 hover:underline">Talk to our team</a>.
            </p>
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
      </section>

      {/* ============== FINAL CTA ============== */}
      <section className="container mx-auto px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-8 text-center md:p-12">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.15),transparent_60%)]" />
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Ready to grow your dealership?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Join thousands of dealers already using AutoSouq to reach more buyers and sell faster.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="gradient-primary border-0 shadow-lg shadow-primary/20"
              onClick={() => handleSubscribe(plans[1].priceId)}
            >
              Start with {plans[1].name} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/contact")}>
              Talk to sales
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={showBusinessDialog} onOpenChange={setShowBusinessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Set up your dealership</DialogTitle>
            <DialogDescription>Enter your business name to get started. You can update this later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                placeholder="e.g. Premium Motors London"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCheckout()}
              />
            </div>
            <Button className="gradient-primary w-full border-0" onClick={handleCheckout}>
              Continue to Payment <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default DealerPricing;
