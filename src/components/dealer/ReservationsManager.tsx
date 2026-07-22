import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, RefreshCw, CheckCircle2 } from "lucide-react";

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
}

const statusColors: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  paid: "bg-success text-success-foreground",
  refunded: "bg-muted text-muted-foreground",
  applied_to_sale: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

const ReservationsManager = ({ dealerId }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [items, setItems] = useState<Reservation[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("reservation_deposits" as any)
      .select("*")
      .eq("dealer_id", dealerId)
      .order("created_at", { ascending: false });
    setItems((data as any) || []);
  };

  useEffect(() => { load(); }, [dealerId]);

  const statusLabels: Record<string, string> = {
    pending: t("dealer.reservationsManager.statusPending"),
    paid: t("dealer.reservationsManager.statusPaid"),
    refunded: t("dealer.reservationsManager.statusRefunded"),
    applied_to_sale: t("dealer.reservationsManager.statusAppliedToSale"),
    cancelled: t("dealer.reservationsManager.statusCancelled"),
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "refunded") updates.refunded_at = new Date().toISOString();
    const { error } = await supabase.from("reservation_deposits" as any).update(updates).eq("id", id);
    if (error) { toast({ title: t("common.error"), variant: "destructive" }); return; }
    toast({ title: t("dealer.reservationsManager.statusUpdated", { status: statusLabels[status] || status }) });
    load();
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
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{t("dealer.reservationsManager.heldFunds")}</p><p className="font-display text-xl font-bold">£{totalHeld.toLocaleString()}</p></div>
          <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{t("dealer.reservationsManager.allTime")}</p><p className="font-display text-xl font-bold">{items.length}</p></div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">{t("dealer.reservationsManager.empty")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(r => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{r.buyer_name}</p>
                  <p className="text-xs text-muted-foreground">{r.buyer_email} {r.buyer_phone && `· ${r.buyer_phone}`}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold">£{Number(r.amount).toLocaleString()}</span>
                  <Badge className={statusColors[r.status] || ""}>{statusLabels[r.status] || r.status}</Badge>
                  {r.status === "paid" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "applied_to_sale")}><CheckCircle2 className="mr-1 h-3 w-3" /> {t("dealer.reservationsManager.apply")}</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "refunded")}><RefreshCw className="mr-1 h-3 w-3" /> {t("dealer.reservationsManager.refund")}</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReservationsManager;
