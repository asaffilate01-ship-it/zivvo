import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, Loader2, Upload, FileCheck, Shield, CheckCircle, AlertTriangle, Sparkles, FileText, IdCard, Banknote } from "lucide-react";
import ImageReorder from "@/components/ImageReorder";
import VrmAutofill from "@/components/VrmAutofill";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCountry } from "@/contexts/CountryContext";

const CreateListing = () => {
  const { t } = useTranslation();
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Ownership & finance verification
  const [photoIdFile, setPhotoIdFile] = useState<File | null>(null);
  const [existingPhotoIdUrl, setExistingPhotoIdUrl] = useState<string | null>(null);
  const [consignmentFile, setConsignmentFile] = useState<File | null>(null);
  const [existingConsignmentUrl, setExistingConsignmentUrl] = useState<string | null>(null);
  const [tradeInvoiceFile, setTradeInvoiceFile] = useState<File | null>(null);
  const [existingTradeInvoiceUrl, setExistingTradeInvoiceUrl] = useState<string | null>(null);
  const [financeLetterFile, setFinanceLetterFile] = useState<File | null>(null);
  const [existingFinanceLetterUrl, setExistingFinanceLetterUrl] = useState<string | null>(null);
  const photoIdInputRef = useRef<HTMLInputElement>(null);
  const consignmentInputRef = useRef<HTMLInputElement>(null);
  const tradeInvoiceInputRef = useRef<HTMLInputElement>(null);
  const financeLetterInputRef = useRef<HTMLInputElement>(null);

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
    vat_qualifying: false,
    sale_type: "own" as "own" | "consignment" | "trade",
    owner_name: "",
    owner_address: "",
    finance_outstanding: false,
    finance_lender: "",
    finance_settlement_amount: "",
    truth_declaration_accepted: false,
    // DE mandatory disclosures (Pkw-EnVKV, StVZO)
    co2_emissions: "",
    fuel_consumption_combined: "",
    emission_class: "",
    environmental_badge: "",
    hu_expiry: "",
    first_registration: "",
    hsn: "",
    tsn: "",
    previous_owners: "",
    warranty_months: "",
    accident_free: true,
    non_smoker: false,
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
          vat_qualifying: !!(data as any).vat_qualifying,
          sale_type: ((data as any).sale_type || "own") as "own" | "consignment" | "trade",
          owner_name: (data as any).owner_name || "",
          owner_address: (data as any).owner_address || "",
          finance_outstanding: !!(data as any).finance_outstanding,
          finance_lender: (data as any).finance_lender || "",
          finance_settlement_amount: (data as any).finance_settlement_amount ? String((data as any).finance_settlement_amount) : "",
          truth_declaration_accepted: !!(data as any).truth_declaration_accepted,
          co2_emissions: (data as any).co2_emissions != null ? String((data as any).co2_emissions) : "",
          fuel_consumption_combined: (data as any).fuel_consumption_combined != null ? String((data as any).fuel_consumption_combined) : "",
          emission_class: (data as any).emission_class || "",
          environmental_badge: (data as any).environmental_badge || "",
          hu_expiry: (data as any).hu_expiry || "",
          first_registration: (data as any).first_registration || "",
          hsn: (data as any).hsn || "",
          tsn: (data as any).tsn || "",
          previous_owners: (data as any).previous_owners != null ? String((data as any).previous_owners) : "",
          warranty_months: (data as any).warranty_months != null ? String((data as any).warranty_months) : "",
          accident_free: (data as any).accident_free ?? true,
          non_smoker: !!(data as any).non_smoker,
        });
        setExistingImages(data.images || []);
        setExistingLogbookUrl((data as any).logbook_url || null);
        setHpiCheckData((data as any).hpi_check_data || null);
        setExistingPhotoIdUrl((data as any).photo_id_url || null);
        setExistingConsignmentUrl((data as any).consignment_agreement_url || null);
        setExistingTradeInvoiceUrl((data as any).trade_invoice_url || null);
        setExistingFinanceLetterUrl((data as any).finance_settlement_letter_url || null);
      } else {
        toast({ title: t("createListing.listingNotFound"), variant: "destructive" });
        navigate("/dashboard");
      }
      setPageLoading(false);
    };
    loadListing();
  }, [editId, user]);

  const updateField = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalCount = existingImages.length + images.length + files.length;
    if (totalCount > 20) {
      toast({ title: t("createListing.maxImages"), variant: "destructive" });
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

  const makeFileSelectHandler = (
    setter: (f: File | null) => void,
    label: string,
    maxMb = 10
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      toast({ title: t("createListing.fileTooLarge"), description: t("createListing.fileTooLargeDesc", { maxMb, label }), variant: "destructive" });
      return;
    }
    setter(file);
  };

  const handleLogbookSelect = makeFileSelectHandler(setLogbookFile, "logbook upload");
  const handlePhotoIdSelect = makeFileSelectHandler(setPhotoIdFile, "photo ID");
  const handleConsignmentSelect = makeFileSelectHandler(setConsignmentFile, "consignment agreement");
  const handleTradeInvoiceSelect = makeFileSelectHandler(setTradeInvoiceFile, "trade invoice");
  const handleFinanceLetterSelect = makeFileSelectHandler(setFinanceLetterFile, "settlement letter");

  const uploadDocIfNew = async (file: File | null, prefix: string, existingPath: string | null): Promise<string | null> => {
    if (!file) return existingPath;
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("listing-documents").upload(path, file);
    return error ? existingPath : path;
  };

  const runHpiCheck = async () => {
    if (!form.registration && !form.vin) {
      toast({ title: t("createListing.regOrVinRequired"), description: t("createListing.regOrVinRequiredDesc"), variant: "destructive" });
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
        toast({ title: t("createListing.hpiComplete"), description: data.data.stolen_reported ? t("createListing.hpiIssuesFound") : t("createListing.hpiPassed") });
      } else {
        toast({ title: t("createListing.hpiFailed"), description: data?.error || t("createListing.hpiFailedDesc"), variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: t("createListing.hpiUnavailable"), description: t("createListing.hpiUnavailableDesc"), variant: "destructive" });
    } finally {
      setHpiLoading(false);
    }
  };

  const handleSubmit = async (status: "draft" | "active") => {
    if (!user) return;
    if (!form.make || !form.model || !form.price) {
      toast({ title: t("createListing.requiredFields"), variant: "destructive" });
      return;
    }

    // When publishing (not draft), enforce verification requirements
    if (status === "active") {
      if (!logbookFile && !existingLogbookUrl) {
        toast({ title: t("createListing.logbookRequired"), description: t("createListing.logbookRequiredDesc"), variant: "destructive" });
        return;
      }
      if (!photoIdFile && !existingPhotoIdUrl) {
        toast({ title: t("createListing.photoIdRequired"), description: t("createListing.photoIdRequiredDesc"), variant: "destructive" });
        return;
      }
      if (form.sale_type === "consignment") {
        if (!form.owner_name.trim() || !form.owner_address.trim()) {
          toast({ title: t("createListing.ownerDetailsRequired"), description: t("createListing.ownerDetailsRequiredDesc"), variant: "destructive" });
          return;
        }
        if (!consignmentFile && !existingConsignmentUrl) {
          toast({ title: t("createListing.consignmentAgreementRequired"), description: t("createListing.consignmentAgreementRequiredDesc"), variant: "destructive" });
          return;
        }
      }
      if (form.sale_type === "trade" && !tradeInvoiceFile && !existingTradeInvoiceUrl) {
        toast({ title: t("createListing.tradeInvoiceRequired"), description: t("createListing.tradeInvoiceRequiredDesc"), variant: "destructive" });
        return;
      }
      if (form.finance_outstanding) {
        if (!form.finance_lender.trim()) {
          toast({ title: t("createListing.lenderRequired"), description: t("createListing.lenderRequiredDesc"), variant: "destructive" });
          return;
        }
        if (!financeLetterFile && !existingFinanceLetterUrl) {
          toast({ title: t("createListing.settlementLetterRequired"), description: t("createListing.settlementLetterRequiredDesc"), variant: "destructive" });
          return;
        }
      }
      if (!form.truth_declaration_accepted) {
        toast({ title: t("createListing.declarationRequired"), description: t("createListing.declarationRequiredDesc"), variant: "destructive" });
        return;
      }
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

      // Upload verification documents to private bucket
      const logbookUrl = await uploadDocIfNew(logbookFile, "logbook", existingLogbookUrl);
      const photoIdUrl = await uploadDocIfNew(photoIdFile, "photo-id", existingPhotoIdUrl);
      const consignmentUrl = form.sale_type === "consignment"
        ? await uploadDocIfNew(consignmentFile, "consignment", existingConsignmentUrl)
        : existingConsignmentUrl;
      const tradeInvoiceUrl = form.sale_type === "trade"
        ? await uploadDocIfNew(tradeInvoiceFile, "trade-invoice", existingTradeInvoiceUrl)
        : existingTradeInvoiceUrl;
      const financeLetterUrl = form.finance_outstanding
        ? await uploadDocIfNew(financeLetterFile, "finance-letter", existingFinanceLetterUrl)
        : existingFinanceLetterUrl;

      // Upload video file if provided
      let videoUrl = form.video_url || null;
      if (videoFile) {
        const ext = videoFile.name.split(".").pop();
        const videoPath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: videoErr } = await supabase.storage
          .from("car-videos")
          .upload(videoPath, videoFile);
        if (!videoErr) {
          const { data: vUrlData } = supabase.storage.from("car-videos").getPublicUrl(videoPath);
          videoUrl = vUrlData.publicUrl;
        }
      }

      const allImages = [...existingImages, ...uploadedUrls];
      const title = form.title || `${form.year} ${form.make} ${form.model}`;

      // Force under_review when publishing (admin must approve with logbook + HPI)
      const finalStatus = status === "active" ? "under_review" : status;

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
        latitude,
        longitude,
        images: allImages,
        status: finalStatus,
        country,
        logbook_url: logbookUrl,
        hpi_check_data: hpiCheckData,
        video_url: videoUrl,
        vat_qualifying: !!form.vat_qualifying,
        sale_type: form.sale_type,
        owner_name: form.sale_type === "consignment" ? (form.owner_name || null) : null,
        owner_address: form.sale_type === "consignment" ? (form.owner_address || null) : null,
        consignment_agreement_url: consignmentUrl,
        photo_id_url: photoIdUrl,
        trade_invoice_url: tradeInvoiceUrl,
        finance_outstanding: !!form.finance_outstanding,
        finance_lender: form.finance_outstanding ? (form.finance_lender || null) : null,
        finance_settlement_amount: form.finance_outstanding && form.finance_settlement_amount ? parseFloat(form.finance_settlement_amount) : null,
        finance_settlement_letter_url: financeLetterUrl,
        truth_declaration_accepted: !!form.truth_declaration_accepted,
        truth_declaration_at: form.truth_declaration_accepted ? new Date().toISOString() : null,
        co2_emissions: form.co2_emissions ? parseInt(form.co2_emissions) : null,
        fuel_consumption_combined: form.fuel_consumption_combined ? parseFloat(form.fuel_consumption_combined) : null,
        emission_class: form.emission_class || null,
        environmental_badge: form.environmental_badge || null,
        hu_expiry: form.hu_expiry || null,
        first_registration: form.first_registration || null,
        hsn: form.hsn || null,
        tsn: form.tsn || null,
        previous_owners: form.previous_owners ? parseInt(form.previous_owners) : null,
        warranty_months: form.warranty_months ? parseInt(form.warranty_months) : null,
        accident_free: !!form.accident_free,
        non_smoker: !!form.non_smoker,
      };

      if (editId) {
        const { error } = await supabase.from("car_listings")
          .update(listingData as any)
          .eq("id", editId)
          .eq("seller_id", user.id);
        if (error) throw error;
        toast({ title: t("createListing.listingUpdated") });
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
        toast({ title: status === "draft" ? t("createListing.draftSaved") : t("createListing.listingSubmitted") });
      }

      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: t("createListing.errorSavingListing"), description: err.message, variant: "destructive" });
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
          {editId ? t("createListing.editTitle") : t("createListing.createTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {editId ? t("createListing.editSubtitle") : t("createListing.createSubtitle")}
        </p>

        {/* Images */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">{t("createListing.photos", { count: totalImages })}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">{t("createListing.dragToReorder")}</p>
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
            <CardTitle className="text-base">{t("createListing.vehicleDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("createListing.make")}</Label>
                <Select value={form.make} onValueChange={(v) => updateField("make", v)}>
                  <SelectTrigger><SelectValue placeholder={t("createListing.selectMake")} /></SelectTrigger>
                  <SelectContent>
                    {makes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("createListing.model")}</Label>
                <Input placeholder={t("createListing.modelPlaceholder")} value={form.model} onChange={(e) => updateField("model", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("createListing.year")}</Label>
                <Input type="number" value={form.year} onChange={(e) => updateField("year", parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>{t("createListing.price", { symbol: config.currency.symbol })}</Label>
                <Input type="number" placeholder="25000" value={form.price} onChange={(e) => updateField("price", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("createListing.mileage")}</Label>
                <Input type="number" placeholder="45000" value={form.mileage} onChange={(e) => updateField("mileage", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("createListing.fuelType")}</Label>
                <Select value={form.fuel_type} onValueChange={(v) => updateField("fuel_type", v)}>
                  <SelectTrigger><SelectValue placeholder={t("createListing.select")} /></SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("createListing.transmission")}</Label>
                <Select value={form.transmission} onValueChange={(v) => updateField("transmission", v)}>
                  <SelectTrigger><SelectValue placeholder={t("createListing.select")} /></SelectTrigger>
                  <SelectContent>
                    {transmissions.map((tr) => <SelectItem key={tr} value={tr}>{tr}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("createListing.bodyType")}</Label>
                <Select value={form.body_type} onValueChange={(v) => updateField("body_type", v)}>
                  <SelectTrigger><SelectValue placeholder={t("createListing.select")} /></SelectTrigger>
                  <SelectContent>
                    {bodyTypes.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("createListing.color")}</Label>
                <Input placeholder={t("createListing.colorPlaceholder")} value={form.color} onChange={(e) => updateField("color", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("createListing.doors")}</Label>
                <Select value={form.doors} onValueChange={(v) => updateField("doors", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["2", "3", "4", "5"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("createListing.engineSize")}</Label>
                <Input placeholder={t("createListing.engineSizePlaceholder")} value={form.engine_size} onChange={(e) => updateField("engine_size", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("createListing.customTitle")}</Label>
              <Input placeholder={t("createListing.customTitlePlaceholder")} value={form.title} onChange={(e) => updateField("title", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Identification & Location */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">{t("createListing.identificationLocation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {country === "DE" && (
              <VrmAutofill
                value={form.registration}
                onChange={(reg) => updateField("registration", reg)}
                onAutofill={(d) => {
                  setForm((prev) => ({
                    ...prev,
                    registration: d.registration || prev.registration,
                    make: d.make || prev.make,
                    year: d.year_of_manufacture || prev.year,
                    color: d.colour ? d.colour.charAt(0) + d.colour.slice(1).toLowerCase() : prev.color,
                    fuel_type:
                      d.fuel_type === "PETROL" ? "Petrol" :
                      d.fuel_type === "DIESEL" ? "Diesel" :
                      d.fuel_type === "ELECTRICITY" ? "Electric" :
                      d.fuel_type === "HYBRID ELECTRIC" ? "Hybrid" :
                      d.fuel_type ? d.fuel_type.charAt(0) + d.fuel_type.slice(1).toLowerCase() : prev.fuel_type,
                    engine_size: d.engine_capacity || prev.engine_size,
                  }));
                }}
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{config.terminology.registration}</Label>
                <Input placeholder={t("createListing.registrationPlaceholder")} value={form.registration} onChange={(e) => updateField("registration", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("createListing.vin")}</Label>
                <Input placeholder={t("createListing.vinPlaceholder")} value={form.vin} onChange={(e) => updateField("vin", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("createListing.location")}</Label>
              <Input placeholder={t("createListing.locationPlaceholder", { city: config.popularCities[0] || "London" })} value={form.location} onChange={(e) => updateField("location", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Description & Media */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">{t("createListing.descriptionMedia")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.vat_qualifying}
                onChange={(e) => updateField("vat_qualifying", e.target.checked as any)}
              />
              <span className="text-sm">
                <span className="font-medium">{t("createListing.vatQualifying")}</span>
                <span className="block text-xs text-muted-foreground">{t("createListing.vatQualifyingDesc")}</span>
              </span>
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("createListing.descriptionLabel")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!form.make || !form.model) {
                      toast({ title: t("createListing.fillMakeModelFirst"), variant: "destructive" });
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
                        toast({ title: t("createListing.descriptionGenerated") });
                      } else if (data?.error) {
                        toast({ title: t("createListing.aiError"), description: data.error, variant: "destructive" });
                      }
                    } catch (err: any) {
                      toast({ title: t("createListing.couldNotGenerateDescription"), description: err.message, variant: "destructive" });
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                  disabled={aiLoading || !form.make || !form.model}
                >
                  {aiLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                  {t("createListing.aiWrite")}
                </Button>
              </div>
              <Textarea
                rows={5}
                placeholder={t("createListing.descriptionPlaceholder")}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label>{t("createListing.videoOptional")}</Label>
              <div className="space-y-2">
                <Input
                  placeholder={t("createListing.videoUrlPlaceholder")}
                  value={form.video_url}
                  onChange={(e) => updateField("video_url", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t("createListing.videoHint")}</p>
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
                    <Upload className="mr-1 h-4 w-4" /> {t("createListing.uploadVideo")}
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
                      toast({ title: t("createListing.videoTooLarge"), description: t("createListing.videoTooLargeDesc"), variant: "destructive" });
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
              <Shield className="h-4 w-4 text-primary" /> {t("createListing.verificationDocuments")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sale Type */}
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" /> {t("createListing.howSelling")}
              </Label>
              <RadioGroup
                value={form.sale_type}
                onValueChange={(v) => updateField("sale_type", v)}
                className="mt-2 grid gap-2 sm:grid-cols-3"
              >
                {[
                  { value: "own", label: t("createListing.saleType.ownLabel"), desc: t("createListing.saleType.ownDesc") },
                  { value: "consignment", label: t("createListing.saleType.consignmentLabel"), desc: t("createListing.saleType.consignmentDesc") },
                  { value: "trade", label: t("createListing.saleType.tradeLabel"), desc: t("createListing.saleType.tradeDesc") },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm transition-all ${
                      form.sale_type === opt.value ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <RadioGroupItem value={opt.value} className="mt-0.5" />
                    <div>
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Logbook Upload */}
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium">
                <FileCheck className="h-4 w-4" /> {t("createListing.logbookLabel")}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {form.sale_type === "consignment"
                  ? t("createListing.logbookDescConsignment")
                  : t("createListing.logbookDescOwn")}
              </p>
              <div className="mt-2 flex items-center gap-3">
                {existingLogbookUrl || logbookFile ? (
                  <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                    <CheckCircle className="h-4 w-4" /> {logbookFile?.name || t("createListing.uploaded")}
                  </div>
                ) : null}
                <Button type="button" variant="outline" size="sm" onClick={() => logbookInputRef.current?.click()}>
                  <Upload className="mr-1 h-4 w-4" /> {existingLogbookUrl || logbookFile ? t("createListing.replace") : t("createListing.upload")}
                </Button>
                <input ref={logbookInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleLogbookSelect} />
              </div>
            </div>

            {/* Photo ID */}
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium">
                <IdCard className="h-4 w-4" /> {t("createListing.photoIdLabel")}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("createListing.photoIdDesc")}
              </p>
              <div className="mt-2 flex items-center gap-3">
                {existingPhotoIdUrl || photoIdFile ? (
                  <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                    <CheckCircle className="h-4 w-4" /> {photoIdFile?.name || t("createListing.uploaded")}
                  </div>
                ) : null}
                <Button type="button" variant="outline" size="sm" onClick={() => photoIdInputRef.current?.click()}>
                  <Upload className="mr-1 h-4 w-4" /> {existingPhotoIdUrl || photoIdFile ? t("createListing.replace") : t("createListing.upload")}
                </Button>
                <input ref={photoIdInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handlePhotoIdSelect} />
              </div>
            </div>

            {/* Consignment-specific */}
            {form.sale_type === "consignment" && (
              <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm font-medium">{t("createListing.consignmentDetails")}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">{t("createListing.ownerFullName")}</Label>
                    <Input
                      value={form.owner_name}
                      onChange={(e) => updateField("owner_name", e.target.value)}
                      placeholder={t("createListing.ownerFullNamePlaceholder")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("createListing.ownerAddress")}</Label>
                    <Input
                      value={form.owner_address}
                      onChange={(e) => updateField("owner_address", e.target.value)}
                      placeholder={t("createListing.ownerAddressPlaceholder")}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-xs">
                    <FileText className="h-3.5 w-3.5" /> {t("createListing.consignmentAgreementLabel")}
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("createListing.consignmentAgreementDesc")}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    {existingConsignmentUrl || consignmentFile ? (
                      <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                        <CheckCircle className="h-4 w-4" /> {consignmentFile?.name || t("createListing.uploaded")}
                      </div>
                    ) : null}
                    <Button type="button" variant="outline" size="sm" onClick={() => consignmentInputRef.current?.click()}>
                      <Upload className="mr-1 h-4 w-4" /> {existingConsignmentUrl || consignmentFile ? t("createListing.replace") : t("createListing.upload")}
                    </Button>
                    <input ref={consignmentInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleConsignmentSelect} />
                  </div>
                </div>
              </div>
            )}

            {/* Trade-specific */}
            {form.sale_type === "trade" && (
              <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-4">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" /> {t("createListing.tradeInvoiceLabel")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("createListing.tradeInvoiceDesc")}
                </p>
                <div className="flex items-center gap-3">
                  {existingTradeInvoiceUrl || tradeInvoiceFile ? (
                    <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                      <CheckCircle className="h-4 w-4" /> {tradeInvoiceFile?.name || t("createListing.uploaded")}
                    </div>
                  ) : null}
                  <Button type="button" variant="outline" size="sm" onClick={() => tradeInvoiceInputRef.current?.click()}>
                    <Upload className="mr-1 h-4 w-4" /> {existingTradeInvoiceUrl || tradeInvoiceFile ? t("createListing.replace") : t("createListing.upload")}
                  </Button>
                  <input ref={tradeInvoiceInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleTradeInvoiceSelect} />
                </div>
              </div>
            )}

            {/* Finance Disclosure */}
            <div className="space-y-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-4">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Banknote className="h-4 w-4 text-amber-500" /> {t("createListing.financeDeclarationLabel")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("createListing.financeDeclarationDesc")}
              </p>
              <RadioGroup
                value={form.finance_outstanding ? "yes" : "no"}
                onValueChange={(v) => updateField("finance_outstanding", v === "yes")}
                className="grid gap-2 sm:grid-cols-2"
              >
                {[
                  { value: "no", label: t("createListing.financeNo") },
                  { value: "yes", label: t("createListing.financeYes") },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition-all ${
                      (form.finance_outstanding ? "yes" : "no") === opt.value ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <RadioGroupItem value={opt.value} />
                    {opt.label}
                  </label>
                ))}
              </RadioGroup>

              {form.finance_outstanding && (
                <div className="space-y-3 border-t border-amber-500/20 pt-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">{t("createListing.financeLender")}</Label>
                      <Input
                        value={form.finance_lender}
                        onChange={(e) => updateField("finance_lender", e.target.value)}
                        placeholder={t("createListing.financeLenderPlaceholder")}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{t("createListing.settlementAmount", { symbol: config.currency.symbol })}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.finance_settlement_amount}
                        onChange={(e) => updateField("finance_settlement_amount", e.target.value)}
                        placeholder="0.00"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 text-xs">
                      <FileText className="h-3.5 w-3.5" /> {t("createListing.settlementLetterLabel")}
                    </Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("createListing.settlementLetterDesc")}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      {existingFinanceLetterUrl || financeLetterFile ? (
                        <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                          <CheckCircle className="h-4 w-4" /> {financeLetterFile?.name || t("createListing.uploaded")}
                        </div>
                      ) : null}
                      <Button type="button" variant="outline" size="sm" onClick={() => financeLetterInputRef.current?.click()}>
                        <Upload className="mr-1 h-4 w-4" /> {existingFinanceLetterUrl || financeLetterFile ? t("createListing.replace") : t("createListing.upload")}
                      </Button>
                      <input ref={financeLetterInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFinanceLetterSelect} />
                    </div>
                  </div>
                </div>
              )}
            </div>


            <div>
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4" /> {t("createListing.hpiCheckLabel")}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("createListing.hpiCheckDesc")}
              </p>
              <div className="mt-2 flex items-center gap-3">
                {hpiCheckData ? (
                  <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                    hpiCheckData.stolen_reported || hpiCheckData.finance_outstanding || hpiCheckData.write_off
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-success/40 bg-success/10 text-success"
                  }`}>
                    {hpiCheckData.stolen_reported || hpiCheckData.finance_outstanding || hpiCheckData.write_off ? (
                      <><AlertTriangle className="h-4 w-4" /> {t("createListing.issuesFound")}</>
                    ) : (
                      <><CheckCircle className="h-4 w-4" /> {t("createListing.allClear")}</>
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
                  {hpiCheckData ? t("createListing.rerunHpiCheck") : t("createListing.runHpiCheck")}
                </Button>
              </div>
              {!form.registration && !form.vin && (
                <p className="mt-1 text-xs text-muted-foreground">{t("createListing.enterRegOrVin")}</p>
              )}
            </div>

            {/* Truth Declaration */}
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-primary/30 bg-primary/5 p-4">
              <Checkbox
                checked={form.truth_declaration_accepted}
                onCheckedChange={(v) => updateField("truth_declaration_accepted", !!v)}
                className="mt-0.5"
              />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{t("createListing.truthDeclarationTitle")}</p>
                <p className="mt-1">
                  {t("createListing.truthDeclarationBody")}
                </p>
              </div>
            </label>

            <div className="rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
              <strong>{t("createListing.note")}</strong> {t("createListing.reviewNote")}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => handleSubmit("draft")} disabled={loading}>
            {t("createListing.saveAsDraft")}
          </Button>
          <Button className="gradient-primary flex-1 border-0" onClick={() => handleSubmit("active")} disabled={loading}>
            {loading ? t("createListing.saving") : editId ? t("createListing.updateAndSubmit") : t("createListing.submitForReview")}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreateListing;
