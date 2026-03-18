import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Gavel, Shield, Info, Clock, Truck, Key, FileText, Star, AlertTriangle } from "lucide-react";

const CreateAuction = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listingId, setListingId] = useState("");
  const [format, setFormat] = useState<"timed" | "live_event">("timed");
  const [startingPrice, setStartingPrice] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [duration, setDuration] = useState("7");
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [deliveryCost, setDeliveryCost] = useState("");
  const [collectionAddress, setCollectionAddress] = useState("");

  // Condition report fields
  const [keysCount, setKeysCount] = useState("2");
  const [spareKey, setSpareKey] = useState(true);
  const [serviceHistory, setServiceHistory] = useState("");
  const [accidentHistory, setAccidentHistory] = useState("");
  const [warrantyInfo, setWarrantyInfo] = useState("");
  const [assetsIncluded, setAssetsIncluded] = useState("");
  const [tyresCondition, setTyresCondition] = useState("");
  const [paintCondition, setPaintCondition] = useState("");
  const [interiorCondition, setInteriorCondition] = useState("");
  const [mechanicalNotes, setMechanicalNotes] = useState("");

  // Live event fields
  const [liveEventName, setLiveEventName] = useState("");
  const [liveEventDate, setLiveEventDate] = useState("");

  const { data: listings = [] } = useQuery({
    queryKey: ["my-active-listings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("car_listings")
        .select("id, title, make, model, year, images")
        .eq("seller_id", user!.id)
        .in("status", ["active", "draft"]);
      return data || [];
    },
    enabled: !!user,
  });

  const createAuction = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login required");
      if (!listingId) throw new Error("Select a listing");
      if (!startingPrice || parseFloat(startingPrice) <= 0) throw new Error("Set a starting price");

      const startsAt = new Date();
      startsAt.setHours(startsAt.getHours() + 1); // Start in 1 hour
      const endsAt = new Date(startsAt);
      endsAt.setDate(endsAt.getDate() + parseInt(duration));

      const conditionReport = {
        keys_count: parseInt(keysCount),
        spare_key: spareKey,
        service_history: serviceHistory,
        accident_history: accidentHistory,
        warranty_info: warrantyInfo,
        assets_included: assetsIncluded,
        tyres_condition: tyresCondition,
        paint_condition: paintCondition,
        interior_condition: interiorCondition,
        mechanical_notes: mechanicalNotes,
      };

      const { error } = await supabase.from("auctions").insert({
        listing_id: listingId,
        seller_id: user.id,
        format,
        status: "pending_inspection" as any,
        starting_price: parseFloat(startingPrice),
        reserve_price: reservePrice ? parseFloat(reservePrice) : null,
        starts_at: format === "timed" ? startsAt.toISOString() : null,
        ends_at: format === "timed" ? endsAt.toISOString() : null,
        original_end_time: format === "timed" ? endsAt.toISOString() : null,
        delivery_available: deliveryAvailable,
        delivery_cost_estimate: deliveryCost ? parseFloat(deliveryCost) : null,
        collection_address: collectionAddress || null,
        condition_report: conditionReport,
        live_event_name: format === "live_event" ? liveEventName : null,
        live_event_date: format === "live_event" && liveEventDate ? new Date(liveEventDate).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Auction submitted for inspection review!");
      navigate("/auctions");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <SEOHead title="Create Auction | Sell Your Car at Auction" description="List your verified vehicle for auction with professional inspection and escrow protection." />
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Gavel className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Create Auction</h1>
              <p className="text-sm text-muted-foreground">Your car will be inspected by our specialists before going live</p>
            </div>
          </div>

          {/* Info banner */}
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">How it works</p>
                <ol className="space-y-1 text-muted-foreground">
                  <li>1. Submit your car for auction with condition details</li>
                  <li>2. Our approved specialist inspects and rates your car (1-5)</li>
                  <li>3. HPI check & ownership verification completed</li>
                  <li>4. Auction goes live — verified buyers bid with pre-authorised funds</li>
                  <li>5. Sale completed via escrow + e-signed contract</li>
                </ol>
                <p className="mt-2 text-xs">Platform fee: <strong>1.5% seller fee</strong> on successful sale. Buyer pays 3% premium.</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Select Listing */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Select Vehicle</CardTitle><CardDescription>Choose from your existing listings</CardDescription></CardHeader>
              <CardContent>
                <Select value={listingId} onValueChange={setListingId}>
                  <SelectTrigger><SelectValue placeholder="Select a listing..." /></SelectTrigger>
                  <SelectContent>
                    {listings.map((l: any) => (
                      <SelectItem key={l.id} value={l.id}>{l.year} {l.make} {l.model} — {l.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {listings.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">No listings found. <a href="/sell" className="text-primary hover:underline">Create a listing first</a>.</p>
                )}
              </CardContent>
            </Card>

            {/* Auction Settings */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5" /> Auction Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Format</Label>
                  <Select value={format} onValueChange={(v) => setFormat(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="timed">Timed Auction (Online)</SelectItem>
                      <SelectItem value="live_event">Live Event Auction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Starting Price</Label>
                    <Input type="number" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} placeholder="e.g. 5000" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1">Reserve Price <Shield className="w-3 h-3 text-muted-foreground" /></Label>
                    <Input type="number" value={reservePrice} onChange={(e) => setReservePrice(e.target.value)} placeholder="Secret minimum" />
                    <p className="text-[10px] text-muted-foreground mt-1">Only visible to you & admin</p>
                  </div>
                </div>

                {format === "timed" && (
                  <div>
                    <Label>Duration</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="5">5 days</SelectItem>
                        <SelectItem value="7">7 days (recommended)</SelectItem>
                        <SelectItem value="10">10 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground mt-1">Anti-sniping: 2-minute extension on late bids</p>
                  </div>
                )}

                {format === "live_event" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Event Name</Label>
                      <Input value={liveEventName} onChange={(e) => setLiveEventName(e.target.value)} placeholder="e.g. Spring Auction" />
                    </div>
                    <div>
                      <Label>Event Date</Label>
                      <Input type="datetime-local" value={liveEventDate} onChange={(e) => setLiveEventDate(e.target.value)} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Condition Report */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Star className="w-5 h-5" /> Condition Details</CardTitle><CardDescription>Our inspector will verify and rate these</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-1"><Key className="w-3 h-3" /> Number of Keys</Label>
                    <Input type="number" value={keysCount} onChange={(e) => setKeysCount(e.target.value)} min="1" max="5" />
                  </div>
                  <div className="flex items-center justify-between pt-6">
                    <Label>Spare Key Included</Label>
                    <Switch checked={spareKey} onCheckedChange={setSpareKey} />
                  </div>
                </div>

                <div>
                  <Label><FileText className="w-3 h-3 inline mr-1" />Service History</Label>
                  <Select value={serviceHistory} onValueChange={setServiceHistory}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full dealer service history">Full dealer service history</SelectItem>
                      <SelectItem value="Full service history (independent)">Full service history (independent)</SelectItem>
                      <SelectItem value="Partial service history">Partial service history</SelectItem>
                      <SelectItem value="No service history">No service history</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label><AlertTriangle className="w-3 h-3 inline mr-1" />Accident History</Label>
                  <Textarea value={accidentHistory} onChange={(e) => setAccidentHistory(e.target.value)} placeholder="Describe any past accidents or 'No accidents'" rows={2} />
                </div>

                <div>
                  <Label><Shield className="w-3 h-3 inline mr-1" />Warranty Information</Label>
                  <Textarea value={warrantyInfo} onChange={(e) => setWarrantyInfo(e.target.value)} placeholder="e.g. 6 months through our warranty partner / None" rows={2} />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tyre Condition</Label>
                    <Select value={tyresCondition} onValueChange={setTyresCondition}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent (all new)">Excellent (all new)</SelectItem>
                        <SelectItem value="Good (5mm+ tread)">Good (5mm+ tread)</SelectItem>
                        <SelectItem value="Fair (3-5mm tread)">Fair (3-5mm tread)</SelectItem>
                        <SelectItem value="Needs replacing">Needs replacing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Paint Condition</Label>
                    <Select value={paintCondition} onValueChange={setPaintCondition}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent — no visible marks">Excellent</SelectItem>
                        <SelectItem value="Good — minor stone chips">Good — minor chips</SelectItem>
                        <SelectItem value="Fair — some scratches/dents">Fair — scratches/dents</SelectItem>
                        <SelectItem value="Poor — significant damage">Poor — significant damage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Interior Condition</Label>
                    <Select value={interiorCondition} onValueChange={setInteriorCondition}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent — like new">Excellent</SelectItem>
                        <SelectItem value="Good — light wear">Good — light wear</SelectItem>
                        <SelectItem value="Fair — visible wear">Fair — visible wear</SelectItem>
                        <SelectItem value="Poor — heavy wear/damage">Poor — heavy wear</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Mechanical Notes</Label>
                    <Textarea value={mechanicalNotes} onChange={(e) => setMechanicalNotes(e.target.value)} placeholder="Any known issues or recent work" rows={2} />
                  </div>
                </div>

                <div>
                  <Label>Additional Assets Included</Label>
                  <Textarea value={assetsIncluded} onChange={(e) => setAssetsIncluded(e.target.value)} placeholder="e.g. Roof rack, winter tyres set, original toolkit" rows={2} />
                </div>
              </CardContent>
            </Card>

            {/* Logistics */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Truck className="w-5 h-5" /> Collection & Delivery</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Collection Address</Label>
                  <Input value={collectionAddress} onChange={(e) => setCollectionAddress(e.target.value)} placeholder="Where the buyer can collect" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Delivery via Logistics Partners</Label>
                    <p className="text-xs text-muted-foreground">Buyer pays delivery at additional cost</p>
                  </div>
                  <Switch checked={deliveryAvailable} onCheckedChange={setDeliveryAvailable} />
                </div>
                {deliveryAvailable && (
                  <div>
                    <Label>Estimated Delivery Cost</Label>
                    <Input type="number" value={deliveryCost} onChange={(e) => setDeliveryCost(e.target.value)} placeholder="e.g. 250" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Button onClick={() => createAuction.mutate()} disabled={createAuction.isPending} className="w-full h-12 text-lg gap-2">
              <Gavel className="w-5 h-5" /> {createAuction.isPending ? "Submitting..." : "Submit for Inspection & Review"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">Your auction will go live after inspection and admin approval</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default CreateAuction;
