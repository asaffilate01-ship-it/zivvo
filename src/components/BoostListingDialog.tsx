import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Rocket, Zap, Crown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";

interface BoostListingDialogProps {
  listingId: string;
  listingTitle: string;
  isPromoted?: boolean;
}

const boostOptions = [
  { days: 3, label: "3-Day Boost", icon: Zap, basePrice: 5, description: "Appear at top of search results for 3 days" },
  { days: 7, label: "7-Day Boost", icon: Rocket, basePrice: 10, description: "Top placement + featured badge for 7 days", popular: true },
  { days: 14, label: "14-Day Boost", icon: Crown, basePrice: 18, description: "Maximum exposure with priority placement for 14 days" },
];

const BoostListingDialog = ({ listingId, listingTitle, isPromoted }: BoostListingDialogProps) => {
  const [loading, setLoading] = useState<number | null>(null);
  const { toast } = useToast();
  const { config } = useCountry();

  const handleBoost = async (days: number, price: number) => {
    setLoading(days);
    try {
      const { data, error } = await supabase.functions.invoke("boost-checkout", {
        body: {
          listingId,
          listingTitle,
          days,
          amount: price,
          currency: config.currency.code.toLowerCase(),
        },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast({ title: "Error", description: "Could not create checkout session. Try again.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant={isPromoted ? "secondary" : "default"} className={isPromoted ? "" : "gradient-primary border-0"}>
          <Rocket className="mr-1.5 h-3.5 w-3.5" />
          {isPromoted ? "Boosted ✓" : "Boost"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Boost Your Listing</DialogTitle>
          <DialogDescription>Get more views and sell faster with promoted placement.</DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-3">
          {boostOptions.map((opt) => (
            <button
              key={opt.days}
              onClick={() => handleBoost(opt.days, opt.basePrice)}
              disabled={loading !== null}
              className={`relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:border-primary hover:shadow-md ${opt.popular ? "border-primary bg-primary/5" : "border-border"}`}
            >
              {opt.popular && (
                <Badge className="absolute -top-2 right-3 gradient-primary border-0 text-[10px] text-primary-foreground">Most Popular</Badge>
              )}
              <div className="gradient-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                <opt.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-card-foreground">{opt.label}</p>
                <p className="text-sm text-muted-foreground">{opt.description}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-bold text-primary">{formatPrice(opt.basePrice, config)}</p>
              </div>
              {loading === opt.days && <Loader2 className="absolute right-4 top-4 h-4 w-4 animate-spin text-primary" />}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BoostListingDialog;
