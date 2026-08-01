import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CreditCard, ShieldCheck } from "lucide-react";

interface Props {
  listingId: string;
  dealerId: string;
  listingTitle: string;
  accent?: string;
  defaultAmount?: number;
}

const ReserveNowButton = ({ listingId, dealerId, listingTitle, accent, defaultAmount = 200 }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    buyer_name: "", buyer_email: "", buyer_phone: "", amount: String(defaultAmount),
  });

  const submit = async () => {
    if (!form.buyer_name || !form.buyer_email || !form.amount) {
      toast({ title: t("dealer.reserveNow.missingInfoTitle"), description: t("dealer.reserveNow.missingInfoDescription"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reserve-deposit", {
        body: { listing_id: listingId, dealer_id: dealerId, ...form, amount: Number(form.amount) },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data?.error || t("dealer.reserveNow.couldNotStartPayment"));
      }
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="border-0 text-white"
          style={accent ? { backgroundColor: accent } : undefined}
        >
          <CreditCard className="mr-2 h-5 w-5" /> {t("dealer.reserveNow.reserveNow")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dealer.reserveNow.reserveTitle", { title: listingTitle })}</DialogTitle>
          <DialogDescription className="flex items-start gap-2 pt-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>{t("dealer.reserveNow.description")}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div><Label>{t("dealer.reserveNow.fullName")}</Label><Input value={form.buyer_name} onChange={e => setForm({ ...form, buyer_name: e.target.value })} /></div>
          <div><Label>{t("dealer.reserveNow.email")}</Label><Input type="email" value={form.buyer_email} onChange={e => setForm({ ...form, buyer_email: e.target.value })} /></div>
          <div><Label>{t("dealer.reserveNow.phone")}</Label><Input value={form.buyer_phone} onChange={e => setForm({ ...form, buyer_phone: e.target.value })} /></div>
          <div><Label>{t("dealer.reserveNow.depositAmount")}</Label><Input type="number" min={50} max={5000} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
          <Button onClick={submit} disabled={loading} className="border-0 text-white" style={accent ? { backgroundColor: accent } : undefined}>
            {loading ? t("dealer.reserveNow.redirecting") : t("dealer.reserveNow.payAndReserve", { amount: form.amount })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReserveNowButton;
