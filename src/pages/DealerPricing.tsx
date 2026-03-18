import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Zap, Star, Crown, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const planIcons = [Zap, Star, Crown];

import SEOHead from "@/components/SEOHead";

const DealerPricing = () => {
  const { user, subscription, refreshSubscription } = useAuth();
  const { config } = useCountry();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [showBusinessDialog, setShowBusinessDialog] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState("");
  const [businessName, setBusinessName] = useState("");

  const plans = config.dealerPlans.map((p, i) => ({
    ...p,
    icon: planIcons[i] || Zap,
    popular: i === 1,
    description: i === 0 ? "Perfect for small dealerships getting started" : i === 1 ? "For growing dealerships that need more" : "For large dealerships and dealer groups",
  }));

  // Check if returning from checkout
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
      if (data?.url) {
        window.open(data.url, "_blank");
      }
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
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Dealer Plans & Pricing" description={`Choose a dealer plan to scale your car dealership on AutoSouq. Starting from ${formatPrice(plans[0].price, config)}/month.`} />
      <Navbar />

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="gradient-primary border-0 text-primary-foreground">For Dealers</Badge>
          <h1 className="mt-4 font-display text-3xl font-bold text-foreground md:text-5xl">
            Scale Your Dealership
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Choose a plan that fits your business. All plans include marketplace access, 
            verified dealer badge, and a dedicated dashboard.
          </p>
          {subscription.subscribed && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-success bg-success/10 px-4 py-2 text-sm text-success">
              <Check className="h-4 w-4" /> You're on the <span className="font-semibold capitalize">{currentTier}</span> plan
              <Button variant="ghost" size="sm" className="ml-2 text-success underline" onClick={handleManageSubscription}>
                Manage
              </Button>
            </div>
          )}
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => {
            const isCurrentPlan = currentTier === plan.name.toLowerCase();
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border p-6 transition-all ${
                  isCurrentPlan
                    ? "border-success bg-card shadow-xl ring-2 ring-success/20"
                    : plan.popular
                    ? "border-primary bg-card shadow-xl shadow-primary/10"
                    : "border-border bg-card shadow-card hover:border-primary/50"
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-success text-success-foreground border-0">Your Plan</Badge>
                  </div>
                )}
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-primary border-0 text-primary-foreground">Most Popular</Badge>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <plan.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-card-foreground">{plan.name}</h3>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

                <div className="mt-5">
                  <span className="font-display text-4xl font-bold text-card-foreground">{formatPrice(plan.price, config)}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                {isCurrentPlan ? (
                  <Button className="mt-6 w-full" variant="outline" onClick={handleManageSubscription}>
                    Manage Subscription
                  </Button>
                ) : (
                  <Button
                    className={`mt-6 w-full ${plan.popular ? "gradient-primary border-0" : ""}`}
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

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
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
