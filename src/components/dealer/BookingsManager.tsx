import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Phone, MapPin, Car, SearchCheck, Truck, Calendar } from "lucide-react";

interface Props { dealerId: string; }

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    pending: "bg-warning/15 text-warning",
    contacted: "bg-primary/15 text-primary",
    completed: "bg-success/15 text-success",
    cancelled: "bg-destructive/15 text-destructive",
  };
  return <Badge className={variants[status] || ""} variant="secondary">{status}</Badge>;
};

const STATUSES = ["pending", "contacted", "completed", "cancelled"];

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-border p-4 space-y-2">{children}</div>
);

const BookingsManager = ({ dealerId }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [finders, setFinders] = useState<any[]>([]);
  const [transports, setTransports] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const [b, f, t] = await Promise.all([
      supabase.from("test_drive_bookings").select("*").eq("dealer_id", dealerId).order("created_at", { ascending: false }),
      supabase.from("vehicle_finder_requests").select("*").eq("dealer_id", dealerId).order("created_at", { ascending: false }),
      supabase.from("transport_quotes").select("*").eq("dealer_id", dealerId).order("created_at", { ascending: false }),
    ]);
    setBookings(b.data || []);
    setFinders(f.data || []);
    setTransports(t.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [dealerId]);

  const setStatus = async (table: "test_drive_bookings" | "vehicle_finder_requests" | "transport_quotes", id: string, status: string) => {
    const { error } = await supabase.from(table).update({ status }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Updated" });
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings & Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="test-drives">
          <TabsList>
            <TabsTrigger value="test-drives"><Car className="w-4 h-4 mr-1" /> Test Drives ({bookings.length})</TabsTrigger>
            <TabsTrigger value="finder"><SearchCheck className="w-4 h-4 mr-1" /> Finder ({finders.length})</TabsTrigger>
            <TabsTrigger value="transport"><Truck className="w-4 h-4 mr-1" /> Transport ({transports.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="test-drives" className="mt-4 space-y-3">
            {bookings.length === 0 && <p className="text-sm text-muted-foreground">No test drive bookings yet.</p>}
            {bookings.map((b) => (
              <Row key={b.id}>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{b.name}</div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {b.email}</span>
                  {b.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {b.phone}</span>}
                  {b.preferred_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {b.preferred_date} {b.preferred_time}</span>}
                </div>
                {b.message && <p className="text-sm">{b.message}</p>}
                <div className="flex gap-2">
                  {STATUSES.map((s) => (
                    <Button key={s} size="sm" variant={b.status === s ? "default" : "outline"} onClick={() => setStatus("test_drive_bookings", b.id, s)}>{s}</Button>
                  ))}
                </div>
              </Row>
            ))}
          </TabsContent>

          <TabsContent value="finder" className="mt-4 space-y-3">
            {finders.length === 0 && <p className="text-sm text-muted-foreground">No finder requests yet.</p>}
            {finders.map((f) => (
              <Row key={f.id}>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{f.name}</div>
                  <StatusBadge status={f.status} />
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {f.email}</span>
                  {f.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {f.phone}</span>}
                </div>
                <div className="text-sm">
                  <strong>Looking for:</strong> {[f.year_from && `${f.year_from}+`, f.make, f.model, f.body_type, f.fuel_type, f.transmission].filter(Boolean).join(" · ") || "Open to options"}
                  {f.budget_max && ` · up to £${Number(f.budget_max).toLocaleString()}`}
                </div>
                {f.notes && <p className="text-sm text-muted-foreground">{f.notes}</p>}
                <div className="flex gap-2">
                  {STATUSES.map((s) => (
                    <Button key={s} size="sm" variant={f.status === s ? "default" : "outline"} onClick={() => setStatus("vehicle_finder_requests", f.id, s)}>{s}</Button>
                  ))}
                </div>
              </Row>
            ))}
          </TabsContent>

          <TabsContent value="transport" className="mt-4 space-y-3">
            {transports.length === 0 && <p className="text-sm text-muted-foreground">No transport quote requests yet.</p>}
            {transports.map((t) => (
              <Row key={t.id}>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{t.name}</div>
                  <StatusBadge status={t.status} />
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {t.email}</span>
                  {t.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {t.phone}</span>}
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {t.delivery_postcode}</span>
                </div>
                {t.notes && <p className="text-sm">{t.notes}</p>}
                <div className="flex gap-2">
                  {STATUSES.map((s) => (
                    <Button key={s} size="sm" variant={t.status === s ? "default" : "outline"} onClick={() => setStatus("transport_quotes", t.id, s)}>{s}</Button>
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
