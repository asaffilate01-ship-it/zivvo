import { useState } from "react";
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

const steps = [
  { icon: Search, label: "Vehicle Details", desc: "Enter your registration or details" },
  { icon: Camera, label: "Photos", desc: "Upload photos of your vehicle" },
  { icon: DollarSign, label: "Set Price", desc: "Choose your asking price" },
  { icon: CheckCircle, label: "Review & Post", desc: "Confirm and publish" },
];

const SellMyCar = () => {
  const { config, country } = useCountry();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [regLooking, setRegLooking] = useState(false);

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

  const handleRegLookup = async () => {
    if (!form.registration.trim()) return;
    setRegLooking(true);
    try {
      const { data, error } = await supabase.functions.invoke("dvla-lookup", {
        body: { registration: form.registration.trim().toUpperCase() },
      });
      if (data && !error) {
        setForm((p) => ({
          ...p,
          make: data.make || p.make,
          model: data.model || p.model,
          year: data.yearOfManufacture?.toString() || p.year,
          fuel_type: data.fuelType || p.fuel_type,
          color: data.colour || p.color,
          title: `${data.make || ""} ${data.model || ""} ${data.yearOfManufacture || ""}`.trim(),
        }));
        toast({ title: "Vehicle found!", description: `${data.make} ${data.model} (${data.yearOfManufacture})` });
      } else {
        toast({ title: "Not found", description: "Could not find vehicle. Please enter details manually.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Lookup failed", description: "Enter details manually.", variant: "destructive" });
    }
    setRegLooking(false);
  };

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
      toast({ title: "Sign in required", description: "Please sign in to post your listing.", variant: "destructive" });
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
      toast({ title: "Listing created!", description: "Your listing is under review and will be live soon." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
      <SEOHead title={`Sell My Car — ${formatPrice(config.individualPlan.price, config)} Per Listing`} description={`Sell your car on Zivvo for just ${formatPrice(config.individualPlan.price, config)} per listing. Verified buyers, instant valuation.`} />
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Hero */}
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-xs">{formatPrice(config.individualPlan.price, config)} {config.individualPlan.label}</Badge>
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Sell Your Car
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> The Easy Way</span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              List your car for just {formatPrice(config.individualPlan.price, config)}. Stays live until sold. If vehicle details change, it's treated as a new listing.
            </p>

            <div className="mt-6 flex justify-center gap-8 text-xs text-muted-foreground">
              {[
                { icon: Zap, text: "Takes 5 mins" },
                { icon: Shield, text: "Verified buyers" },
                { icon: Clock, text: "Sell in days" },
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
                      <h2 className="font-display text-lg font-semibold text-foreground">Vehicle Details</h2>

                      {country === "GB" && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                          <Label className="text-xs text-muted-foreground">Enter your {config.terminology.registration} to auto-fill</Label>
                          <div className="mt-2 flex gap-2">
                            <Input
                              placeholder="e.g. AB12 CDE"
                              value={form.registration}
                              onChange={(e) => updateForm("registration", e.target.value.toUpperCase())}
                              className="uppercase font-mono"
                            />
                            <Button onClick={handleRegLookup} disabled={regLooking} variant="outline">
                              {regLooking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Make *</Label>
                          <Select value={form.make} onValueChange={(v) => updateForm("make", v)}>
                            <SelectTrigger><SelectValue placeholder="Select make" /></SelectTrigger>
                            <SelectContent>{config.makes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Model *</Label>
                          <Input placeholder="e.g. A4, Golf" value={form.model} onChange={(e) => updateForm("model", e.target.value)} />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Year *</Label>
                          <Input type="number" value={form.year} onChange={(e) => updateForm("year", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>{config.terminology.mileage}</Label>
                          <Input type="number" placeholder="30000" value={form.mileage} onChange={(e) => updateForm("mileage", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Fuel Type</Label>
                          <Select value={form.fuel_type} onValueChange={(v) => updateForm("fuel_type", v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{config.fuelTypes.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Transmission</Label>
                          <Select value={form.transmission} onValueChange={(v) => updateForm("transmission", v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{config.transmissions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Body Type</Label>
                          <Select value={form.body_type} onValueChange={(v) => updateForm("body_type", v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{config.bodyTypes.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Colour</Label>
                          <Input value={form.color} onChange={(e) => updateForm("color", e.target.value)} placeholder="e.g. Silver" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder={`e.g. ${config.popularCities[0]}`} />
                      </div>
                    </div>
                  )}

                  {/* Step 1: Photos */}
                  {step === 1 && (
                    <div className="space-y-5">
                      <h2 className="font-display text-lg font-semibold text-foreground">Upload Photos</h2>
                      <p className="text-sm text-muted-foreground">Great photos help sell your car faster. Add up to 20 images.</p>

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
                            <span className="mt-1 text-xs text-muted-foreground">Add Photo</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                          </label>
                        )}
                      </div>

                      <div className="rounded-xl bg-muted/50 p-4">
                        <h3 className="text-xs font-semibold text-foreground mb-2">📸 Photo Tips</h3>
                        <ul className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                          <li>• Front 3/4 angle</li>
                          <li>• Rear 3/4 angle</li>
                          <li>• Both sides</li>
                          <li>• Dashboard & interior</li>
                          <li>• Odometer reading</li>
                          <li>• Any damage/scratches</li>
                          <li>• Engine bay</li>
                          <li>• Boot space</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Price */}
                  {step === 2 && (
                    <div className="space-y-5">
                      <h2 className="font-display text-lg font-semibold text-foreground">Set Your Price</h2>

                      <div className="space-y-2">
                        <Label>Asking Price ({config.currency.symbol}) *</Label>
                        <Input
                          type="number"
                          value={form.price}
                          onChange={(e) => updateForm("price", e.target.value)}
                          placeholder="e.g. 15000"
                          className="text-xl font-bold"
                        />
                        {form.price && (
                          <p className="text-sm text-muted-foreground">
                            Your asking price: <span className="font-semibold text-primary">{formatPrice(parseFloat(form.price), config)}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Listing Title</Label>
                        <Input
                          value={form.title}
                          onChange={(e) => updateForm("title", e.target.value)}
                          placeholder={`${form.year} ${form.make} ${form.model}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={form.description}
                          onChange={(e) => updateForm("description", e.target.value)}
                          placeholder="Tell buyers about your car — condition, history, extras..."
                          rows={5}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review */}
                  {step === 3 && (
                    <div className="space-y-5">
                      <h2 className="font-display text-lg font-semibold text-foreground">Review Your Listing</h2>

                      <div className="rounded-xl border border-border p-4 space-y-3">
                        <h3 className="font-display text-xl font-bold text-foreground">
                          {form.title || `${form.year} ${form.make} ${form.model}`}
                        </h3>
                        <p className="text-2xl font-bold text-primary">{form.price ? formatPrice(parseFloat(form.price), config) : "—"}</p>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {[
                            ["Make", form.make],
                            ["Model", form.model],
                            ["Year", form.year],
                            [config.terminology.mileage, form.mileage || "—"],
                            ["Fuel", form.fuel_type || "—"],
                            ["Transmission", form.transmission || "—"],
                            ["Body", form.body_type || "—"],
                            ["Location", form.location || "—"],
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
                          <strong>Sign in required</strong> — You'll be redirected to sign in before your listing goes live.
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                {step < 3 ? (
                  <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="gradient-primary border-0">
                    Next <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={loading} className="gradient-primary border-0">
                    {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />}
                    {loading ? "Posting..." : "Post Listing"}
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
