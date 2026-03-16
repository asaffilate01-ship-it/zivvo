import { useState } from "react";
import { HandCoins, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import { supabase } from "@/integrations/supabase/client";

interface MakeOfferDialogProps {
  listingId: string;
  sellerId: string;
  listingTitle: string;
  askingPrice: number;
}

const MakeOfferDialog = ({ listingId, sellerId, listingTitle, askingPrice }: MakeOfferDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { config } = useCountry();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [offerPrice, setOfferPrice] = useState(String(Math.round(askingPrice * 0.9)));
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Sign in to make an offer", variant: "destructive" });
      return;
    }
    const price = parseInt(offerPrice);
    if (!price || price <= 0) return;

    setLoading(true);
    const { error } = await supabase.from("enquiries").insert({
      listing_id: listingId,
      seller_id: sellerId,
      sender_id: user.id,
      message: `💰 Offer: ${formatPrice(price, config)}\n\n${message || `I'd like to offer ${formatPrice(price, config)} for this vehicle.`}`,
      sender_name: null,
      sender_email: user.email || null,
    });

    if (error) {
      toast({ title: "Failed to send offer", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      toast({ title: "Offer sent!", description: "The seller will be notified." });
    }
    setLoading(false);
  };

  const priceDiff = parseInt(offerPrice) - askingPrice;
  const pctDiff = askingPrice > 0 ? Math.round((priceDiff / askingPrice) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/5">
          <HandCoins className="mr-2 h-4 w-4" />
          Make an Offer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Make an Offer</DialogTitle>
          <p className="text-sm text-muted-foreground">{listingTitle}</p>
          <p className="text-sm text-muted-foreground">Asking price: <span className="font-semibold text-foreground">{formatPrice(askingPrice, config)}</span></p>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-success" />
            <h3 className="mt-3 font-display text-lg font-semibold text-foreground">Offer Sent!</h3>
            <p className="mt-1 text-sm text-muted-foreground">The seller will review your offer and respond.</p>
            <Button className="mt-4" onClick={() => { setOpen(false); setSent(false); }}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Your Offer ({config.currency.symbol})</label>
              <Input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="Enter your offer"
                min={1}
                required
              />
              {parseInt(offerPrice) > 0 && (
                <p className={`mt-1 text-xs ${priceDiff < 0 ? "text-success" : priceDiff > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {priceDiff < 0 ? `${Math.abs(pctDiff)}% below asking` : priceDiff > 0 ? `${pctDiff}% above asking` : "At asking price"}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Message (optional)</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message to the seller..."
                rows={3}
              />
            </div>
            <Button type="submit" className="gradient-primary w-full border-0" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Offer
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MakeOfferDialog;
