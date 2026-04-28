import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Props {
  listingId: string;
  trigger?: React.ReactNode;
}

const TIERS = [
  {
    id: "standard_200" as const,
    name: "Standard 200-point",
    price: 249,
    bullets: ["200 visual & mechanical checks", "Diagnostic OBD scan", "Photo report (PDF)", "Result within 48 hours"],
  },
  {
    id: "premium_300" as const,
    name: "Premium 300-point + Road Test",
    price: 349,
    bullets: ["Everything in Standard", "30-minute road test", "Paint depth measurements", "Underbody inspection on ramp"],
  },
];

const InspectionBookingDialog = ({ listingId, trigger }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"standard_200" | "premium_300">("standard_200");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const handleBook = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!phone || !address) {
      toast({ title: "Missing details", description: "Phone and address are required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("inspection-checkout", {
        body: { listingId, inspectionType: type, buyerPhone: phone, buyerAddress: address, buyerNotes: notes },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        setOpen(false);
      }
    } catch (e: any) {
      toast({ title: "Booking failed", description: e.message || "Try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const selectedTier = TIERS.find((t) => t.id === type)!;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Shield className="w-4 h-4" /> Book Inspection
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Independent Vehicle Inspection
          </DialogTitle>
          <DialogDescription>
            A qualified mechanic visits the seller and produces a full report. Pay only if the car checks out.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={type} onValueChange={(v) => setType(v as any)}>
            {TIERS.map((tier) => (
              <label
                key={tier.id}
                className={`flex gap-3 p-4 rounded-lg border cursor-pointer transition ${
                  type === tier.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={tier.id} className="mt-1" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold">{tier.name}</span>
                    <span className="font-bold text-primary">£{tier.price}</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {tier.bullets.map((b) => (
                      <li key={b} className="text-xs text-muted-foreground flex gap-1.5">
                        <Check className="w-3 h-3 mt-0.5 text-success shrink-0" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </label>
            ))}
          </RadioGroup>

          <div className="space-y-3 pt-2 border-t">
            <div>
              <Label htmlFor="phone">Your phone *</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXX XXXXXX" />
            </div>
            <div>
              <Label htmlFor="address">Your address *</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="For report delivery" />
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything specific you want checked?" rows={2} />
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
            <strong>How it works:</strong> Pay £{selectedTier.price} now. We'll contact the seller, schedule the visit, and email you the full report within 48–72 hours. Refund if seller refuses access.
          </div>

          <Button onClick={handleBook} disabled={loading} className="w-full" size="lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
            Pay £{selectedTier.price} & Book
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InspectionBookingDialog;
