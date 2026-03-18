import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Loader2, Upload, FileCheck, Shield, CheckCircle, AlertTriangle, Sparkles } from "lucide-react";
import ImageReorder from "@/components/ImageReorder";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCountry } from "@/contexts/CountryContext";

const CreateListing = () => {
  const { user } = useAuth();
  const { country, config } = useCountry();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const makes = config.makes;
  const bodyTypes = config.bodyTypes;
  const fuelTypes = config.fuelTypes;
  const transmissions = config.transmissions;
  const editId = searchParams.get("edit");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logbookInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!editId);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // KYC: Logbook & HPI
  const [logbookFile, setLogbookFile] = useState<File | null>(null);
  const [existingLogbookUrl, setExistingLogbookUrl] = useState<string | null>(null);
  const [hpiCheckData, setHpiCheckData] = useState<any>(null);
  const [hpiLoading, setHpiLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    price: "",
    mileage: "",
    fuel_type: "",
    transmission: "",
    body_type: "",
    color: "",
    doors: "4",
    engine_size: "",
    registration: "",
    vin: "",
    description: "",
    location: "",
    video_url: "",
  });

  // Load existing listing for editing
  useEffect(() => {
    if (!editId || !user) return;
    const loadListing = async () => {
      const { data } = await supabase
        .from("car_listings")
        .select("*")
        .eq("id", editId)
        .eq("seller_id", user.id)
        .maybeSingle();

      if (data) {
        setForm({
          title: data.title || "",
          make: data.make || "",
          model: data.model || "",
          year: data.year,
          price: String(data.price),
          mileage: data.mileage ? String(data.mileage) : "",
          fuel_type: data.fuel_type || "",
          transmission: data.transmission || "",
          body_type: data.body_type || "",
          color: data.color || "",
          doors: data.doors ? String(data.doors) : "4",
          engine_size: data.engine_size || "",
          registration: data.registration || "",
          vin: data.vin || "",
          description: data.description || "",
          location: data.location || "",
          video_url: (data as any).video_url || "",
        });
        setExistingImages(data.images || []);
        setExistingLogbookUrl((data as any).logbook_url || null);
        setHpiCheckData((data as any).hpi_check_data || null);
      } else {
        toast({ title: "Listing not found", variant: "destructive" });
        navigate("/dashboard");
      }
      setPageLoading(false);
    };
    loadListing();
  }, [editId, user]);

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalCount = existingImages.length + images.length + files.length;
    if (totalCount > 20) {
      toast({ title: "Max 20 images", variant: "destructive" });
      return;
    }
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLogbookSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB for logbook upload.", variant: "destructive" });
      return;
    }
    setLogbookFile(file);
  };

  const runHpiCheck = async () => {
    if (!form.registration && !form.vin) {
      toast({ title: "Registration or VIN required", description: "Enter a registration number or VIN to run an HPI check.", variant: "destructive" });
      return;
    }
    setHpiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("hpi-check", {
        body: { registration: form.registration || undefined, vin: form.vin || undefined },
      });
      if (error) throw error;
      if (data?.success) {
        setHpiCheckData(data.data);
        toast({ title: "HPI Check Complete", description: data.data.stolen_reported ? "⚠️ Issues found — review results." : "✅ Vehicle passed all checks." });
      } else {
        toast({ title: "HPI Check Failed", description: data?.error || "Could not complete HPI check. You can still submit for review.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "HPI Check Unavailable", description: "The HPI service is currently unavailable. You can still submit — admin will verify manually.", variant: "destructive" });
    } finally {
      setHpiLoading(false);
    }
  };

  const handleSubmit = async (status: "draft" | "active") => {
    if (!user) return;
    if (!form.make || !form.model || !form.price) {
      toast({ title: "Please fill required fields (make, model, price)", variant: "destructive" });
      return;
    }

    // When publishing (not draft), require logbook
    if (status === "active" && !logbookFile && !existingLogbookUrl) {
      toast({ title: "Logbook Required", description: "Please upload a V5C logbook / ownership document before publishing.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Upload new images
      const uploadedUrls: string[] = [];
      for (const file of images) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("car-images")
          .upload(path, file);

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("car-images").getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      // Upload logbook if new
      let logbookUrl = existingLogbookUrl;
      if (logbookFile) {
        const ext = logbookFile.name.split(".").pop();
        const logbookPath = `${user.id}/logbook-${Date.now()}.${ext}`;
        const { error: logbookErr } = await supabase.storage
          .from("listing-documents")
          .upload(logbookPath, logbookFile);
        if (!logbookErr) {
          // For private bucket, store the path — admin will generate signed URL
          logbookUrl = logbookPath;
        }
      }

      const allImages = [...existingImages, ...uploadedUrls];
      const title = form.title || `${form.year} ${form.make} ${form.model}`;

      // Force under_review when publishing (admin must approve with logbook + HPI)
      const finalStatus = status === "active" ? "under_review" : status;

      const listingData: Record<string, any> = {
        title,
        make: form.make,
        model: form.model,
        year: form.year,
        price: parseFloat(form.price),
        mileage: form.mileage ? parseInt(form.mileage) : null,
        fuel_type: form.fuel_type || null,
        transmission: form.transmission || null,
        body_type: form.body_type || null,
        color: form.color || null,
        doors: form.doors ? parseInt(form.doors) : null,
        engine_size: form.engine_size || null,
        registration: form.registration || null,
        vin: form.vin || null,
        description: form.description || null,
        location: form.location || null,
        images: allImages,
        status: finalStatus,
        country,
        logbook_url: logbookUrl,
        hpi_check_data: hpiCheckData,
        video_url: form.video_url || null,
      };

      if (editId) {
        const { error } = await supabase.from("car_listings")
          .update(listingData as any)
          .eq("id", editId)
          .eq("seller_id", user.id);
        if (error) throw error;
        toast({ title: "Listing updated!" });
      } else {
        // Check if user is a dealer
        const { data: dealer } = await supabase
          .from("dealers").select("id").eq("user_id", user.id).maybeSingle();

        const { error } = await supabase.from("car_listings").insert({
          ...listingData,
          seller_id: user.id,
          dealer_id: dealer?.id || null,
        } as any);
        if (error) throw error;
        toast({ title: status === "draft" ? "Draft saved" : "Listing submitted for review!" });
      }

      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error saving listing", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const totalImages = existingImages.length + images.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
          {editId ? "Edit Listing" : "Create Listing"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {editId ? "Update your vehicle listing" : "Add a new vehicle to the marketplace"}
        </p>

        {/* Images */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Photos ({totalImages}/20)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">Drag and drop to reorder. First image is the cover photo.</p>
            <ImageReorder
              existingImages={existingImages}
              newPreviews={imagePreviews}
              onReorderExisting={(imgs) => setExistingImages(imgs)}
              onReorderNew={(indices) => {
                setImages((prev) => indices.map((i) => prev[i]));
                setImagePreviews((prev) => indices.map((i) => prev[i]));
              }}
              onRemoveExisting={removeExistingImage}
              onRemoveNew={removeNewImage}
              onAddClick={() => fileInputRef.current?.click()}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
          </CardContent>
        </Card>

        {/* Vehicle Details */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Make *</Label>
                <Select value={form.make} onValueChange={(v) => updateField("make", v)}>
                  <SelectTrigger><SelectValue placeholder="Select make" /></SelectTrigger>
                  <SelectContent>
                    {makes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Model *</Label>
                <Input placeholder="e.g. A4, 3 Series" value={form.model} onChange={(e) => updateField("model", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Year</Label>
                <Input type="number" value={form.year} onChange={(e) => updateField("year", parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Price ({config.currency.symbol}) *</Label>
                <Input type="number" placeholder="25000" value={form.price} onChange={(e) => updateField("price", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Mileage</Label>
                <Input type="number" placeholder="45000" value={form.mileage} onChange={(e) => updateField("mileage", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Fuel Type</Label>
                <Select value={form.fuel_type} onValueChange={(v) => updateField("fuel_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transmission</Label>
                <Select value={form.transmission} onValueChange={(v) => updateField("transmission", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {transmissions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Body Type</Label>
                <Select value={form.body_type} onValueChange={(v) => updateField("body_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {bodyTypes.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Color</Label>
                <Input placeholder="e.g. Silver" value={form.color} onChange={(e) => updateField("color", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Doors</Label>
                <Select value={form.doors} onValueChange={(v) => updateField("doors", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["2", "3", "4", "5"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Engine Size</Label>
                <Input placeholder="e.g. 2.0L" value={form.engine_size} onChange={(e) => updateField("engine_size", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom Title (optional)</Label>
              <Input placeholder="Auto-generated from make/model/year if blank" value={form.title} onChange={(e) => updateField("title", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Identification & Location */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Identification & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{config.terminology.registration}</Label>
                <Input placeholder={country === "US" ? "e.g. ABC 1234" : country === "AE" ? "e.g. A 12345" : "e.g. AB12 CDE"} value={form.registration} onChange={(e) => updateField("registration", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>VIN</Label>
                <Input placeholder="Vehicle Identification Number" value={form.vin} onChange={(e) => updateField("vin", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder={config.popularCities[0] ? `e.g. ${config.popularCities[0]}` : "e.g. London"} value={form.location} onChange={(e) => updateField("location", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Description & Media */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Description & Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Description</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!form.make || !form.model) {
                      toast({ title: "Fill in make and model first", variant: "destructive" });
                      return;
                    }
                    setAiLoading(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("generate-description", {
                        body: {
                          make: form.make, model: form.model, year: form.year,
                          mileage: form.mileage, fuel_type: form.fuel_type,
                          transmission: form.transmission, body_type: form.body_type,
                          color: form.color, engine_size: form.engine_size, price: form.price,
                        },
                      });
                      if (error) throw error;
                      if (data?.description) {
                        updateField("description", data.description);
                        toast({ title: "Description generated!" });
                      } else if (data?.error) {
                        toast({ title: "AI Error", description: data.error, variant: "destructive" });
                      }
                    } catch (err: any) {
                      toast({ title: "Could not generate description", description: err.message, variant: "destructive" });
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                  disabled={aiLoading || !form.make || !form.model}
                >
                  {aiLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                  AI Write
                </Button>
              </div>
              <Textarea
                rows={5}
                placeholder="Describe your vehicle — condition, history, features, reason for selling..."
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label>Video (optional)</Label>
              <div className="space-y-2">
                <Input
                  placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                  value={form.video_url}
                  onChange={(e) => updateField("video_url", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Paste a YouTube URL, or upload a video file (max 100MB)</p>
              </div>
              <div className="flex items-center gap-3">
                {videoFile && (
                  <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                    <CheckCircle className="h-4 w-4" /> {videoFile.name}
                    <button type="button" onClick={() => setVideoFile(null)} className="ml-1 text-muted-foreground hover:text-destructive">✕</button>
                  </div>
                )}
                {!form.video_url && (
                  <Button type="button" variant="outline" size="sm" onClick={() => videoInputRef.current?.click()}>
                    <Upload className="mr-1 h-4 w-4" /> Upload Video
                  </Button>
                )}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 100 * 1024 * 1024) {
                      toast({ title: "Video too large", description: "Max 100MB for video uploads.", variant: "destructive" });
                      return;
                    }
                    setVideoFile(file);
                    updateField("video_url", ""); // clear YouTube URL if uploading
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KYC: Logbook & HPI Check */}
        <Card className="mt-4 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" /> Verification Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Logbook Upload */}
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium">
                <FileCheck className="h-4 w-4" /> V5C Log Book / Ownership Document *
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload your vehicle logbook (V5C) or ownership certificate. Required before your listing can go live.
              </p>
              <div className="mt-2 flex items-center gap-3">
                {existingLogbookUrl ? (
                  <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                    <CheckCircle className="h-4 w-4" /> Logbook uploaded
                  </div>
                ) : logbookFile ? (
                  <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                    <CheckCircle className="h-4 w-4" /> {logbookFile.name}
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logbookInputRef.current?.click()}
                >
                  <Upload className="mr-1 h-4 w-4" /> {existingLogbookUrl || logbookFile ? "Replace" : "Upload"}
                </Button>
                <input
                  ref={logbookInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={handleLogbookSelect}
                />
              </div>
            </div>

            {/* HPI Check */}
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4" /> HPI / Vehicle History Check
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Run an HPI check to verify the vehicle has no outstanding finance, theft records, or write-off history.
              </p>
              <div className="mt-2 flex items-center gap-3">
                {hpiCheckData ? (
                  <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                    hpiCheckData.stolen_reported || hpiCheckData.finance_outstanding || hpiCheckData.write_off
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-success/40 bg-success/10 text-success"
                  }`}>
                    {hpiCheckData.stolen_reported || hpiCheckData.finance_outstanding || hpiCheckData.write_off ? (
                      <><AlertTriangle className="h-4 w-4" /> Issues found</>
                    ) : (
                      <><CheckCircle className="h-4 w-4" /> All clear</>
                    )}
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={runHpiCheck}
                  disabled={hpiLoading || (!form.registration && !form.vin)}
                >
                  {hpiLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Shield className="mr-1 h-4 w-4" />}
                  {hpiCheckData ? "Re-run HPI Check" : "Run HPI Check"}
                </Button>
              </div>
              {!form.registration && !form.vin && (
                <p className="mt-1 text-xs text-muted-foreground">Enter a registration or VIN above to enable HPI check.</p>
              )}
            </div>

            <div className="rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
              <strong>Note:</strong> All listings are submitted for admin review. Your listing will go live once the logbook and vehicle history have been verified by our team.
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => handleSubmit("draft")} disabled={loading}>
            Save as Draft
          </Button>
          <Button className="gradient-primary flex-1 border-0" onClick={() => handleSubmit("active")} disabled={loading}>
            {loading ? "Saving..." : editId ? "Update & Submit for Review" : "Submit for Review"}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreateListing;
