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
import { ArrowRight, Loader2 } from "lucide-react";
import ImageReorder from "@/components/ImageReorder";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const makes = [
  "Audi", "BMW", "Chevrolet", "Ford", "Honda", "Hyundai", "Jaguar",
  "Kia", "Land Rover", "Lexus", "Mazda", "Mercedes-Benz", "Nissan",
  "Porsche", "Range Rover", "Tesla", "Toyota", "Volkswagen", "Volvo",
];

const bodyTypes = ["Sedan", "SUV", "Coupe", "Hatchback", "Estate", "Convertible", "Van", "Pickup"];
const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid"];
const transmissions = ["Automatic", "Manual"];

const CreateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!editId);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

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
        });
        setExistingImages(data.images || []);
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

  const handleSubmit = async (status: "draft" | "active") => {
    if (!user) return;
    if (!form.make || !form.model || !form.price) {
      toast({ title: "Please fill required fields (make, model, price)", variant: "destructive" });
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

      const allImages = [...existingImages, ...uploadedUrls];
      const title = form.title || `${form.year} ${form.make} ${form.model}`;

      const listingData = {
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
        status,
      };

      if (editId) {
        const { error } = await supabase.from("car_listings")
          .update(listingData)
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
        });
        if (error) throw error;
        toast({ title: status === "draft" ? "Draft saved" : "Listing published!" });
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
                <Label>Price (£) *</Label>
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
                <Label>Registration</Label>
                <Input placeholder="e.g. AB12 CDE" value={form.registration} onChange={(e) => updateField("registration", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>VIN</Label>
                <Input placeholder="Vehicle Identification Number" value={form.vin} onChange={(e) => updateField("vin", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="e.g. London, UK" value={form.location} onChange={(e) => updateField("location", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={5}
              placeholder="Describe your vehicle — condition, history, features, reason for selling..."
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => handleSubmit("draft")} disabled={loading}>
            Save as Draft
          </Button>
          <Button className="gradient-primary flex-1 border-0" onClick={() => handleSubmit("active")} disabled={loading}>
            {loading ? "Saving..." : editId ? "Update Listing" : "Publish Listing"}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreateListing;
