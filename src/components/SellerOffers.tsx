import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import { countryConfigs, formatPrice } from "@/lib/countryConfig";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import {
  CheckCircle2, XCircle, DollarSign, Clock, AlertTriangle,
  ArrowRightLeft, Loader2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

const fmt = (amount: number, country: string) => {
  const cfg = countryConfigs[country as keyof typeof countryConfigs] || countryConfigs.GB;
  return formatPrice(amount, cfg);
};

const statusLabels: Record<string, { label: string; color: string }> = {
  offer_sent: { label: "Offer Pending", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  seller_accepted: { label: "Accepted", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  seller_rejected: { label: "Rejected", color: "bg-destructive/20 text-destructive" },
  acquired: { label: "Acquired", color: "bg-primary/20 text-primary" },
  listed_to_dealers: { label: "Listed to Dealers", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  dealer_accepted: { label: "Dealer Found", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  seller_paid: { label: "Payment Received", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground" },
};

const SellerOffers = () => {
  const { user } = useAuth();
  const { country } = useCountry();
  const queryClient = useQueryClient();
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["seller-arbitrage-offers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arbitrage_deals")
        .select("*, car_listings!inner(title, make, model, year, images, price)")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const respondToOffer = useMutation({
    mutationFn: async ({ dealId, accept, reason }: { dealId: string; accept: boolean; reason?: string }) => {
      const update: Record<string, any> = accept
        ? { status: "seller_accepted" as any, seller_accepted_at: new Date().toISOString() }
        : { status: "seller_rejected" as any, rejection_reason: reason || "Seller declined" };

      const { error } = await supabase
        .from("arbitrage_deals")
        .update(update)
        .eq("id", dealId)
        .eq("seller_id", user!.id);
      if (error) throw error;

      await supabase.from("arbitrage_audit_log").insert({
        deal_id: dealId,
        actor_id: user!.id,
        actor_role: "seller",
        action: accept ? "seller_accepted" : "seller_rejected",
        details: accept ? {} : { reason: reason || "Seller declined" },
      });
    },
    onSuccess: (_, { accept }) => {
      toast.success(accept ? "Offer accepted! We'll proceed with the sale." : "Offer declined.");
      queryClient.invalidateQueries({ queryKey: ["seller-arbitrage-offers"] });
      setRejectDialog(null);
      setRejectionReason("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pendingOffers = offers.filter((o: any) => o.status === "offer_sent");
  const activeDeals = offers.filter((o: any) => ["seller_accepted", "acquired", "listed_to_dealers", "dealer_accepted"].includes(o.status));
  const completedDeals = offers.filter((o: any) => ["seller_paid", "completed"].includes(o.status));
  const rejectedDeals = offers.filter((o: any) => ["seller_rejected", "cancelled"].includes(o.status));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-16">
        <ArrowRightLeft className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-1">No offers yet</h3>
        <p className="text-sm text-muted-foreground">
          When the platform identifies one of your listings for trade stock, you'll see offers here.
        </p>
      </div>
    );
  }

  const renderOffer = (deal: any) => {
    const listing = deal.car_listings;
    const img = listing?.images?.[0] || "/placeholder.svg";
    const sc = statusLabels[deal.status] || { label: deal.status, color: "bg-muted text-muted-foreground" };
    const isPending = deal.status === "offer_sent";

    return (
      <Card key={deal.id} className="overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-48 aspect-video sm:aspect-auto overflow-hidden flex-shrink-0">
            <img src={img} alt={listing?.title} className="w-full h-full object-cover" />
          </div>
          <CardContent className="flex-1 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{listing?.year} {listing?.make} {listing?.model}</h3>
                <p className="text-xs text-muted-foreground">Listed at {fmt(listing?.price || 0, deal.country)}</p>
              </div>
              <Badge className={sc.color}>{sc.label}</Badge>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> Offer Price
                </span>
                <span className="text-lg font-bold text-primary">{fmt(deal.seller_price, deal.country)}</span>
              </div>
              {deal.status === "seller_paid" && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment Ref</span>
                  <span className="font-mono text-xs">{deal.seller_payment_ref || "Processing..."}</span>
                </div>
              )}
            </div>

            {isPending && (
              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-2"
                  onClick={() => respondToOffer.mutate({ dealId: deal.id, accept: true })}
                  disabled={respondToOffer.isPending}
                >
                  {respondToOffer.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Accept Offer
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={() => setRejectDialog(deal.id)}
                  disabled={respondToOffer.isPending}
                >
                  <XCircle className="w-4 h-4" /> Decline
                </Button>
              </div>
            )}

            {deal.status === "seller_accepted" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Accepted on {new Date(deal.seller_accepted_at).toLocaleDateString()}. Awaiting platform acquisition.</span>
              </div>
            )}

            {["listed_to_dealers", "dealer_accepted"].includes(deal.status) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>{deal.status === "listed_to_dealers" ? "Your car is being offered to dealers." : "A dealer has been found! Payment coming soon."}</span>
              </div>
            )}

            {deal.rejection_reason && (
              <p className="text-xs text-destructive">Reason: {deal.rejection_reason}</p>
            )}

            <p className="text-[10px] text-muted-foreground">
              Offer received {new Date(deal.seller_offer_sent_at || deal.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {pendingOffers.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Action Required ({pendingOffers.length})
          </h3>
          <div className="space-y-3">{pendingOffers.map(renderOffer)}</div>
        </div>
      )}

      {activeDeals.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">In Progress ({activeDeals.length})</h3>
          <div className="space-y-3">{activeDeals.map(renderOffer)}</div>
        </div>
      )}

      {completedDeals.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Completed ({completedDeals.length})</h3>
          <div className="space-y-3">{completedDeals.map(renderOffer)}</div>
        </div>
      )}

      {rejectedDeals.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Declined ({rejectedDeals.length})</h3>
          <div className="space-y-3">{rejectedDeals.map(renderOffer)}</div>
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setRejectionReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Offer</DialogTitle>
            <DialogDescription>Let us know why you're declining this offer (optional).</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Price too low, changed my mind, sold elsewhere..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => rejectDialog && respondToOffer.mutate({ dealId: rejectDialog, accept: false, reason: rejectionReason })}
              disabled={respondToOffer.isPending}
            >
              {respondToOffer.isPending ? "Declining..." : "Confirm Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerOffers;
