import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gavel, Shield, CheckCircle2, ChevronRight, ChevronLeft, Upload,
  Camera, Car, Wrench, Paintbrush, FileText, Star, Clock, CreditCard,
  Truck, AlertTriangle, Info,
} from "lucide-react";

const STEPS = [
  { title: "Select Vehicle", icon: Car },
  { title: "Photos & Video", icon: Camera },
  { title: "Condition Assessment", icon: Wrench },
  { title: "Auction Settings", icon: Gavel },
  { title: "Review & Submit", icon: CheckCircle2 },
];

const AuctionApply = () => {
  const { user } = useAuth();
  const { country } = useCountry();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1: Vehicle selection
  const [listingId, setListingId] = useState("");

  // Step 2: Photos (info only — photos already on listing)
  const [additionalPhotosNote, setAdditionalPhotosNote] = useState("");

  // Step 3: Condition self-assessment
  const [paintCondition, setPaintCondition] = useState("");
  const [interiorCondition, setInteriorCondition] = useState("");
  const [mechanicalNotes, setMechanicalNotes] = useState("");
  const [tyresCondition, setTyresCondition] = useState("");
  const [serviceHistory, setServiceHistory] = useState("");
  const [accidentHistory, setAccidentHistory] = useState("");
  const [keysCount, setKeysCount] = useState("2");
  const [warrantyInfo, setWarrantyInfo] = useState("");
  const [knownFaults, setKnownFaults] = useState("");

  // Step 4: Auction settings
  const [format, setFormat] = useState<"timed" | "live_event">("timed");
  const [startingPrice, setStartingPrice] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [deliveryCost, setDeliveryCost] = useState("");
  const [collectionAddress, setCollectionAddress] = useState("");

  const { data: listings = [] } = useQuery({
    queryKey: ["my-active-listings-auction-apply", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("car_listings")
        .select("id, title, make, model, year, price, images, mileage, location")
        .eq("seller_id", user!.id)
        .eq("status", "active")
        .eq("country", country);
      return data || [];
    },
    enabled: !!user,
  });

  const selectedListing = listings.find((l: any) => l.id === listingId);

  const submitAuction = useMutation({
    mutationFn: async () => {
      if (!listingId || !startingPrice) throw new Error("Missing required fields");

      const conditionReport = {
        paint: paintCondition,
        interior: interiorCondition,
        mechanical: mechanicalNotes,
        tyres: tyresCondition,
        service_history: serviceHistory,
        accident_history: accidentHistory,
        keys_count: parseInt(keysCount),
        warranty: warrantyInfo,
        known_faults: knownFaults,
        additional_photos_note: additionalPhotosNote,
        self_assessed: true,
      };

      const startsAt = new Date();
      startsAt.setHours(startsAt.getHours() + 24); // Default: starts 24h from now

      const { error } = await supabase.from("auctions").insert({
        listing_id: listingId,
        seller_id: user!.id,
        format,
        starting_price: parseFloat(startingPrice),
        reserve_price: reservePrice ? parseFloat(reservePrice) : null,
        delivery_available: deliveryAvailable,
        delivery_cost_estimate: deliveryCost ? parseFloat(deliveryCost) : null,
        collection_address: collectionAddress || null,
        condition_report: conditionReport,
        status: "pending_inspection" as any,
        starts_at: startsAt.toISOString(),
        ends_at: new Date(startsAt.getTime() + 7 * 86400000).toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application submitted! Our team will inspect your vehicle and get back to you.");
      navigate("/profile");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const progress = ((step + 1) / STEPS.length) * 100;

  const canProceed = () => {
    if (step === 0) return !!listingId;
    if (step === 3) return !!startingPrice;
    return true;
  };

  return (
    <>
      <SEOHead title="Sell at Auction | Apply to Auction Your Vehicle" description="Submit your vehicle for our trusted auction platform. Professional inspection, verified buyers, and payment protection included." />
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="gradient-dark text-white py-10 md:py-14 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--primary)/0.12),transparent_60%)]" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Gavel className="w-5 h-5 text-primary" />
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">Sell at Auction</Badge>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold font-display tracking-tight mb-2">
              Apply to Auction Your Vehicle
            </h1>
            <p className="text-white/70 max-w-xl text-sm md:text-base">
              Complete the application below. Our specialist will inspect and rate your car before it goes live to verified buyers.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = i === step;
                const isDone = i < step;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      isDone ? "bg-primary text-primary-foreground" :
                      isActive ? "bg-primary/20 text-primary border-2 border-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-[10px] hidden md:block ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`}>{s.title}</span>
                  </div>
                );
              })}
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: Select Vehicle */}
              {step === 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Car className="w-5 h-5 text-primary" /> Select Your Vehicle</CardTitle>
                    <CardDescription>Choose which of your active listings you'd like to auction</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {listings.length === 0 ? (
                      <div className="text-center py-8">
                        <Car className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground mb-3">You don't have any active listings yet.</p>
                        <Button onClick={() => navigate("/sell")}>Create a Listing First</Button>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {listings.map((l: any) => (
                          <div
                            key={l.id}
                            onClick={() => setListingId(l.id)}
                            className={`flex items-center gap-4 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              listingId === l.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                            }`}
                          >
                            <img src={l.images?.[0] || "/placeholder.svg"} alt={l.title} className="w-20 h-14 object-cover rounded-lg" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{l.year} {l.make} {l.model}</p>
                              <p className="text-xs text-muted-foreground">{l.mileage?.toLocaleString()} mi • {l.location}</p>
                            </div>
                            {listingId === l.id && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Photos & Video */}
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5 text-primary" /> Photos & Video</CardTitle>
                    <CardDescription>Your listing photos will be used. Add notes about additional images if needed.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedListing && (
                      <div className="grid grid-cols-4 gap-2">
                        {(selectedListing.images || []).slice(0, 8).map((img: string, i: number) => (
                          <img key={i} src={img} alt="" className="aspect-[4/3] object-cover rounded-lg border" />
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground flex items-start gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      Our inspector will take additional photos during the inspection. You can add more photos to your listing before then.
                    </p>
                    <div>
                      <Label>Additional Notes (optional)</Label>
                      <Textarea
                        value={additionalPhotosNote}
                        onChange={(e) => setAdditionalPhotosNote(e.target.value)}
                        placeholder="e.g. I have a walk-around video on YouTube, there's a small scratch on the rear bumper..."
                        rows={3}
                      />
                    </div>

                    {/* What our inspector checks */}
                    <Card className="bg-muted/50 border-border/50">
                      <CardContent className="p-4">
                        <p className="font-semibold text-sm mb-2 flex items-center gap-2"><Star className="w-4 h-4 text-primary" /> What Our Inspector Checks</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          {["Exterior paintwork & bodywork", "Interior trim & upholstery", "Engine & mechanical components", "Tyres & brakes", "Electrics & infotainment", "Documentation & service books"].map((item) => (
                            <div key={item} className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-primary" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Condition Self-Assessment */}
              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5 text-primary" /> Condition Self-Assessment</CardTitle>
                    <CardDescription>Be honest — our inspector will verify everything. Accurate descriptions lead to better outcomes.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Paintwork / Bodywork</Label>
                        <Select value={paintCondition} onValueChange={setPaintCondition}>
                          <SelectTrigger><SelectValue placeholder="Rate condition..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent — No marks</SelectItem>
                            <SelectItem value="good">Good — Minor blemishes</SelectItem>
                            <SelectItem value="fair">Fair — Some scratches/dents</SelectItem>
                            <SelectItem value="poor">Poor — Needs repair</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Interior</Label>
                        <Select value={interiorCondition} onValueChange={setInteriorCondition}>
                          <SelectTrigger><SelectValue placeholder="Rate condition..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent — Like new</SelectItem>
                            <SelectItem value="good">Good — Normal wear</SelectItem>
                            <SelectItem value="fair">Fair — Visible wear</SelectItem>
                            <SelectItem value="poor">Poor — Damaged/stained</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tyres</Label>
                        <Select value={tyresCondition} onValueChange={setTyresCondition}>
                          <SelectTrigger><SelectValue placeholder="Rate condition..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New / Recently replaced</SelectItem>
                            <SelectItem value="good">Good tread remaining</SelectItem>
                            <SelectItem value="fair">Adequate — will pass MOT</SelectItem>
                            <SelectItem value="needs_replacing">Needs replacing soon</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Number of Keys</Label>
                        <Select value={keysCount} onValueChange={setKeysCount}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 key</SelectItem>
                            <SelectItem value="2">2 keys</SelectItem>
                            <SelectItem value="3">3+ keys</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Service History</Label>
                      <Select value={serviceHistory} onValueChange={setServiceHistory}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full_dealer">Full dealer service history</SelectItem>
                          <SelectItem value="full_independent">Full independent service history</SelectItem>
                          <SelectItem value="partial">Partial service history</SelectItem>
                          <SelectItem value="none">No service history</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Accident History</Label>
                      <Select value={accidentHistory} onValueChange={setAccidentHistory}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No accident history</SelectItem>
                          <SelectItem value="minor">Minor — cosmetic only</SelectItem>
                          <SelectItem value="moderate">Moderate — professionally repaired</SelectItem>
                          <SelectItem value="major">Major — structural repair</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Mechanical Notes</Label>
                      <Textarea value={mechanicalNotes} onChange={(e) => setMechanicalNotes(e.target.value)} placeholder="Any known mechanical issues, warning lights, unusual noises..." rows={2} />
                    </div>

                    <div>
                      <Label>Known Faults (be honest)</Label>
                      <Textarea value={knownFaults} onChange={(e) => setKnownFaults(e.target.value)} placeholder="List any faults the buyer should know about..." rows={2} />
                    </div>

                    <div>
                      <Label>Warranty Information</Label>
                      <Input value={warrantyInfo} onChange={(e) => setWarrantyInfo(e.target.value)} placeholder="e.g. Manufacturer warranty until Dec 2026" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Auction Settings */}
              {step === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gavel className="w-5 h-5 text-primary" /> Auction Settings</CardTitle>
                    <CardDescription>Set your starting price and reserve. Our team may suggest adjustments after inspection.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Starting Price *</Label>
                        <Input type="number" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} placeholder="e.g. 5000" />
                        <p className="text-[10px] text-muted-foreground mt-1">Bidding starts from this amount</p>
                      </div>
                      <div>
                        <Label>Reserve Price (optional)</Label>
                        <Input type="number" value={reservePrice} onChange={(e) => setReservePrice(e.target.value)} placeholder="e.g. 8000" />
                        <p className="text-[10px] text-muted-foreground mt-1">Won't sell below this — hidden from buyers</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label>Collection Address</Label>
                      <Input value={collectionAddress} onChange={(e) => setCollectionAddress(e.target.value)} placeholder="Where will the buyer collect the car?" />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">Offer Delivery?</p>
                        <p className="text-xs text-muted-foreground">Allow buyers to request delivery via logistics partners</p>
                      </div>
                      <Switch checked={deliveryAvailable} onCheckedChange={setDeliveryAvailable} />
                    </div>
                    {deliveryAvailable && (
                      <div>
                        <Label>Estimated Delivery Cost</Label>
                        <Input type="number" value={deliveryCost} onChange={(e) => setDeliveryCost(e.target.value)} placeholder="e.g. 250" />
                      </div>
                    )}

                    {/* Fee breakdown */}
                    <Card className="bg-muted/50 border-border/50">
                      <CardContent className="p-4 space-y-2 text-sm">
                        <p className="font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Fee Structure</p>
                        <div className="flex justify-between"><span className="text-muted-foreground">Seller Fee</span><span>1.5% of hammer price</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Buyer Premium</span><span>3% (paid by buyer)</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Listing Fee</span><span className="text-primary font-medium">Free</span></div>
                        <Separator />
                        <p className="text-xs text-muted-foreground">You only pay if your car sells. No upfront costs.</p>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              )}

              {/* Step 5: Review & Submit */}
              {step === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Review & Submit</CardTitle>
                    <CardDescription>Check everything looks good before submitting for inspection</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedListing && (
                      <div className="flex items-center gap-4 p-3 rounded-xl border bg-muted/30">
                        <img src={selectedListing.images?.[0] || "/placeholder.svg"} alt="" className="w-20 h-14 object-cover rounded-lg" />
                        <div>
                          <p className="font-semibold text-sm">{selectedListing.year} {selectedListing.make} {selectedListing.model}</p>
                          <p className="text-xs text-muted-foreground">{selectedListing.mileage?.toLocaleString()} mi • {selectedListing.location}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Starting Price</p>
                        <p className="font-semibold">£{Number(startingPrice || 0).toLocaleString()}</p>
                      </div>
                      {reservePrice && (
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground">Reserve Price</p>
                          <p className="font-semibold">£{Number(reservePrice).toLocaleString()}</p>
                        </div>
                      )}
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Format</p>
                        <p className="font-semibold capitalize">{format.replace("_", " ")}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Delivery</p>
                        <p className="font-semibold">{deliveryAvailable ? `Available (£${deliveryCost || "TBC"})` : "Collection only"}</p>
                      </div>
                    </div>

                    {/* Condition summary */}
                    <div className="p-4 rounded-xl border bg-muted/20 space-y-2 text-sm">
                      <p className="font-semibold">Condition Summary</p>
                      {paintCondition && <div className="flex justify-between"><span className="text-muted-foreground">Paintwork</span><span className="capitalize">{paintCondition}</span></div>}
                      {interiorCondition && <div className="flex justify-between"><span className="text-muted-foreground">Interior</span><span className="capitalize">{interiorCondition}</span></div>}
                      {tyresCondition && <div className="flex justify-between"><span className="text-muted-foreground">Tyres</span><span className="capitalize">{tyresCondition.replace("_", " ")}</span></div>}
                      {serviceHistory && <div className="flex justify-between"><span className="text-muted-foreground">Service History</span><span className="capitalize">{serviceHistory.replace(/_/g, " ")}</span></div>}
                      {accidentHistory && <div className="flex justify-between"><span className="text-muted-foreground">Accidents</span><span className="capitalize">{accidentHistory}</span></div>}
                      <div className="flex justify-between"><span className="text-muted-foreground">Keys</span><span>{keysCount}</span></div>
                      {knownFaults && <div><span className="text-muted-foreground">Known Faults:</span> <span>{knownFaults}</span></div>}
                    </div>

                    {/* What happens next */}
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-4">
                        <p className="font-semibold text-sm mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> What Happens Next</p>
                        <ol className="space-y-1.5 text-xs text-muted-foreground">
                          <li className="flex items-start gap-2"><span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">1</span>Our team reviews your application (within 24 hours)</li>
                          <li className="flex items-start gap-2"><span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">2</span>An approved specialist inspects your vehicle & rates it 1-5</li>
                          <li className="flex items-start gap-2"><span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">3</span>HPI check & ownership verification completed</li>
                          <li className="flex items-start gap-2"><span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">4</span>Your auction goes live to verified, deposit-backed buyers</li>
                          <li className="flex items-start gap-2"><span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">5</span>Sale completed with Payment Protection + e-signed contract</li>
                        </ol>
                      </CardContent>
                    </Card>

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-muted-foreground text-xs">By submitting, you confirm that the condition information provided is accurate to the best of your knowledge. Misrepresentation may result in deal cancellation.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6 mb-12">
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => submitAuction.mutate()}
                disabled={submitAuction.isPending || !canProceed()}
                className="gap-2"
              >
                {submitAuction.isPending ? "Submitting..." : "Submit for Inspection"}
                <Gavel className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AuctionApply;
