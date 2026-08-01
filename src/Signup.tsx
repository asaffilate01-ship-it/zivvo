import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useCountry } from "@/contexts/CountryContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/countryConfig";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Car, Camera, DollarSign, CheckCircle, ArrowRight, ArrowLeft,
  Loader2, Search, Shield, Zap, Clock, Upload,
} from "lucide-react";

const SellMyCar = () => {
  const { t } = useTranslation();
  const { config, country } = useCountry();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const steps = [
    { icon: Search, label: t("sellMyCar.steps.vehicleDetails"), desc: t("sellMyCar.steps.vehicleDetailsDesc") },
    { icon: Camera, label: t("sellMyCar.steps.photos"), desc: t("sellMyCar.steps.photosDesc") },
    { icon: DollarSign, label: t("sellMyCar.steps.setPrice"), desc: t("sellMyCar.steps.setPriceDesc") },
    { icon: CheckCircle, label: t("sellMyCar.steps.reviewPost"), desc: t("sellMyCar.steps.reviewPostDesc") },
  ];
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    registration: "",
    make: "",
    model: "",
    year: String(new Date().getFullYear()),
    mileage: "",
    fuel_type: "",
    transmission: "",
    body_type: "",
    color: "",
    description: "",
    price: "",
    location: "",
    title: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const updateForm = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files].slice(0, 20);
    setImages(newImages);
    setPreviews(newImages.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (i: number) => {
    setImages((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: t("sellMyCar.signInRequired"), description: t("sellMyCar.signInRequiredDesc"), variant: "destructive" });
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      // Upload images
      const uploadedUrls: string[] = [];
      for (const img of images) {
        const path = `${user.id}/${Date.now()}-${img.name}`;
        const { error: upErr } = await supabase.storage.from("car-images").upload(path, img);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("car-images").getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      // Geocode the location to live coordinates (best effort)
      let latitude: number | null = null;
      let longitude: number | null = null;
      if (form.location) {
        try {
          const { geocodeAddress } = await import("@/lib/googleMapsLoader");
          const geo = await geocodeAddress(form.location, country);
          if (geo) { latitude = geo.lat; longitude = geo.lng; }
        } catch { /* non-blocking */ }
      }

      const { error } = await supabase.from("car_listings").insert({
        seller_id: user.id,
        title: form.title || `${form.make} ${form.model} ${form.year}`,
        make: form.make,
        model: form.model,
        year: parseInt(form.year),
        price: parseFloat(form.price),
        mileage: form.mileage ? parseInt(form.mileage) : null,
        fuel_type: form.fuel_type || null,
        transmission: form.transmission || null,
        body_type: form.body_type || null,
        color: form.color || null,
        description: form.description || null,
        location: form.location || null,
        latitude,
        longitude,
        images: uploadedUrls,
        country,
        registration: form.registration || null,
        status: "draft",
      });

      if (error) throw error;
      toast({ title: t("sellMyCar.listingCreated"), description: t("sellMyCar.listingCreatedDesc") });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: t("sellMyCar.error"), description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const canNext = () => {
    if (step === 0) return form.make && form.model && form.year;
    if (step === 1) return true; // photos optional
    if (step === 2) return form.price && parseFloat(form.price) > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t("sellMyCar.seoTitle", { price: formatPrice(config.individualPlan.price, config) })} description={t("sellMyCar.seoDescription", { price: formatPrice(config.individualPlan.price, config) })} />
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Hero */}
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-xs">{t("sellMyCar.listingFee", { price: formatPrice(config.individualPlan.price, config), label: config.individualPlan.label })}</Badge>
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {t("sellMyCar.heroTitle1")}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{t("sellMyCar.heroTitle2")}</span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t("sellMyCar.heroSubtitle", { price: formatPrice(config.individualPlan.price, config) })}
            </p>

            <div className="mt-6 flex justify-center gap-8 text-xs text-muted-foreground">
              {[
                { icon: Zap, text: t("sellMyCar.trust1") },
                { icon: Shield, text: t("sellMyCar.trust2") },
                { icon: Clock, text: t("sellMyCar.trust3") },
              ].map((i) => (
                <span key={i.text} className="flex items-center gap-1">
                  <i.icon className="h-3.5 w-3.5 text-primary" /> {i.text}
                </span>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8 flex items-center justify-center gap-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                    i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </button>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 w-8 rounded ${i < step ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          <Card>
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Step 0: Vehicle Details */}
                  {step === 0 && (
                    <div className="space-y-5">
                      <h2 className="font-display text-lg font-semibold text-foreground">{t("sellMyCar.vehicleDetailsHeading")}</h2>

                      {country === "DE" && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                          <Label className="text-xs text-muted-foreground">{t("sellMyCar.regLookupLabel", { registration: config.terminology.registration })}</Label>
                          <div className="mt-2 flex gap-2">
                            <Input
                              placeholder={t("sellMyCar.regPlaceholder")}
                              value={form.registration}
                              onChange={(e) => updateForm("registration", e.target.value.toUpperCase())}
                              className="uppercase font-mono"
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>{t("sellMyCar.make")}</Label>
                          <Select value={form.make} onValueChange={(v) => updateForm("make", v)}>
                            <SelectTrigger><SelectValue placeholder={t("sellMyCar.selectMake")} /></SelectTrigger>
                            <SelectContent>{config.makes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("sellMyCar.model")}</Label>
                          <Input placeholder={t("sellMyCar.modelPlaceholder")} value={form.model} onChange={(e) => updateForm("model", e.target.value)} />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label>{t("sellMyCar.year")}</Label>
                          <Input type="number" value={form.year} onChange={(e) => updateForm("year", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>{config.terminology.mileage}</Label>
                          <Input type="number" placeholder="30000" value={form.mileage} onChange={(e) => updateForm("mileage", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("sellMyCar.fuelType")}</Label>
                          <Select value={form.fuel_type} onValueChange={(v) => updateForm("fuel_type", v)}>
                            <SelectTrigger><SelectValue placeholder={t("sellMyCar.select")} /></SelectTrigger>
                            <SelectContent>{config.fuelTypes.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label>{t("sellMyCar.transmission")}</Label>
                          <Select value={form.transmission} onValueChange={(v) => updateForm("transmission", v)}>
                            <SelectTrigger><SelectValue placeholder={t("sellMyCar.select")} /></SelectTrigger>
                            <SelectContent>{config.transmissions.map((tr) => <SelectItem key={tr} value={tr}>{tr}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("sellMyCar.bodyType")}</Label>
                          <Select value={form.body_type} onValueChange={(v) => updateForm("body_type", v)}>
                            <SelectTrigger><SelectValue placeholder={t("sellMyCar.select")} /></SelectTrigger>
                            <SelectContent>{config.bodyTypes.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("sellMyCar.colour")}</Label>
                          <Input value={form.color} onChange={(e) => updateForm("color", e.target.value)} placeholder={t("sellMyCar.colourPlaceholder")} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("sellMyCar.location")}</Label>
                        <Input value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder={t("sellMyCar.locationPlaceholder", { city: config.popularCities[0] })} />
                      </div>
                    </div>
                  )}

                  {/* Step 1: Photos */}
                  {step === 1 && (
                    <div className="space-y-5">
                      <h2 className="font-display text-lg font-semibold text-foreground">{t("sellMyCar.uploadPhotosHeading")}</h2>
                      <p className="text-sm text-muted-foreground">{t("sellMyCar.uploadPhotosDesc")}</p>

                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                        {previews.map((p, i) => (
                          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                            <img src={p} alt="" className="h-full w-full object-cover" />
                            <button
                              onClick={() => removeImage(i)}
                              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {previews.length < 20 && (
                          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/50">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="mt-1 text-xs text-muted-foreground">{t("sellMyCar.addPhoto")}</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                          </label>
                        )}
                      </div>

                      <div className="rounded-xl bg-muted/50 p-4">
                        <h3 className="text-xs font-semibold text-foreground mb-2">{t("sellMyCar.photoTips")}</h3>
                        <ul className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                          <li>• {t("sellMyCar.tipFront")}</li>
                          <li>• {t("sellMyCar.tipRear")}</li>
                          <li>• {t("sellMyCar.tipSides")}</li>
                          <li>• {t("sellMyCar.tipInterior")}</li>
                          <li>• {t("sellMyCar.tipOdometer")}</li>
                          <li>• {t("sellMyCar.tipDamage")}</li>
                          <li>• {t("sellMyCar.tipEngine")}</li>
                          <li>• {t("sellMyCar.tipBoot")}</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Price */}
                  {step === 2 && (
                    <div className="space-y-5">
                      <h2 className="font-display text-lg font-semibold text-foreground">{t("sellMyCar.setPriceHeading")}</h2>

                      <div className="space-y-2">
                        <Label>{t("sellMyCar.askingPrice", { symbol: config.currency.symbol })}</Label>
                        <Input
                          type="number"
                          value={form.price}
                          onChange={(e) => updateForm("price", e.target.value)}
                          placeholder={t("sellMyCar.askingPricePlaceholder")}
                          className="text-xl font-bold"
                        />
                        {form.price && (
                          <p className="text-sm text-muted-foreground">
                            {t("sellMyCar.yourAskingPrice", { price: formatPrice(parseFloat(form.price), config) })}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>{t("sellMyCar.listingTitle")}</Label>
                        <Input
                          value={form.title}
                          onChange={(e) => updateForm("title", e.target.value)}
                          placeholder={`${form.year} ${form.make} ${form.model}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t("sellMyCar.descriptionLabel")}</Label>
                        <Textarea
                          value={form.description}
                          onChange={(e) => updateForm("description", e.target.value)}
                          placeholder={t("sellMyCar.descriptionPlaceholder")}
                          rows={5}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review */}
                  {step === 3 && (
                    <div className="space-y-5">
                      <h2 className="font-display text-lg font-semibold text-foreground">{t("sellMyCar.reviewHeading")}</h2>

                      <div className="rounded-xl border border-border p-4 space-y-3">
                        <h3 className="font-display text-xl font-bold text-foreground">
                          {form.title || `${form.year} ${form.make} ${form.model}`}
                        </h3>
                        <p className="text-2xl font-bold text-primary">{form.price ? formatPrice(parseFloat(form.price), config) : "—"}</p>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {[
                            [t("sellMyCar.reviewFields.make"), form.make],
                            [t("sellMyCar.reviewFields.model"), form.model],
                            [t("sellMyCar.reviewFields.year"), form.year],
                            [config.terminology.mileage, form.mileage || "—"],
                            [t("sellMyCar.reviewFields.fuel"), form.fuel_type || "—"],
                            [t("sellMyCar.reviewFields.transmission"), form.transmission || "—"],
                            [t("sellMyCar.reviewFields.body"), form.body_type || "—"],
                            [t("sellMyCar.reviewFields.location"), form.location || "—"],
                          ].map(([k, v]) => (
                            <div key={k}>
                              <span className="text-muted-foreground">{k}:</span>{" "}
                              <span className="font-medium text-foreground">{v}</span>
                            </div>
                          ))}
                        </div>

                        {previews.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pt-2">
                            {previews.slice(0, 6).map((p, i) => (
                              <img key={i} src={p} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                            ))}
                            {previews.length > 6 && (
                              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                                +{previews.length - 6}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {!user && (
                        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning-foreground">
                          <strong>{t("sellMyCar.signInRequiredNote")}</strong>{t("sellMyCar.signInRequiredNoteDesc")}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> {t("sellMyCar.back")}
                </Button>
                {step < 3 ? (
                  <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="gradient-primary border-0">
                    {t("sellMyCar.next")} <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={loading} className="gradient-primary border-0">
                    {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />}
                    {loading ? t("sellMyCar.posting") : t("sellMyCar.postListing")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SellMyCar;
