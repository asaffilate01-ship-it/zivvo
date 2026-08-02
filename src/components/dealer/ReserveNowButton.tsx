import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CreditCard, ShieldCheck } from "lucide-react";
import { idempotencyHeaders } from "@/lib/idempotency";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Props {
  listingId: string;
  dealerId: string;
  listingTitle: string;
  accent?: string;
}

const RESERVATION_AMOUNT = 500;

const ReserveNowButton = ({ listingId, dealerId, listingTitle, accent }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    buyer_name: "", buyer_phone: "",
  });

  const submit = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/car/${listingId}`)}`);
      return;
    }
    if (!form.buyer_name) {
      toast({ title: t("dealer.reserveNow.missingInfoTitle"), description: t("dealer.reserveNow.missingInfoDescription"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reserve-deposit", {
        body: { listing_id: listingId, dealer_id: dealerId, ...form },
        headers: idempotencyHeaders(),
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
          <div><Label>{t("dealer.reserveNow.phone")}</Label><Input value={form.buyer_phone} onChange={e => setForm({ ...form, buyer_phone: e.target.value })} /></div>
          <div><Label>{t("dealer.reserveNow.depositAmount")}</Label><Input value={`${RESERVATION_AMOUNT} €`} disabled /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
          <Button onClick={submit} disabled={loading} className="border-0 text-white" style={accent ? { backgroundColor: accent } : undefined}>
            {loading ? t("dealer.reserveNow.redirecting") : t("dealer.reserveNow.payAndReserve", { amount: RESERVATION_AMOUNT })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReserveNowButton;
