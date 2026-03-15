import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Heart, Share2, Phone, Mail, MapPin, Calendar,
  Gauge, Fuel, Settings2, Shield, BadgeCheck, ExternalLink,
  ChevronLeft, ChevronRight, AlertTriangle, Car, FileCheck, Loader2,
  MessageCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSavedCars } from "@/contexts/SavedCarsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import EnquiryForm from "@/components/EnquiryForm";

const CarDetail = () => {
  const { id } = useParams();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [dealer, setDealer] = useState<any>(null);
  const { isSaved, toggle } = useSavedCars();
  const { user } = useAuth();
  const { toast } = useToast();
  const liked = car ? isSaved(car.id) : false;

  useEffect(() => {
    const fetchCar = async () => {
      const { data } = await supabase
        .from("car_listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        setCar(data);
        // Log view to listing_views table for analytics
        supabase.from("listing_views").insert({ listing_id: id, viewer_id: user?.id || null }).then();
        // Also increment the aggregate counter
        supabase.from("car_listings").update({ views_count: (data.views_count || 0) + 1 }).eq("id", id).then();
        // fetch dealer info if applicable
        if (data.dealer_id) {
          const { data: d } = await supabase.from("dealers").select("business_name, slug, city, business_phone, business_email").eq("id", data.dealer_id).maybeSingle();
          if (d) setDealer(d);
        }
      }
      setLoading(false);
    };
    fetchCar();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex flex-col items-center justify-center px-4 py-32 text-center">
          <Car className="h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Vehicle Not Found</h1>
          <p className="mt-2 text-muted-foreground">This listing may have been removed or sold.</p>
          <Link to="/browse">
            <Button className="mt-6 gradient-primary border-0">Browse All Cars</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = car.images?.length ? car.images : ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80"];
  const specs = (car.specs as Record<string, any>) || {};
  const sellerName = dealer?.business_name || "Private Seller";
  const sellerLocation = car.location || dealer?.city || "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/browse" className="hover:text-primary">Browse</Link>
          <span>/</span>
          <span className="text-foreground">{car.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-2xl">
              <motion.img
                key={currentImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={images[currentImage]}
                alt={car.title}
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />

              {images.length > 1 && (
                <>
                  <Button variant="ghost" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm" onClick={() => setCurrentImage((p) => (p === 0 ? images.length - 1 : p - 1))}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm" onClick={() => setCurrentImage((p) => (p === images.length - 1 ? 0 : p + 1))}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}

              <div className="absolute left-3 top-3 flex gap-2">
                {car.is_featured && <Badge className="gradient-primary border-0 text-primary-foreground">Featured</Badge>}
                {car.verified && <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm"><BadgeCheck className="mr-1 h-3 w-3 text-success" /> Verified</Badge>}
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img: string, i: number) => (
                <button key={i} onClick={() => setCurrentImage(i)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${i === currentImage ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            <div className="mt-6 lg:hidden">
              <h1 className="font-display text-2xl font-bold text-foreground">{car.title}</h1>
              <p className="mt-2 font-display text-3xl font-bold text-primary">${Number(car.price).toLocaleString()}</p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Calendar, label: "Year", value: car.year },
                { icon: Gauge, label: "Mileage", value: car.mileage ? `${car.mileage.toLocaleString()} mi` : "N/A" },
                { icon: Fuel, label: "Fuel", value: car.fuel_type || "N/A" },
                { icon: Settings2, label: "Transmission", value: car.transmission || "N/A" },
              ].map((spec) => (
                <div key={spec.label} className="rounded-xl border border-border bg-card p-4">
                  <spec.icon className="h-5 w-5 text-primary" />
                  <p className="mt-2 text-xs text-muted-foreground">{spec.label}</p>
                  <p className="font-display font-semibold text-card-foreground">{spec.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h2 className="font-display text-xl font-bold text-foreground">Technical Specifications</h2>
              <div className="mt-4 grid grid-cols-2 gap-y-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-3">
                {[
                  { label: "Engine", value: car.engine_size || specs.engine || "N/A" },
                  { label: "Power", value: specs.power || "N/A" },
                  { label: "Drivetrain", value: specs.drivetrain || "N/A" },
                  { label: "Body Type", value: car.body_type || "N/A" },
                  { label: "Doors", value: car.doors || specs.doors || "N/A" },
                  { label: "Color", value: car.color || "N/A" },
                  { label: "VIN", value: car.vin || "N/A" },
                  { label: "Registration", value: car.registration || "N/A" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-medium text-card-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {car.description && (
              <div className="mt-8">
                <h2 className="font-display text-xl font-bold text-foreground">Description</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground whitespace-pre-line">{car.description}</p>
              </div>
            )}

            {car.features && car.features.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-xl font-bold text-foreground">Features</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {car.features.map((f: string) => (
                    <Badge key={f} variant="secondary">{f}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <h2 className="font-display text-xl font-bold text-foreground">Vehicle Checks</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Button variant="outline" className="justify-start gap-2 border-success/30 bg-success/5 hover:bg-success/10">
                  <Shield className="h-4 w-4 text-success" />
                  <span className="text-success">Check Finance Status</span>
                  <ExternalLink className="ml-auto h-3 w-3 text-success" />
                </Button>
                <Button variant="outline" className="justify-start gap-2 border-info/30 bg-info/5 hover:bg-info/10">
                  <FileCheck className="h-4 w-4 text-info" />
                  <span className="text-info">Full History Report</span>
                  <ExternalLink className="ml-auto h-3 w-3 text-info" />
                </Button>
                <Button variant="outline" className="justify-start gap-2 border-warning/30 bg-warning/5 hover:bg-warning/10">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-warning">Stolen Vehicle Check</span>
                  <ExternalLink className="ml-auto h-3 w-3 text-warning" />
                </Button>
                <Button variant="outline" className="justify-start gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10">
                  <Car className="h-4 w-4 text-primary" />
                  <span className="text-primary">MOT History</span>
                  <ExternalLink className="ml-auto h-3 w-3 text-primary" />
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="hidden rounded-2xl border border-border bg-card p-6 shadow-card lg:block">
                <h1 className="font-display text-xl font-bold text-card-foreground">{car.title}</h1>
                <p className="mt-3 font-display text-3xl font-bold text-primary">${Number(car.price).toLocaleString()}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Finance from ~${Math.round(Number(car.price) / 48).toLocaleString()}/mo
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-card-foreground">{sellerName}</p>
                    <Badge variant={car.dealer_id ? "default" : "outline"} className="text-xs">
                      {car.dealer_id ? "Verified Dealer" : "Private Seller"}
                    </Badge>
                  </div>
                </div>

                {sellerLocation && (
                  <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {sellerLocation}
                  </div>
                )}

                <div className="mt-5 space-y-2">
                  <Button className="w-full gradient-primary border-0">
                    <Phone className="mr-2 h-4 w-4" />
                    Show Phone Number
                  </Button>
                  <EnquiryForm listingId={car.id} sellerId={car.seller_id} listingTitle={car.title} />
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => {
                    if (!user) { toast({ title: "Sign in to save cars" }); return; }
                    toggle(car.id);
                  }}>
                    <Heart className={`mr-1 h-4 w-4 ${liked ? "fill-accent text-accent" : ""}`} />
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    <Share2 className="mr-1 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              {dealer?.slug && (
                <Link to={`/dealer/${dealer.slug}`}>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Dealer Showroom
                  </Button>
                </Link>
              )}

              <div className="rounded-2xl border border-border bg-warning/5 p-5">
                <h4 className="flex items-center gap-2 font-display font-semibold text-foreground">
                  <Shield className="h-4 w-4 text-warning" />
                  Safety Tips
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• Always inspect the car in person</li>
                  <li>• Run a finance and history check</li>
                  <li>• Never pay before seeing the car</li>
                  <li>• Use secure payment methods</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CarDetail;
