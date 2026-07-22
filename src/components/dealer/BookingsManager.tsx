import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Phone, MapPin, Car, SearchCheck, Truck, Calendar } from "lucide-react";

interface Props { dealerId: string; }

const StatusBadge = ({ status, label }: { status: string; label: string }) => {
  const variants: Record<string, string> = {
    pending: "bg-warning/15 text-warning",
    contacted: "bg-primary/15 text-primary",
    completed: "bg-success/15 text-success",
    cancelled: "bg-destructive/15 text-destructive",
  };
  return <Badge className={variants[status] || ""} variant="secondary">{label}</Badge>;
};

const STATUSES = ["pending", "contacted", "completed", "cancelled"];

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-border p-4 space-y-2">{children}</div>
);

const BookingsManager = ({ dealerId }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [finders, setFinders] = useState<any[]>([]);
  const [transports, setTransports] = useState<any[]>([]);

  const statusLabels: Record<string, string> = {
    pending: t("dealer.bookingsManager.statusPending"),
    contacted: t("dealer.bookingsManager.statusContacted"),
    completed: t("dealer.bookingsManager.statusCompleted"),
    cancelled: t("dealer.bookingsManager.statusCancelled"),
  };

  const load = async () => {
    setLoading(true);
    const [b, f, tr] = await Promise.all([
      supabase.from("test_drive_bookings").select("*").eq("dealer_id", dealerId).order("created_at", { ascending: false }),
      supabase.from("vehicle_finder_requests").select("*").eq("dealer_id", dealerId).order("created_at", { ascending: false }),
      supabase.from("transport_quotes").select("*").eq("dealer_id", dealerId).order("created_at", { ascending: false }),
    ]);
    setBookings(b.data || []);
    setFinders(f.data || []);
    setTransports(tr.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [dealerId]);

  const setStatus = async (table: "test_drive_bookings" | "vehicle_finder_requests" | "transport_quotes", id: string, status: string) => {
    const { error } = await supabase.from(table).update({ status }).eq("id", id);
    if (error) { toast({ title: t("dealer.bookingsManager.failed"), description: error.message, variant: "destructive" }); return; }
    toast({ title: t("common.updated") });
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dealer.bookingsManager.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="test-drives">
          <TabsList>
            <TabsTrigger value="test-drives"><Car className="w-4 h-4 mr-1" /> {t("dealer.bookingsManager.testDrivesTab", { count: bookings.length })}</TabsTrigger>
            <TabsTrigger value="finder"><SearchCheck className="w-4 h-4 mr-1" /> {t("dealer.bookingsManager.finderTab", { count: finders.length })}</TabsTrigger>
            <TabsTrigger value="transport"><Truck className="w-4 h-4 mr-1" /> {t("dealer.bookingsManager.transportTab", { count: transports.length })}</TabsTrigger>
          </TabsList>

          <TabsContent value="test-drives" className="mt-4 space-y-3">
            {bookings.length === 0 && <p className="text-sm text-muted-foreground">{t("dealer.bookingsManager.noTestDrives")}</p>}
            {bookings.map((b) => (
              <Row key={b.id}>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{b.name}</div>
                  <StatusBadge status={b.status} label={statusLabels[b.status] || b.status} />
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {b.email}</span>
                  {b.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {b.phone}</span>}
                  {b.preferred_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {b.preferred_date} {b.preferred_time}</span>}
                </div>
                {b.message && <p className="text-sm">{b.message}</p>}
                <div className="flex gap-2">
                  {STATUSES.map((s) => (
                    <Button key={s} size="sm" variant={b.status === s ? "default" : "outline"} onClick={() => setStatus("test_drive_bookings", b.id, s)}>{statusLabels[s]}</Button>
                  ))}
                </div>
              </Row>
            ))}
          </TabsContent>

          <TabsContent value="finder" className="mt-4 space-y-3">
            {finders.length === 0 && <p className="text-sm text-muted-foreground">{t("dealer.bookingsManager.noFinderRequests")}</p>}
            {finders.map((f) => (
              <Row key={f.id}>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{f.name}</div>
                  <StatusBadge status={f.status} label={statusLabels[f.status] || f.status} />
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {f.email}</span>
                  {f.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {f.phone}</span>}
                </div>
                <div className="text-sm">
                  <strong>{t("dealer.bookingsManager.lookingFor")}</strong> {[f.year_from && `${f.year_from}+`, f.make, f.model, f.body_type, f.fuel_type, f.transmission].filter(Boolean).join(" · ") || t("dealer.bookingsManager.openToOptions")}
                  {f.budget_max && ` · ${t("dealer.bookingsManager.upTo", { amount: Number(f.budget_max).toLocaleString() })}`}
                </div>
                {f.notes && <p className="text-sm text-muted-foreground">{f.notes}</p>}
                <div className="flex gap-2">
                  {STATUSES.map((s) => (
                    <Button key={s} size="sm" variant={f.status === s ? "default" : "outline"} onClick={() => setStatus("vehicle_finder_requests", f.id, s)}>{statusLabels[s]}</Button>
                  ))}
                </div>
              </Row>
            ))}
          </TabsContent>

          <TabsContent value="transport" className="mt-4 space-y-3">
            {transports.length === 0 && <p className="text-sm text-muted-foreground">{t("dealer.bookingsManager.noTransportRequests")}</p>}
            {transports.map((tr) => (
              <Row key={tr.id}>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{tr.name}</div>
                  <StatusBadge status={tr.status} label={statusLabels[tr.status] || tr.status} />
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {tr.email}</span>
                  {tr.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {tr.phone}</span>}
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {tr.delivery_postcode}</span>
                </div>
                {tr.notes && <p className="text-sm">{tr.notes}</p>}
                <div className="flex gap-2">
                  {STATUSES.map((s) => (
                    <Button key={s} size="sm" variant={tr.status === s ? "default" : "outline"} onClick={() => setStatus("transport_quotes", tr.id, s)}>{statusLabels[s]}</Button>
                  ))}
                </div>
              </Row>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BookingsManager;
