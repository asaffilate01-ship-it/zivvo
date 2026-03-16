import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import SEOHead from "@/components/SEOHead";
import { DetailSkeleton } from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ReportListingDialog from "@/components/ReportListingDialog";
import SellerReviews from "@/components/SellerReviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Heart, Share2, Phone, Mail, MapPin, Calendar,
  Gauge, Fuel, Settings2, Shield, BadgeCheck, ExternalLink,
  ChevronLeft, ChevronRight, AlertTriangle, Car, FileCheck,
  MessageCircle, GitCompare,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice, formatDistance } from "@/lib/countryConfig";
import { useSavedCars } from "@/contexts/SavedCarsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import EnquiryForm from "@/components/EnquiryForm";

const PhoneRevealButton = ({ phone }: { phone?: string | null }) => {
  const [revealed, setRevealed] = useState(false);
  if (!phone) return (
    <Button className="w-full gradient-primary border-0" disabled>
      <Phone className="mr-2 h-4 w-4" />
      Phone Not Available
    </Button>
  );
  return (
    <Button className="w-full gradient-primary border-0" onClick={() => setRevealed(true)}>
      <Phone className="mr-2 h-4 w-4" />
      {revealed ? phone : "Show Phone Number"}
    </Button>
  );
};

const CarDetail = () => {
  const { id } = useParams();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [dealer, setDealer] = useState<any>(null);
  const { isSaved, toggle } = useSavedCars();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { config } = useCountry();
  const liked = car ? isSaved(car.id) : false;

  const [similarCars, setSimilarCars] = useState<any[]>([]);

  useEffect(() => {
    const fetchCar = async () => {
      const { data } = await supabase
        .from("car_listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        setCar(data);
        supabase.from("listing_views").insert({ listing_id: id, viewer_id: user?.id || null }).then();
        supabase.from("car_listings").update({ views_count: (data.views_count || 0) + 1 }).eq("id", id).then();
        if (data.dealer_id) {
          const { data: d } = await supabase.from("dealer_landing_public").select("business_name, slug, city, kyc_verified").eq("id", data.dealer_id).maybeSingle();
          if (d) setDealer(d);
        }
        // Fetch similar cars (same make or body type, excluding current)
        const { data: similar } = await supabase
          .from("car_listings")
          .select("*")
          .eq("status", "active")
          .eq("country", data.country)
          .neq("id", id!)
          .or(`make.eq.${data.make},body_type.eq.${data.body_type}`)
          .order("created_at", { ascending: false })
          .limit(4);
        if (similar) setSimilarCars(similar);
      }
      setLoading(false);
    };
    fetchCar();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <DetailSkeleton />
        <Footer />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="Vehicle Not Found" description="This listing may have been removed or sold." />
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <EmptyState
            icon={Car}
            title="Vehicle Not Found"
            description="This listing may have been removed or sold."
            actionLabel="Browse All Cars"
            actionTo="/browse"
          />
        </div>
        <Footer />
      </div>
    );
  }

  const images = car.images?.length ? car.images : ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80"];
  const specs = (car.specs as Record<string, any>) || {};
  const sellerName = dealer?.business_name || "Private Seller";
  const sellerLocation = car.location || dealer?.city || "";

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: car.title, text: `Check out this ${car.year} ${car.make} ${car.model}`, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${car.title} — ${formatPrice(Number(car.price), config)}`}
        description={`${car.year} ${car.make} ${car.model}. ${car.mileage ? formatDistance(car.mileage, config) + "." : ""} ${car.fuel_type || ""} ${car.transmission || ""}. ${car.location || ""}`}
        type="product"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Car",
          "name": car.title,
          "manufacturer": car.make,
          "model": car.model,
          "modelDate": String(car.year),
          "mileageFromOdometer": car.mileage ? { "@type": "QuantitativeValue", "value": car.mileage, "unitCode": config.distanceUnit === "miles" ? "SMI" : "KMT" } : undefined,
          "fuelType": car.fuel_type || undefined,
          "vehicleTransmission": car.transmission || undefined,
          "color": car.color || undefined,
          "offers": {
            "@type": "Offer",
            "price": car.price,
            "priceCurrency": config.currency.code,
            "availability": car.status === "active" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
          },
          "image": images[0],
        }}
      />
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/browse" className="hover:text-primary">Browse</Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{car.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-2xl">
              <motion.img
                key={currentImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={images[currentImage]}
                alt={`${car.title} - Image ${currentImage + 1}`}
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
                  <div className="absolute bottom-3 right-3 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                    {currentImage + 1} / {images.length}
                  </div>
                </>
              )}

              <div className="absolute left-3 top-3 flex gap-2">
                {car.is_featured && <Badge className="gradient-primary border-0 text-primary-foreground">Featured</Badge>}
                {car.verified && <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm"><BadgeCheck className="mr-1 h-3 w-3 text-success" /> Verified</Badge>}
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {images.map((img: string, i: number) => (
                <button key={i} onClick={() => setCurrentImage(i)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${i === currentImage ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>

            {/* Mobile title/price */}
            <div className="mt-6 lg:hidden">
              <h1 className="font-display text-2xl font-bold text-foreground">{car.title}</h1>
              <p className="mt-2 font-display text-3xl font-bold text-primary">{formatPrice(Number(car.price), config)}</p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Calendar, label: "Year", value: car.year },
                { icon: Gauge, label: "Mileage", value: car.mileage ? formatDistance(car.mileage, config) : "N/A" },
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
                <p className="mt-3 font-display text-3xl font-bold text-primary">{formatPrice(Number(car.price), config)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Finance from ~{formatPrice(Math.round(Number(car.price) / 48), config)}/mo
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
                  <PhoneRevealButton phone={dealer?.business_phone} />
                  <EnquiryForm listingId={car.id} sellerId={car.seller_id} listingTitle={car.title} />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (!user) { toast({ title: "Sign in to message sellers" }); return; }
                      if (user.id === car.seller_id) { toast({ title: "This is your own listing" }); return; }
                      const ids = [user.id, car.seller_id].sort();
                      const convId = `${car.id}:${ids[0]}:${ids[1]}`;
                      navigate("/inbox");
                      sessionStorage.setItem("openChat", JSON.stringify({
                        conversationId: convId,
                        recipientId: car.seller_id,
                        recipientName: sellerName,
                        listingTitle: car.title,
                      }));
                    }}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message Seller
                  </Button>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => {
                    if (!user) { toast({ title: "Sign in to save cars" }); return; }
                    toggle(car.id);
                  }}>
                    <Heart className={`mr-1 h-4 w-4 ${liked ? "fill-accent text-accent" : ""}`} />
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1" onClick={handleShare}>
                    <Share2 className="mr-1 h-4 w-4" />
                    Share
                  </Button>
                  <Link to={`/compare?car=${car.id}`}>
                    <Button variant="ghost" size="sm">
                      <GitCompare className="mr-1 h-4 w-4" /> Compare
                    </Button>
                  </Link>
                </div>

                <div className="mt-3 flex justify-center">
                  <ReportListingDialog listingId={car.id} />
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

        {/* Seller Reviews */}
        <div className="mt-12">
          <SellerReviews sellerId={car.seller_id} listingId={car.id} />
        </div>

        {/* Similar Cars */}
        {similarCars.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-2xl font-bold text-foreground">Similar Vehicles</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similarCars.map((c, i) => (
                <CarCard key={c.id} car={c} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CarDetail;
