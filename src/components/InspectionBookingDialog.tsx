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
import { useTranslation } from "react-i18next";

interface Props {
  listingId: string;
  trigger?: React.ReactNode;
}

const getTiers = (t: (k: string) => string) => [
  {
    id: "standard_200" as const,
    name: t("inspectionDialog.standardName"),
    price: 249,
    bullets: [t("inspectionDialog.standardB1"), t("inspectionDialog.standardB2"), t("inspectionDialog.standardB3"), t("inspectionDialog.standardB4")],
  },
  {
    id: "premium_300" as const,
    name: t("inspectionDialog.premiumName"),
    price: 349,
    bullets: [t("inspectionDialog.premiumB1"), t("inspectionDialog.premiumB2"), t("inspectionDialog.premiumB3"), t("inspectionDialog.premiumB4")],
  },
];

const InspectionBookingDialog = ({ listingId, trigger }: Props) => {
  const { t } = useTranslation();
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
      toast({ title: t("inspectionDialog.missingTitle"), description: t("inspectionDialog.missingDesc"), variant: "destructive" });
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
      toast({ title: t("inspectionDialog.bookingFailed"), description: e.message || "Try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const TIERS = getTiers(t);
  const selectedTier = TIERS.find((tier) => tier.id === type)!;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Shield className="w-4 h-4" /> {t("inspectionDialog.bookInspection")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {t("inspectionDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("inspectionDialog.description")}
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
              <Label htmlFor="phone">{t("inspectionDialog.yourPhone")}</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXX XXXXXX" />
            </div>
            <div>
              <Label htmlFor="address">{t("inspectionDialog.yourAddress")}</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="For report delivery" />
            </div>
            <div>
              <Label htmlFor="notes">{t("inspectionDialog.notes")}</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("inspectionDialog.notesPlaceholder")} rows={2} />
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
            <strong>{t("inspectionDialog.howItWorksLabel")}</strong> {t("inspectionDialog.howItWorksDesc", { price: selectedTier.price })}
          </div>

          <Button onClick={handleBook} disabled={loading} className="w-full" size="lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
            {t("inspectionDialog.payAndBook", { price: selectedTier.price })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InspectionBookingDialog;
