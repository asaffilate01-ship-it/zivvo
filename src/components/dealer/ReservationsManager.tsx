import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock3, CreditCard, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import { idempotencyHeaders } from "@/lib/idempotency";
import { reservationNeedsAttention, reservationRemaining } from "@/lib/reservationLifecycle";

interface Props { dealerId: string; }

interface Reservation {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  amount: number;
  currency: string;
  status: string;
  listing_id: string;
  created_at: string;
  notes: string | null;
  expires_at: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  paid: "bg-success text-success-foreground",
  refunded: "bg-muted text-muted-foreground",
  applied_to_sale: "bg-primary text-primary-foreground",
  refund_pending: "bg-warning text-warning-foreground",
  refund_failed: "bg-destructive text-destructive-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
  expired: "bg-muted text-muted-foreground",
  expiry_processing: "bg-warning text-warning-foreground",
};

const ReservationsManager = ({ dealerId }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [items, setItems] = useState<Reservation[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("reservation_deposits" as any)
      .select("*")
      .eq("dealer_id", dealerId)
      .order("created_at", { ascending: false });
    setItems((data as any) || []);
  }, [dealerId]);

  useEffect(() => { void load(); }, [load]);

  const statusLabels: Record<string, string> = {
    pending: t("dealer.reservationsManager.statusPending"),
    paid: t("dealer.reservationsManager.statusPaid"),
    refunded: t("dealer.reservationsManager.statusRefunded"),
    refund_pending: t("dealer.reservationsManager.statusRefundPending"),
    refund_failed: t("dealer.reservationsManager.statusRefundFailed"),
    applied_to_sale: t("dealer.reservationsManager.statusAppliedToSale"),
    cancelled: t("dealer.reservationsManager.statusCancelled"),
    expired: t("productionV2.reservations.statusExpired"),
    expiry_processing: t("productionV2.reservations.statusProcessing"),
  };

  const updateStatus = async (id: string, action: "apply_to_sale" | "refund") => {
    const prompt = action === "refund"
      ? t("dealer.reservationsManager.confirmRefund")
      : t("dealer.reservationsManager.confirmApply");
    if (!window.confirm(prompt)) return;
    setUpdating(`${id}:${action}`);
    const { data, error } = await supabase.functions.invoke("reservation-action", {
      body: { reservation_id: id, action },
      headers: idempotencyHeaders(),
    });
    setUpdating(null);
    if (error) { toast({ title: t("common.error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: t("dealer.reservationsManager.statusUpdated", { status: statusLabels[data?.status] || data?.status }) });
    void load();
  };

  const totalHeld = items.filter(r => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> {t("dealer.reservationsManager.title")}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {t("dealer.reservationsManager.subtitle")}
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{t("dealer.reservationsManager.activeReservations")}</p><p className="font-display text-xl font-bold">{items.filter(r => r.status === "paid").length}</p></div>
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{t("dealer.reservationsManager.heldFunds")}</p><p className="font-display text-xl font-bold">€{totalHeld.toLocaleString()}</p></div>
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{t("dealer.reservationsManager.allTime")}</p><p className="font-display text-xl font-bold">{items.length}</p></div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">{t("dealer.reservationsManager.empty")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(r => {
              const remaining = reservationRemaining(r.expires_at, now);
              const attention = reservationNeedsAttention(r.status, r.expires_at, now);
              return (
              <div key={r.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm ${attention ? "border-warning/60 bg-warning/5" : "border-border"}`}>
                <div>
                  <p className="font-medium">{r.buyer_name}</p>
                  <p className="text-xs text-muted-foreground">{r.buyer_email} {r.buyer_phone && `· ${r.buyer_phone}`}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(r.created_at).toLocaleString()}</p>
                  {remaining && !["expired", "refunded", "applied_to_sale", "cancelled"].includes(r.status) && <p className={`mt-1 flex items-center gap-1 text-xs ${remaining.expired ? "text-destructive" : "text-muted-foreground"}`}><Clock3 className="h-3 w-3" />{remaining.expired ? t("productionV2.reservations.awaitingExpiry") : t("productionV2.reservations.remaining", { hours: remaining.hours, minutes: remaining.minutes })}</p>}
                  {r.status === "refund_failed" && <p className="mt-1 flex items-center gap-1 text-xs font-medium text-destructive"><AlertTriangle className="h-3 w-3" />{t("productionV2.reservations.refundSupport")}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold">€{Number(r.amount).toLocaleString()}</span>
                  <Badge className={statusColors[r.status] || ""}>{statusLabels[r.status] || r.status}</Badge>
                  {r.status === "paid" && (
                    <>
                      <Button size="sm" variant="outline" disabled={updating !== null} onClick={() => updateStatus(r.id, "apply_to_sale")}>
                        {updating === `${r.id}:apply_to_sale` ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />} {t("dealer.reservationsManager.apply")}
                      </Button>
                      <Button size="sm" variant="outline" disabled={updating !== null} onClick={() => updateStatus(r.id, "refund")}>
                        {updating === `${r.id}:refund` ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />} {t("dealer.reservationsManager.refund")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );})}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReservationsManager;
