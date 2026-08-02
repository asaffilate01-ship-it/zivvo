import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Star, Paintbrush, Car, Wrench, Eye, Shield, FileText, CheckCircle2,
  XCircle, Loader2, Camera, AlertTriangle,
} from "lucide-react";

interface AdminInspectionPanelProps {
  auction: any;
  onComplete: () => void;
}

const CONDITION_OPTIONS = ["Excellent", "Good", "Fair", "Poor", "Needs Attention"];

const AdminInspectionPanel = ({ auction, onComplete }: AdminInspectionPanelProps) => {
  const listing = auction.car_listings;
  const [rating, setRating] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  // Condition report fields
  const [paintCondition, setPaintCondition] = useState("");
  const [interiorCondition, setInteriorCondition] = useState("");
  const [mechanicalNotes, setMechanicalNotes] = useState("");
  const [tyresCondition, setTyresCondition] = useState("");
  const [accidentHistory, setAccidentHistory] = useState("");
  const [keysCount, setKeysCount] = useState("2");
  const [spareKey, setSpareKey] = useState(true);
  const [serviceHistory, setServiceHistory] = useState("");
  const [warrantyInfo, setWarrantyInfo] = useState("");
  const [assetsIncluded, setAssetsIncluded] = useState("");
  const [inspectorName, setInspectorName] = useState("");
  const [inspectorNotes, setInspectorNotes] = useState("");

  // Checks
  const [hpiClear, setHpiClear] = useState(false);
  const [ownershipVerified, setOwnershipVerified] = useState(false);
  const [sellerVerified, setSellerVerified] = useState(false);

  const handleApprove = async () => {
    if (!inspectorName) {
      toast.error("Inspector name is required");
      return;
    }
    setSubmitting(true);
    try {
      const conditionReport = {
        paint_condition: paintCondition,
        interior_condition: interiorCondition,
        mechanical_notes: mechanicalNotes,
        tyres_condition: tyresCondition,
        accident_history: accidentHistory || null,
        keys_count: parseInt(keysCount),
        spare_key: spareKey,
        service_history: serviceHistory,
        warranty_info: warrantyInfo,
        assets_included: assetsIncluded,
        inspector_name: inspectorName,
        inspector_notes: inspectorNotes,
        inspected_at: new Date().toISOString(),
      };

      // Update auction
      const { error: auctionErr } = await supabase.from("auctions").update({
        status: "live" as any,
        inspection_rating: rating,
        condition_report: conditionReport,
        hpi_clear: hpiClear,
        ownership_verified: ownershipVerified,
        seller_verified: sellerVerified,
        starts_at: new Date().toISOString(),
      }).eq("id", auction.id);

      if (auctionErr) throw auctionErr;

      // Create inspection report
      const totalPoints = 200;
      const score = Math.round((rating / 5) * totalPoints);
      await supabase.from("inspection_reports").insert({
        listing_id: auction.listing_id,
        score,
        total_points: totalPoints,
        inspector_name: inspectorName,
        summary: inspectorNotes || `Vehicle rated ${rating}/5. ${paintCondition ? `Paint: ${paintCondition}.` : ""} ${mechanicalNotes ? `Mechanical: ${mechanicalNotes}.` : ""}`,
      });

      // Audit
      await supabase.from("auction_audit_log").insert({
        auction_id: auction.id,
        actor_role: "admin",
        action: "inspection_completed",
        details: { rating, hpi_clear: hpiClear, inspector: inspectorName },
      });

      toast.success("Auction approved and live!");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve auction");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    try {
      await supabase.from("auctions").update({ status: "cancelled" as any }).eq("id", auction.id);
      await supabase.from("auction_audit_log").insert({
        auction_id: auction.id,
        actor_role: "admin",
        action: "inspection_rejected",
        details: { reason: inspectorNotes },
      });
      toast.success("Auction rejected");
      onComplete();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollArea className="h-[70vh]">
      <div className="space-y-6 pr-4">
        {/* Vehicle Summary */}
        <div className="flex items-start gap-4">
          {listing?.images?.[0] && (
            <img src={listing.images[0]} alt="" className="w-24 h-16 rounded-lg object-cover" />
          )}
          <div>
            <h3 className="font-semibold">{listing?.year} {listing?.make} {listing?.model}</h3>
            <p className="text-sm text-muted-foreground">Reg: {listing?.registration || "N/A"} · {listing?.mileage?.toLocaleString()} miles</p>
            <p className="text-sm text-muted-foreground">Starting: €{Number(auction.starting_price).toLocaleString()} · Format: {auction.format}</p>
          </div>
        </div>

        <Separator />

        {/* Photos Review */}
        {listing?.images?.length > 0 && (
          <div>
            <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Camera className="w-4 h-4" /> Photos ({listing.images.length})
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {listing.images.slice(0, 8).map((img: string, i: number) => (
                <img key={i} src={img} alt="" className="w-full aspect-square rounded-lg object-cover border" />
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Overall Rating */}
        <div>
          <Label className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-primary" /> Overall Condition Rating
          </Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[rating]}
              onValueChange={([v]) => setRating(v)}
              min={1}
              max={5}
              step={1}
              className="flex-1"
            />
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 cursor-pointer ${s <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                  onClick={() => setRating(s)}
                />
              ))}
            </div>
            <Badge variant="outline" className="text-lg font-bold px-3">{rating}/5</Badge>
          </div>
        </div>

        <Separator />

        {/* Condition Details */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Condition Details</Label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1"><Paintbrush className="w-3 h-3" /> Paint Condition</Label>
              <Select value={paintCondition} onValueChange={setPaintCondition}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs flex items-center gap-1"><Car className="w-3 h-3" /> Interior Condition</Label>
              <Select value={interiorCondition} onValueChange={setInteriorCondition}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs flex items-center gap-1"><Eye className="w-3 h-3" /> Tyres Condition</Label>
              <Select value={tyresCondition} onValueChange={setTyresCondition}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Accident History</Label>
              <Input value={accidentHistory} onChange={(e) => setAccidentHistory(e.target.value)} placeholder="None / details" className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs flex items-center gap-1"><Wrench className="w-3 h-3" /> Mechanical Notes</Label>
            <Textarea value={mechanicalNotes} onChange={(e) => setMechanicalNotes(e.target.value)} placeholder="Engine, gearbox, brakes, suspension..." className="mt-1" rows={2} />
          </div>
        </div>

        <Separator />

        {/* Included Assets */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Included Items</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Number of Keys</Label>
              <Input type="number" value={keysCount} onChange={(e) => setKeysCount(e.target.value)} className="mt-1" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch checked={spareKey} onCheckedChange={setSpareKey} />
              <Label className="text-xs">Spare key included</Label>
            </div>
          </div>
          <div>
            <Label className="text-xs">Service History</Label>
            <Select value={serviceHistory} onValueChange={setServiceHistory}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Full dealer service history">Full dealer history</SelectItem>
                <SelectItem value="Full service history">Full service history</SelectItem>
                <SelectItem value="Partial service history">Partial history</SelectItem>
                <SelectItem value="No service history">No history</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Warranty</Label>
            <Input value={warrantyInfo} onChange={(e) => setWarrantyInfo(e.target.value)} placeholder="e.g. 3 months / manufacturer until..." className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Additional Assets</Label>
            <Input value={assetsIncluded} onChange={(e) => setAssetsIncluded(e.target.value)} placeholder="e.g. Roof rack, spare wheel..." className="mt-1" />
          </div>
        </div>

        <Separator />

        {/* Verification Checks */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4" /> Verification Checks</Label>
          <div className="space-y-2">
            {[
              { label: "HPI Check Clear", checked: hpiClear, onChange: setHpiClear, desc: "No finance, write-off, or theft markers" },
              { label: "Ownership Verified", checked: ownershipVerified, onChange: setOwnershipVerified, desc: "V5C matches seller identity" },
              { label: "Seller Verified", checked: sellerVerified, onChange: setSellerVerified, desc: "Identity and address confirmed" },
            ].map(({ label, checked, onChange, desc }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch checked={checked} onCheckedChange={onChange} />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Inspector Info */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Inspector Details</Label>
          <div>
            <Label className="text-xs">Inspector Name *</Label>
            <Input value={inspectorName} onChange={(e) => setInspectorName(e.target.value)} placeholder="Full name" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Notes / Summary</Label>
            <Textarea value={inspectorNotes} onChange={(e) => setInspectorNotes(e.target.value)} placeholder="Overall assessment notes..." className="mt-1" rows={3} />
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-3 pb-4">
          <Button variant="outline" className="flex-1 gap-2 text-destructive" onClick={handleReject} disabled={submitting}>
            <XCircle className="w-4 h-4" /> Reject
          </Button>
          <Button className="flex-1 gap-2" onClick={handleApprove} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Approve & Go Live
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};

export default AdminInspectionPanel;
