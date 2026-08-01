import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
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

const STEP_ICONS = [Car, Camera, Wrench, Gavel, CheckCircle2];

const AuctionApply = () => {
  const { t } = useTranslation();
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

  const STEPS = [
    { title: t("auctionApply.steps.selectVehicle"), icon: STEP_ICONS[0] },
    { title: t("auctionApply.steps.photosVideo"), icon: STEP_ICONS[1] },
    { title: t("auctionApply.steps.conditionAssessment"), icon: STEP_ICONS[2] },
    { title: t("auctionApply.steps.auctionSettings"), icon: STEP_ICONS[3] },
    { title: t("auctionApply.steps.reviewSubmit"), icon: STEP_ICONS[4] },
  ];

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
      toast.success(t("auctionApply.submitSuccess"));
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
      <SEOHead title={t("auctionApply.seoTitle")} description={t("auctionApply.seoDesc")} />
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
              <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">{t("auctionApply.badge")}</Badge>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold font-display tracking-tight mb-2">
              {t("auctionApply.heroTitle")}
            </h1>
            <p className="text-white/70 max-w-xl text-sm md:text-base">
              {t("auctionApply.heroDesc")}
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
                    <CardTitle className="flex items-center gap-2"><Car className="w-5 h-5 text-primary" /> {t("auctionApply.step1.title")}</CardTitle>
                    <CardDescription>{t("auctionApply.step1.desc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {listings.length === 0 ? (
                      <div className="text-center py-8">
                        <Car className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground mb-3">{t("auctionApply.step1.noListings")}</p>
                        <Button onClick={() => navigate("/sell")}>{t("auctionApply.step1.createListing")}</Button>
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
                    <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5 text-primary" /> {t("auctionApply.step2.title")}</CardTitle>
                    <CardDescription>{t("auctionApply.step2.desc")}</CardDescription>
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
                      {t("auctionApply.step2.info")}
                    </p>
                    <div>
                      <Label>{t("auctionApply.step2.notesLabel")}</Label>
                      <Textarea
                        value={additionalPhotosNote}
                        onChange={(e) => setAdditionalPhotosNote(e.target.value)}
                        placeholder={t("auctionApply.step2.notesPlaceholder")}
                        rows={3}
                      />
                    </div>

                    {/* What our inspector checks */}
                    <Card className="bg-muted/50 border-border/50">
                      <CardContent className="p-4">
                        <p className="font-semibold text-sm mb-2 flex items-center gap-2"><Star className="w-4 h-4 text-primary" /> {t("auctionApply.step2.checksTitle")}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          {[t("auctionApply.step2.check1"), t("auctionApply.step2.check2"), t("auctionApply.step2.check3"), t("auctionApply.step2.check4"), t("auctionApply.step2.check5"), t("auctionApply.step2.check6")].map((item) => (
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
                    <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5 text-primary" /> {t("auctionApply.step3.title")}</CardTitle>
                    <CardDescription>{t("auctionApply.step3.desc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>{t("auctionApply.step3.paintwork")}</Label>
                        <Select value={paintCondition} onValueChange={setPaintCondition}>
                          <SelectTrigger><SelectValue placeholder={t("auctionApply.step3.ratePlaceholder")} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">{t("auctionApply.step3.paintExcellent")}</SelectItem>
                            <SelectItem value="good">{t("auctionApply.step3.paintGood")}</SelectItem>
                            <SelectItem value="fair">{t("auctionApply.step3.paintFair")}</SelectItem>
                            <SelectItem value="poor">{t("auctionApply.step3.paintPoor")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t("auctionApply.step3.interior")}</Label>
                        <Select value={interiorCondition} onValueChange={setInteriorCondition}>
                          <SelectTrigger><SelectValue placeholder="Rate condition..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">{t("auctionApply.step3.interiorExcellent")}</SelectItem>
                            <SelectItem value="good">{t("auctionApply.step3.interiorGood")}</SelectItem>
                            <SelectItem value="fair">{t("auctionApply.step3.interiorFair")}</SelectItem>
                            <SelectItem value="poor">{t("auctionApply.step3.interiorPoor")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t("auctionApply.step3.tyres")}</Label>
                        <Select value={tyresCondition} onValueChange={setTyresCondition}>
                          <SelectTrigger><SelectValue placeholder="Rate condition..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">{t("auctionApply.step3.tyresNew")}</SelectItem>
                            <SelectItem value="good">{t("auctionApply.step3.tyresGood")}</SelectItem>
                            <SelectItem value="fair">{t("auctionApply.step3.tyresFair")}</SelectItem>
                            <SelectItem value="needs_replacing">{t("auctionApply.step3.tyresReplace")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t("auctionApply.step3.keysCount")}</Label>
                        <Select value={keysCount} onValueChange={setKeysCount}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">{t("auctionApply.step3.key1")}</SelectItem>
                            <SelectItem value="2">{t("auctionApply.step3.key2")}</SelectItem>
                            <SelectItem value="3">{t("auctionApply.step3.key3")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>{t("auctionApply.step3.serviceHistory")}</Label>
                      <Select value={serviceHistory} onValueChange={setServiceHistory}>
                        <SelectTrigger><SelectValue placeholder={t("auctionApply.step3.selectPlaceholder")} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full_dealer">{t("auctionApply.step3.serviceFullDealer")}</SelectItem>
                          <SelectItem value="full_independent">{t("auctionApply.step3.serviceFullIndependent")}</SelectItem>
                          <SelectItem value="partial">{t("auctionApply.step3.servicePartial")}</SelectItem>
                          <SelectItem value="none">{t("auctionApply.step3.serviceNone")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{t("auctionApply.step3.accidentHistory")}</Label>
                      <Select value={accidentHistory} onValueChange={setAccidentHistory}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("auctionApply.step3.accidentNone")}</SelectItem>
                          <SelectItem value="minor">{t("auctionApply.step3.accidentMinor")}</SelectItem>
                          <SelectItem value="moderate">{t("auctionApply.step3.accidentModerate")}</SelectItem>
                          <SelectItem value="major">{t("auctionApply.step3.accidentMajor")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{t("auctionApply.step3.mechanicalNotes")}</Label>
                      <Textarea value={mechanicalNotes} onChange={(e) => setMechanicalNotes(e.target.value)} placeholder={t("auctionApply.step3.mechanicalPlaceholder")} rows={2} />
                    </div>

                    <div>
                      <Label>{t("auctionApply.step3.knownFaults")}</Label>
                      <Textarea value={knownFaults} onChange={(e) => setKnownFaults(e.target.value)} placeholder={t("auctionApply.step3.knownFaultsPlaceholder")} rows={2} />
                    </div>

                    <div>
                      <Label>{t("auctionApply.step3.warranty")}</Label>
                      <Input value={warrantyInfo} onChange={(e) => setWarrantyInfo(e.target.value)} placeholder={t("auctionApply.step3.warrantyPlaceholder")} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Auction Settings */}
              {step === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gavel className="w-5 h-5 text-primary" /> {t("auctionApply.step4.title")}</CardTitle>
                    <CardDescription>{t("auctionApply.step4.desc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>{t("auctionApply.step4.startingPrice")}</Label>
                        <Input type="number" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} placeholder="e.g. 5000" />
                        <p className="text-[10px] text-muted-foreground mt-1">{t("auctionApply.step4.startingPriceHint")}</p>
                      </div>
                      <div>
                        <Label>{t("auctionApply.step4.reservePrice")}</Label>
                        <Input type="number" value={reservePrice} onChange={(e) => setReservePrice(e.target.value)} placeholder="e.g. 8000" />
                        <p className="text-[10px] text-muted-foreground mt-1">{t("auctionApply.step4.reservePriceHint")}</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label>{t("auctionApply.step4.collectionAddress")}</Label>
                      <Input value={collectionAddress} onChange={(e) => setCollectionAddress(e.target.value)} placeholder={t("auctionApply.step4.collectionAddressPlaceholder")} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{t("auctionApply.step4.offerDelivery")}</p>
                        <p className="text-xs text-muted-foreground">{t("auctionApply.step4.offerDeliveryDesc")}</p>
                      </div>
                      <Switch checked={deliveryAvailable} onCheckedChange={setDeliveryAvailable} />
                    </div>
                    {deliveryAvailable && (
                      <div>
                        <Label>{t("auctionApply.step4.deliveryCost")}</Label>
                        <Input type="number" value={deliveryCost} onChange={(e) => setDeliveryCost(e.target.value)} placeholder="e.g. 250" />
                      </div>
                    )}

                    {/* Fee breakdown */}
                    <Card className="bg-muted/50 border-border/50">
                      <CardContent className="p-4 space-y-2 text-sm">
                        <p className="font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> {t("auctionApply.step4.feeTitle")}</p>
                        <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionApply.step4.sellerFee")}</span><span>{t("auctionApply.step4.sellerFeeValue")}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionApply.step4.buyerPremium")}</span><span>{t("auctionApply.step4.buyerPremiumValue")}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionApply.step4.listingFee")}</span><span className="text-primary font-medium">{t("auctionApply.step4.listingFeeValue")}</span></div>
                        <Separator />
                        <p className="text-xs text-muted-foreground">{t("auctionApply.step4.feeNote")}</p>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              )}

              {/* Step 5: Review & Submit */}
              {step === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> {t("auctionApply.step5.title")}</CardTitle>
                    <CardDescription>{t("auctionApply.step5.desc")}</CardDescription>
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
                        <p className="text-xs text-muted-foreground">{t("auctionApply.step5.startingPrice")}</p>
                        <p className="font-semibold">€{Number(startingPrice || 0).toLocaleString()}</p>
                      </div>
                      {reservePrice && (
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground">{t("auctionApply.step5.reservePrice")}</p>
                          <p className="font-semibold">€{Number(reservePrice).toLocaleString()}</p>
                        </div>
                      )}
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">{t("auctionApply.step5.format")}</p>
                        <p className="font-semibold capitalize">{format.replace("_", " ")}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">{t("auctionApply.step5.delivery")}</p>
                        <p className="font-semibold">{deliveryAvailable ? t("auctionApply.step5.deliveryAvailable", { cost: deliveryCost || "TBC" }) : t("auctionApply.step5.collectionOnly")}</p>
                      </div>
                    </div>

                    {/* Condition summary */}
                    <div className="p-4 rounded-xl border bg-muted/20 space-y-2 text-sm">
                      <p className="font-semibold">{t("auctionApply.step5.conditionSummary")}</p>
                      {paintCondition && <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionApply.step5.paintwork")}</span><span className="capitalize">{paintCondition}</span></div>}
                      {interiorCondition && <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionApply.step5.interior")}</span><span className="capitalize">{interiorCondition}</span></div>}
                      {tyresCondition && <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionApply.step5.tyres")}</span><span className="capitalize">{tyresCondition.replace("_", " ")}</span></div>}
                      {serviceHistory && <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionApply.step5.serviceHistory")}</span><span className="capitalize">{serviceHistory.replace(/_/g, " ")}</span></div>}
                      {accidentHistory && <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionApply.step5.accidents")}</span><span className="capitalize">{accidentHistory}</span></div>}
                      <div className="flex justify-between"><span className="text-muted-foreground">{t("auctionApply.step5.keys")}</span><span>{keysCount}</span></div>
                      {knownFaults && <div><span className="text-muted-foreground">{t("auctionApply.step5.knownFaults")}</span> <span>{knownFaults}</span></div>}
                    </div>

                    {/* What happens next */}
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-4">
                        <p className="font-semibold text-sm mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {t("auctionApply.step5.whatNext")}</p>
                        <ol className="space-y-1.5 text-xs text-muted-foreground">
                          <li className="flex items-start gap-2"><span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">1</span>{t("auctionApply.step5.next1")}</li>
                          <li className="flex items-start gap-2"><span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">2</span>{t("auctionApply.step5.next2")}</li>
                          <li className="flex items-start gap-2"><span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">3</span>{t("auctionApply.step5.next3")}</li>
                          <li className="flex items-start gap-2"><span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">4</span>{t("auctionApply.step5.next4")}</li>
                          <li className="flex items-start gap-2"><span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">5</span>{t("auctionApply.step5.next5")}</li>
                        </ol>
                      </CardContent>
                    </Card>

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-muted-foreground text-xs">{t("auctionApply.step5.disclaimer")}</p>
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
              <ChevronLeft className="w-4 h-4" /> {t("auctionApply.back")}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="gap-2"
              >
                {t("auctionApply.next")} <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => submitAuction.mutate()}
                disabled={submitAuction.isPending || !canProceed()}
                className="gap-2"
              >
                {submitAuction.isPending ? t("auctionApply.submitting") : t("auctionApply.submitForInspection")}
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
