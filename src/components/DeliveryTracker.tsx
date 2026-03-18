import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Truck, Package, MapPin, Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface DeliveryTrackerProps {
  referenceType: "auction" | "arbitrage";
  referenceId: string;
  buyerId: string;
  sellerId: string;
  pickupAddress?: string;
}

const statusSteps = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "scheduled", label: "Scheduled", icon: Calendar },
  { key: "collected", label: "Collected", icon: Package },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  collected: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  in_transit: "bg-primary/20 text-primary",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  cancelled: "bg-destructive/20 text-destructive",
};

const DeliveryTracker = ({ referenceType, referenceId, buyerId, sellerId, pickupAddress }: DeliveryTrackerProps) => {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = hasRole("admin");
  const [showSchedule, setShowSchedule] = useState(false);
  const [form, setForm] = useState({
    delivery_address: "",
    scheduled_date: "",
    courier_name: "",
    courier_reference: "",
    delivery_cost: "",
    notes: "",
  });

  const { data: delivery, isLoading } = useQuery({
    queryKey: ["delivery-tracking", referenceType, referenceId],
    queryFn: async () => {
      const { data } = await supabase
        .from("delivery_tracking")
        .select("*")
        .eq("reference_type", referenceType)
        .eq("reference_id", referenceId)
        .maybeSingle();
      return data;
    },
  });

  const createDelivery = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("delivery_tracking").insert({
        reference_type: referenceType,
        reference_id: referenceId,
        buyer_id: buyerId,
        seller_id: sellerId,
        pickup_address: pickupAddress || "",
        delivery_address: form.delivery_address,
        scheduled_date: form.scheduled_date || null,
        courier_name: form.courier_name || null,
        courier_reference: form.courier_reference || null,
        delivery_cost: form.delivery_cost ? parseFloat(form.delivery_cost) : 0,
        notes: form.notes || null,
        status: form.scheduled_date ? "scheduled" : "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Delivery scheduled!");
      setShowSchedule(false);
      queryClient.invalidateQueries({ queryKey: ["delivery-tracking", referenceType, referenceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const update: Record<string, any> = { status: newStatus };
      if (newStatus === "collected") update.collected_at = new Date().toISOString();
      if (newStatus === "delivered") update.delivered_at = new Date().toISOString();
      const { error } = await supabase.from("delivery_tracking").update(update).eq("id", delivery!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated!");
      queryClient.invalidateQueries({ queryKey: ["delivery-tracking", referenceType, referenceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return null;

  // No delivery yet - show schedule button
  if (!delivery) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-4 w-4 text-primary" /> Delivery & Collection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">No delivery arranged yet. Schedule collection or delivery.</p>
          <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Truck className="h-4 w-4" /> Arrange Delivery</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Delivery</DialogTitle>
                <DialogDescription>Enter delivery details to arrange vehicle transport.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Delivery Address</Label>
                  <Textarea value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} placeholder="Full delivery address" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Scheduled Date</Label>
                    <Input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Delivery Cost (£)</Label>
                    <Input type="number" value={form.delivery_cost} onChange={(e) => setForm({ ...form, delivery_cost: e.target.value })} placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Courier / Transport Company</Label>
                    <Input value={form.courier_name} onChange={(e) => setForm({ ...form, courier_name: e.target.value })} placeholder="e.g. RAC Transport" />
                  </div>
                  <div>
                    <Label>Tracking Reference</Label>
                    <Input value={form.courier_reference} onChange={(e) => setForm({ ...form, courier_reference: e.target.value })} placeholder="REF-12345" />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Special instructions..." rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => createDelivery.mutate()} disabled={createDelivery.isPending || !form.delivery_address}>
                  {createDelivery.isPending ? "Scheduling..." : "Schedule Delivery"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  // Show delivery status tracker
  const currentIdx = statusSteps.findIndex((s) => s.key === delivery.status);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-4 w-4 text-primary" /> Delivery Tracking
          </CardTitle>
          <Badge className={statusColors[delivery.status] || ""}>
            {delivery.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Steps */}
        <div className="flex items-center gap-1">
          {statusSteps.map((step, idx) => {
            const isActive = idx <= currentIdx;
            const StepIcon = step.icon;
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className={`flex flex-col items-center gap-1 flex-1 ${isActive ? "text-primary" : "text-muted-foreground/40"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${isActive ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <StepIcon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-center leading-tight">{step.label}</span>
                </div>
                {idx < statusSteps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 ${idx < currentIdx ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {delivery.pickup_address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">Pickup</p>
                <p className="text-card-foreground">{delivery.pickup_address}</p>
              </div>
            </div>
          )}
          {delivery.delivery_address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">Delivery</p>
                <p className="text-card-foreground">{delivery.delivery_address}</p>
              </div>
            </div>
          )}
          {delivery.courier_name && (
            <div>
              <p className="text-muted-foreground text-xs">Courier</p>
              <p className="text-card-foreground">{delivery.courier_name}</p>
            </div>
          )}
          {delivery.courier_reference && (
            <div>
              <p className="text-muted-foreground text-xs">Reference</p>
              <p className="text-card-foreground font-mono">{delivery.courier_reference}</p>
            </div>
          )}
          {delivery.scheduled_date && (
            <div>
              <p className="text-muted-foreground text-xs">Scheduled</p>
              <p className="text-card-foreground">{new Date(delivery.scheduled_date).toLocaleDateString()}</p>
            </div>
          )}
          {delivery.delivery_cost > 0 && (
            <div>
              <p className="text-muted-foreground text-xs">Cost</p>
              <p className="text-card-foreground font-medium">£{delivery.delivery_cost}</p>
            </div>
          )}
        </div>

        {/* Admin/party actions to advance status */}
        {(isAdmin || user?.id === buyerId || user?.id === sellerId) && delivery.status !== "delivered" && delivery.status !== "cancelled" && (
          <div className="flex gap-2 pt-2 border-t border-border">
            {delivery.status === "pending" && (
              <Button size="sm" variant="outline" onClick={() => updateStatus.mutate("scheduled")}>Mark Scheduled</Button>
            )}
            {delivery.status === "scheduled" && (
              <Button size="sm" variant="outline" onClick={() => updateStatus.mutate("collected")}>Mark Collected</Button>
            )}
            {delivery.status === "collected" && (
              <Button size="sm" variant="outline" onClick={() => updateStatus.mutate("in_transit")}>Mark In Transit</Button>
            )}
            {delivery.status === "in_transit" && (
              <Button size="sm" onClick={() => updateStatus.mutate("delivered")}>Confirm Delivered</Button>
            )}
            {isAdmin && (
              <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate("cancelled")}>Cancel</Button>
            )}
          </div>
        )}

        {delivery.notes && (
          <p className="text-xs text-muted-foreground italic border-t border-border pt-2">{delivery.notes}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryTracker;
