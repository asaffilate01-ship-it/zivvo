import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import SEOHead from "@/components/SEOHead";
import { DetailSkeleton } from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ReportListingDialog from "@/components/ReportListingDialog";
import SellerReviews from "@/components/SellerReviews";
import PaymentCalculator from "@/components/PaymentCalculator";
import PartExchangeWidget from "@/components/PartExchangeWidget";
import MakeOfferDialog from "@/components/MakeOfferDialog";
import InspectionBookingDialog from "@/components/InspectionBookingDialog";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileListingBar from "@/components/MobileListingBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Heart, Share2, Phone, Mail, MapPin, Calendar,
  Gauge, Fuel, Settings2, Shield, BadgeCheck, ExternalLink,
  ChevronLeft, ChevronRight, AlertTriangle, Car, FileCheck,
  MessageCircle, GitCompare, Eye, Clock, Palette, DoorOpen,
  Cog, Hash, Zap, CircleDot,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice, formatDistance } from "@/lib/countryConfig";
import { useSavedCars } from "@/contexts/SavedCarsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import EnquiryForm from "@/components/EnquiryForm";
import ReserveNowButton from "@/components/dealer/ReserveNowButton";
import TestDriveDialog from "@/components/dealer/TestDriveDialog";
import TransportQuoteDialog from "@/components/dealer/TransportQuoteDialog";
import VehicleChecks from "@/components/VehicleChecks";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import FinanceQuoteWidget from "@/components/FinanceQuoteWidget";
import InspectionBadge from "@/components/InspectionBadge";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import ShareSheet from "@/components/ShareSheet";
import MediaGallery from "@/components/MediaGallery";
import LiveMap, { distanceKm } from "@/components/LiveMap";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useTranslation } from "react-i18next";

const PhoneRevealButton = ({ phone }: { phone?: string | null }) => {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  if (!phone) return (
    <Button className="w-full gradient-primary border-0" disabled>
      <Phone className="mr-2 h-4 w-4" />
      {t("carDetail.phoneNotAvailable")}
    </Button>
  );
  return (
    <Button className="w-full gradient-primary border-0" onClick={() => setRevealed(true)}>
      <Phone className="mr-2 h-4 w-4" />
      {revealed ? phone : t("carDetail.showPhoneNumber")}
    </Button>
  );
};

const CarDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dealer, setDealer] = useState<any>(null);
  const { isSaved, toggle } = useSavedCars();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { config, country } = useCountry();
  const liked = car ? isSaved(car.id) : false;
  const { addViewed } = useRecentlyViewed();

  const [similarCars, setSimilarCars] = useState<any[]>([]);
  const [inspectionReport, setInspectionReport] = useState<any>(null);

  useEffect(() => {
    const fetchCar = async () => {
      const { data } = await supabase
        .from("car_listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        setCar(data);
        addViewed({
          id: data.id,
          title: data.title,
          price: data.price,
          image: data.images?.[0] || "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
          make: data.make,
          model: data.model,
          year: data.year,
        });
        supabase.from("listing_views").insert({ listing_id: id, viewer_id: user?.id || null }).then();
        supabase.from("car_listings").update({ views_count: (data.views_count || 0) + 1 }).eq("id", id).then();
        // Fetch inspection report
        supabase.from("inspection_reports" as any).select("*").eq("listing_id", id).maybeSingle().then(({ data: ir }) => {
          if (ir) setInspectionReport(ir);
        });
        if (data.dealer_id) {
          const { data: d } = await supabase.from("dealer_landing_public").select("business_name, slug, city, kyc_verified").eq("id", data.dealer_id).maybeSingle();
          if (d) setDealer(d);
        }
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
        <SEOHead title={t("carDetail.notFoundTitle")} description={t("carDetail.notFoundDesc")} />
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <EmptyState
            icon={Car}
            title={t("carDetail.notFoundTitle")}
            description={t("carDetail.notFoundDesc")}
            actionLabel={t("carDetail.browseAllCars")}
            actionTo="/browse"
          />
        </div>
        <Footer />
      </div>
    );
  }

  const images = car.images?.length ? car.images : ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80"];
  const specs = (car.specs as Record<string, any>) || {};
  const sellerName = dealer?.business_name || t("carDetail.privateSeller");
  const sellerLocation = car.location || dealer?.city || "";
  const showWhatsApp = true;

  // Resolve coordinates from listing first, then dealer
  const carLat = (car as any).latitude ?? (dealer as any)?.latitude ?? null;
  const carLng = (car as any).longitude ?? (dealer as any)?.longitude ?? null;
  const hasCoords = typeof carLat === "number" && typeof carLng === "number";

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: car.title, text: t("carDetail.shareText", { year: car.year, make: car.make, model: car.model }), url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: t("carDetail.linkCopied") });
    }
  };

  const allSpecs = [
    { icon: Calendar, label: t("carDetail.specs.year"), value: car.year },
    { icon: Gauge, label: config.terminology.mileage, value: car.mileage ? formatDistance(car.mileage, config) : null },
    { icon: Fuel, label: t("carDetail.specs.fuelType"), value: car.fuel_type },
    { icon: Settings2, label: t("carDetail.specs.transmission"), value: car.transmission },
    { icon: Cog, label: t("carDetail.specs.engine"), value: car.engine_size || specs.engine },
    { icon: Zap, label: t("carDetail.specs.power"), value: specs.power },
    { icon: CircleDot, label: t("carDetail.specs.drivetrain"), value: specs.drivetrain },
    { icon: Car, label: t("carDetail.specs.bodyType"), value: car.body_type },
    { icon: DoorOpen, label: t("carDetail.specs.doors"), value: car.doors || specs.doors },
    { icon: Palette, label: t("carDetail.specs.colour"), value: car.color },
    { icon: Hash, label: t("carDetail.specs.vin"), value: car.vin },
    { icon: FileCheck, label: config.terminology.registration, value: car.registration },
  ].filter(s => s.value);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${car.title} — ${formatPrice(Number(car.price), config)}`}
        description={t("carDetail.seoDescriptionParts", { year: car.year, make: car.make, model: car.model, mileage: car.mileage ? formatDistance(car.mileage, config) + "." : "", fuel: car.fuel_type || "", transmission: car.transmission || "", location: car.location || "" })}
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
        {/* Breadcrumbs */}
        <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary">{t("carDetail.breadcrumb.home")}</Link>
          <span>/</span>
          <Link to="/browse" className="hover:text-primary">{t("carDetail.breadcrumb.browse")}</Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{car.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2">
            {/* Image Gallery — tabbed media with fullscreen */}
            <MediaGallery
              images={images}
              videoUrl={car.video_url}
              title={car.title}
              badges={
                <>
                  {car.is_featured && <Badge className="gradient-primary border-0 text-primary-foreground">{t("carDetail.featured")}</Badge>}
                  {(car as any).is_promoted && <Badge className="bg-warning text-warning-foreground border-0">{t("carDetail.promoted")}</Badge>}
                  {car.verified && <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm"><BadgeCheck className="mr-1 h-3 w-3 text-success" /> {t("carDetail.verified")}</Badge>}
                  {inspectionReport && <InspectionBadge score={inspectionReport.score} totalPoints={inspectionReport.total_points} />}
                </>
              }
            />

            {/* Mobile title/price */}
            <div className="mt-6 lg:hidden">
              <h1 className="font-display text-2xl font-bold text-foreground">{car.title}</h1>
              <p className="mt-2 font-display text-3xl font-bold text-primary">{formatPrice(Number(car.price), config)}</p>
              <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                {car.views_count != null && (
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {t("carDetail.views", { count: car.views_count })}</span>
                )}
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t("carDetail.listed", { date: new Date(car.created_at).toLocaleDateString() })}</span>
              </div>
            </div>

            {/* Key Specs - Quick Glance */}
            <div className="mt-8">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">{t("carDetail.keySpecifications")}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {allSpecs.slice(0, 8).map((spec) => (
                  <div key={spec.label} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
                    <spec.icon className="h-5 w-5 text-primary" />
                    <p className="mt-2 text-xs text-muted-foreground">{spec.label}</p>
                    <p className="font-display font-semibold text-card-foreground">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Technical Specifications */}
            {allSpecs.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-xl font-bold text-foreground">{t("carDetail.allSpecifications")}</h2>
                <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
                  {allSpecs.map((spec, i) => (
                    <div key={spec.label} className={`flex items-center justify-between px-5 py-3 ${i % 2 === 0 ? "bg-muted/30" : ""}`}>
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <spec.icon className="h-4 w-4" />
                        {spec.label}
                      </span>
                      <span className="font-medium text-card-foreground text-sm">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {car.description && (
              <div className="mt-8">
                <h2 className="font-display text-xl font-bold text-foreground">{t("carDetail.description")}</h2>
                <div className="mt-3 rounded-xl border border-border bg-card p-5">
                  <p className="leading-relaxed text-muted-foreground whitespace-pre-line">{car.description}</p>
                </div>
              </div>
            )}

            {/* Features */}
            {car.features && car.features.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-xl font-bold text-foreground">{t("carDetail.featuresEquipment")}</h2>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {car.features.map((f: string) => (
                    <div key={f} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                      <BadgeCheck className="h-3.5 w-3.5 text-success shrink-0" />
                      <span className="text-sm text-card-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {(car as any).video_url && (
              <div className="mt-8">
                <h2 className="font-display text-xl font-bold text-foreground">{t("carDetail.video")}</h2>
                <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-border">
                  {(() => {
                    const rawUrl: string = (car as any).video_url;
                    // Check if it's a YouTube URL
                    const ytMatch = rawUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
                    if (ytMatch) {
                      return (
                        <iframe
                          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                          className="h-full w-full"
                          allowFullScreen
                          title={t("carDetail.vehicleVideoTitle")}
                          sandbox="allow-scripts allow-same-origin allow-presentation"
                        />
                      );
                    }
                    // Direct video file (from storage)
                    return (
                      <video
                        src={rawUrl}
                        controls
                        className="h-full w-full object-contain bg-black"
                        preload="metadata"
                      />
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Price History */}
            <PriceHistoryChart listingId={car.id} currentPrice={Number(car.price)} />

            {/* Vehicle Checks */}
            <div className="mt-8">
              <h2 className="font-display text-xl font-bold text-foreground">{t("carDetail.vehicleChecks")}</h2>
              <VehicleChecks registration={car.registration} vin={car.vin} country={car.country} />
            </div>

            {/* Inspection Report */}
            {inspectionReport && (
              <div className="mt-8">
                <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                  {t("carDetail.inspectionReport")}
                  <InspectionBadge score={inspectionReport.score} totalPoints={inspectionReport.total_points} />
                </h2>
                <div className="mt-3 rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("carDetail.inspector", { name: inspectionReport.inspector_name || t("carDetail.certifiedInspector") })}</p>
                      <p className="text-sm text-muted-foreground">{t("carDetail.date", { date: new Date(inspectionReport.created_at).toLocaleDateString() })}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-3xl font-bold text-primary">{Math.round((inspectionReport.score / inspectionReport.total_points) * 100)}%</p>
                      <p className="text-xs text-muted-foreground">{t("carDetail.points", { score: inspectionReport.score, total: inspectionReport.total_points })}</p>
                    </div>
                  </div>
                  {inspectionReport.summary && (
                    <p className="mt-3 text-sm text-muted-foreground">{inspectionReport.summary}</p>
                  )}
                  {inspectionReport.report_url && (
                    <a href={inspectionReport.report_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="mt-3">
                        <ExternalLink className="mr-1 h-3 w-3" /> {t("carDetail.viewFullReport")}
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Finance Calculator - Mobile */}
            <div className="mt-8 space-y-4 lg:hidden">
              <PaymentCalculator price={Number(car.price)} />
              <PartExchangeWidget targetPrice={Number(car.price)} />
            </div>
          </div>

          {/* RIGHT COLUMN — Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Price Card */}
              <div className="hidden rounded-2xl border border-border bg-card p-6 shadow-card lg:block">
                <h1 className="font-display text-xl font-bold text-card-foreground">{car.title}</h1>
                <p className="mt-3 font-display text-3xl font-bold text-primary">
                  {formatPrice(Number(car.price), config)}
                  {(car as any).vat_qualifying && (
                    <span className="ml-2 text-sm font-medium text-muted-foreground">{t("carDetail.vat")}</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("carDetail.financeFrom", { amount: formatPrice(Math.round(Number(car.price) / 48), config) })}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  {car.views_count != null && (
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {car.views_count} views</span>
                  )}
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(car.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Seller Card */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-card-foreground">{sellerName}</p>
                    <Badge variant={car.dealer_id ? "default" : "outline"} className="text-xs">
                      {car.dealer_id ? t("carDetail.verifiedDealer") : t("carDetail.privateSeller")}
                    </Badge>
                  </div>
                </div>

                {sellerLocation && (
                  <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {sellerLocation}
                  </div>
                )}

                {hasCoords && (
                  <LocationMapCard
                    lat={carLat as number}
                    lng={carLng as number}
                    title={car.title}
                    location={sellerLocation}
                  />
                )}

                <div className="mt-5 space-y-2">
                  <PhoneRevealButton phone={dealer?.business_phone} />
                  {showWhatsApp && <WhatsAppButton phone={dealer?.business_phone} listingTitle={car.title} />}
                  <EnquiryForm listingId={car.id} sellerId={car.seller_id} listingTitle={car.title} />
                  <MakeOfferDialog listingId={car.id} sellerId={car.seller_id} listingTitle={car.title} askingPrice={Number(car.price)} />
                  <InspectionBookingDialog listingId={car.id} trigger={
                    <Button variant="outline" className="w-full gap-2">
                      <Shield className="w-4 h-4" /> {t("carDetail.bookInspection")}
                    </Button>
                  } />
                  {car.dealer_id && (
                    <ReserveNowButton listingId={car.id} dealerId={car.dealer_id} listingTitle={car.title} />
                  )}
                  <TestDriveDialog
                    listingId={car.id}
                    dealerId={car.dealer_id}
                    vehicleLabel={car.title}
                    trigger={<Button variant="outline" className="w-full">{t("carDetail.bookTestDrive")}</Button>}
                  />
                  <TransportQuoteDialog
                    listingId={car.id}
                    dealerId={car.dealer_id}
                    trigger={<Button variant="outline" className="w-full">{t("carDetail.getDeliveryQuote")}</Button>}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (!user) { toast({ title: t("carDetail.signInToMessage") }); return; }
                      if (user.id === car.seller_id) { toast({ title: t("carDetail.ownListing") }); return; }
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
                    {t("carDetail.messageSeller")}
                  </Button>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => {
                    if (!user) { toast({ title: t("carDetail.signInToSave") }); return; }
                    toggle(car.id);
                  }}>
                    <Heart className={`mr-1 h-4 w-4 ${liked ? "fill-accent text-accent" : ""}`} />
                    {t("carDetail.save")}
                  </Button>
                  <ShareSheet
                    title={car.title}
                    text={t("carDetail.shareText", { year: car.year, make: car.make, model: car.model })}
                  />
                  <Link to={`/compare?car=${car.id}`}>
                    <Button variant="ghost" size="sm">
                      <GitCompare className="mr-1 h-4 w-4" /> {t("carDetail.compare")}
                    </Button>
                  </Link>
                </div>

                <div className="mt-3 flex justify-center">
                  <ReportListingDialog listingId={car.id} />
                </div>
              </div>

              {/* Dealer Showroom Link */}
              {dealer?.slug && (
                <Link to={`/dealer/${dealer.slug}`}>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("carDetail.viewDealerShowroom")}
                  </Button>
                </Link>
              )}

              {/* Finance Calculator - Desktop */}
              <div className="hidden lg:block space-y-4">
                <PaymentCalculator price={Number(car.price)} />
                <PartExchangeWidget targetPrice={Number(car.price)} />
              </div>

              {/* Finance & Insurance Quotes */}
              <FinanceQuoteWidget carPrice={Number(car.price)} carTitle={car.title} listingId={car.id} />

              {/* Safety Tips */}
              <div className="rounded-2xl border border-border bg-warning/5 p-5">
                <h4 className="flex items-center gap-2 font-display font-semibold text-foreground">
                  <Shield className="h-4 w-4 text-warning" />
                  {t("carDetail.safetyTips")}
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• {t("carDetail.tip1")}</li>
                  <li>• {t("carDetail.tip2")}</li>
                  <li>• {t("carDetail.tip3")}</li>
                  <li>• {t("carDetail.tip4")}</li>
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
            <h2 className="font-display text-2xl font-bold text-foreground">{t("carDetail.similarVehicles")}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similarCars.map((c, i) => (
                <CarCard key={c.id} car={c} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />

      <MobileListingBar
        listingId={car.id}
        phone={dealer?.business_phone}
        whatsappNumber={dealer?.business_phone}
        title={car.title}
      />
    </div>
  );
};

const LocationMapCard = ({
  lat, lng, title, location,
}: { lat: number; lng: number; title: string; location: string }) => {
  const { t } = useTranslation();
  const { location: userLoc } = useUserLocation("auto");
  const distance = userLoc ? distanceKm(userLoc, { lat, lng }) : null;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{t("carDetail.vehicleLocation")}</span>
        {distance !== null && (
          <span className="text-muted-foreground">
            {t("carDetail.fromYou", { distance: distance < 10 ? distance.toFixed(1) : Math.round(distance) })}
          </span>
        )}
      </div>
      <LiveMap
        markers={[{ id: "car", lat, lng, title }]}
        fallbackCenter={{ lat, lng }}
        fallbackZoom={12}
        height="220px"
        showUserLocation
        fitToMarkers
      />
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-xs font-medium text-primary hover:underline"
      >
        {t("carDetail.getDirections")}
      </a>
    </div>
  );
};

export default CarDetail;
