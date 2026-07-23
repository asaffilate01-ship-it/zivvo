import { Link } from "react-router-dom";
import { Heart, MapPin, Fuel, Gauge, Calendar, Shield, BadgeCheck, Cog, Video, Truck, Wallet, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useSavedCars } from "@/contexts/SavedCarsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice, formatDistance } from "@/lib/countryConfig";
import PriceIndicatorBadge from "@/components/PriceIndicatorBadge";
import DealerPerformanceBadge from "@/components/DealerPerformanceBadge";
import InspectionBadge from "@/components/InspectionBadge";
import { useTranslation } from "react-i18next";

// Rough monthly finance estimate: 10% deposit, 60 months, 9.9% APR
const estimateMonthly = (price: number) => {
  const deposit = price * 0.1;
  const principal = price - deposit;
  const apr = 0.099;
  const n = 60;
  const r = apr / 12;
  const m = (principal * r) / (1 - Math.pow(1 + r, -n));
  return Math.round(m);
};

interface CarCardProps {
  car: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    mileage?: number | null;
    fuel_type?: string | null;
    transmission?: string | null;
    location?: string | null;
    images?: string[] | null;
    is_featured?: boolean | null;
    verified?: boolean | null;
    dealer_id?: string | null;
    video_url?: string | null;
    vat_qualifying?: boolean | null;
    source?: string | null;
    _distance_km?: number | null;
    price_dropped_at?: string | null;
    inspection_score?: number | null;
  };
  index?: number;
  layout?: "grid" | "list";
}

const CarCard = ({ car, index = 0, layout = "grid" }: CarCardProps) => {
  const { isSaved, toggle } = useSavedCars();
  const { user } = useAuth();
  const { toast } = useToast();
  const { config } = useCountry();
  const { t } = useTranslation();
  const liked = isSaved(car.id);
  const mainImage = car.images?.[0] || "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80";

  const priceDroppedRecently = car.price_dropped_at
    ? (Date.now() - new Date(car.price_dropped_at).getTime()) < 14 * 24 * 60 * 60 * 1000
    : false;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: t("carCard.signInToSave"), description: t("carCard.signInToSaveDesc") });
      return;
    }
    await toggle(car.id);
  };

  const specs = [
    { icon: Calendar, value: car.year },
    car.mileage != null ? { icon: Gauge, value: formatDistance(car.mileage, config) } : null,
    car.fuel_type ? { icon: Fuel, value: car.fuel_type } : null,
    car.transmission ? { icon: Cog, value: car.transmission } : null,
  ].filter(Boolean) as { icon: any; value: string | number }[];

  if (layout === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.3 }}
      >
        <Link to={`/car/${car.id}`} className="group block">
          <div className="flex overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:shadow-elevated">
            <div className="relative h-auto w-48 shrink-0 sm:w-64">
              <img src={mainImage} alt={car.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              <div className="absolute left-2 top-2 flex gap-1 flex-wrap">
                {(car as any).is_promoted && <Badge className="bg-warning text-warning-foreground border-0 text-[10px]">{t("carCard.promoted")}</Badge>}
                {car.is_featured && <Badge className="gradient-primary border-0 text-[10px] text-primary-foreground">{t("carCard.featured")}</Badge>}
                {car.verified && <Badge variant="secondary" className="bg-background/90 text-[10px] backdrop-blur-sm"><BadgeCheck className="mr-0.5 h-3 w-3 text-success" />{t("carCard.verified")}</Badge>}
                {car.inspection_score && <InspectionBadge score={car.inspection_score} />}
                {priceDroppedRecently && <Badge className="bg-success text-success-foreground border-0 text-[10px]"><TrendingDown className="mr-0.5 h-3 w-3" />{t("carCard.priceDrop")}</Badge>}
              </div>
              <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background" onClick={handleLike}>
                <Heart className={`h-3.5 w-3.5 ${liked ? "fill-accent text-accent" : "text-foreground"}`} />
              </Button>
            </div>

            <div className="flex flex-1 flex-col justify-between p-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-semibold text-card-foreground line-clamp-1 sm:text-lg">{car.title}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <PriceIndicatorBadge price={car.price} make={car.make} model={car.model} year={car.year} mileage={car.mileage} />
                      {car.dealer_id && <DealerPerformanceBadge dealerId={car.dealer_id} />}
                    </div>
                  </div>
                  <p className="shrink-0 font-display text-lg font-bold text-primary sm:text-xl">
                    {formatPrice(Number(car.price), config)}
                    {car.vat_qualifying && <span className="ml-1 text-xs font-medium text-muted-foreground">{t("carCard.vat")}</span>}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {specs.map((s, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <s.icon className="h-3.5 w-3.5" /> {s.value}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  {Number(car.price) > 1000 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                      <Wallet className="h-3 w-3" />
                      {t("carCard.from")} {formatPrice(estimateMonthly(Number(car.price)), config)}{t("carCard.perMonth")}
                    </span>
                  )}
                  {car.dealer_id && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-medium text-success">
                      <Truck className="h-3 w-3" />
                      {t("carCard.homeDelivery")}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                {(car.location || car._distance_km != null) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {car.location}
                    {car._distance_km != null && (
                      <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{(car._distance_km * 0.621371).toFixed(1)} mi</span>
                    )}
                  </div>
                )}
                <Badge variant={car.dealer_id ? "default" : "outline"} className="text-xs">
                  {car.dealer_id ? <><Shield className="mr-1 h-3 w-3" /> {t("carCard.dealer")}</> : t("carCard.private")}
                </Badge>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Link to={`/car/${car.id}`} className="group block">
        <div className="shadow-card overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1">
          <div className="relative aspect-[16/10] overflow-hidden">
            <img src={mainImage} alt={car.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
            <div className="absolute left-3 top-3 flex gap-1.5 flex-wrap">
              {(car as any).is_promoted && <Badge className="bg-warning text-warning-foreground border-0 text-xs font-semibold">{t("carCard.promoted")}</Badge>}
              {car.is_featured && <Badge className="gradient-primary border-0 text-xs font-semibold text-primary-foreground">{t("carCard.featured")}</Badge>}
              {car.verified && <Badge variant="secondary" className="bg-background/90 text-xs backdrop-blur-sm"><BadgeCheck className="mr-1 h-3 w-3 text-success" />{t("carCard.verified")}</Badge>}
              {car.inspection_score && <InspectionBadge score={car.inspection_score} />}
              {priceDroppedRecently && <Badge className="bg-success text-success-foreground border-0 text-xs font-semibold"><TrendingDown className="mr-1 h-3 w-3" />{t("carCard.priceDrop")}</Badge>}
              {car.source && car.source !== "manual" && (
                <Badge variant="outline" className="bg-background/90 text-[10px] backdrop-blur-sm capitalize" title={t("carCard.syncedFrom", { source: car.source })}>
                  ⇄ {car.source.replace("_", " ")}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" className="absolute right-3 top-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background" onClick={handleLike}>
              <Heart className={`h-4 w-4 ${liked ? "fill-accent text-accent" : "text-foreground"}`} />
            </Button>
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <p className="font-display text-2xl font-bold text-primary-foreground">
                {formatPrice(Number(car.price), config)}
                {car.vat_qualifying && <span className="ml-1 text-xs font-medium opacity-90">{t("carCard.vat")}</span>}
              </p>
              <div className="flex items-center gap-1.5">
                {(car as any).video_url && (
                  <span className="flex items-center gap-0.5 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
                    <Video className="h-3 w-3" /> {t("carCard.video")}
                  </span>
                )}
                {car.images && car.images.length > 1 && (
                  <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
                    📷 {car.images.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-display text-lg font-semibold text-card-foreground line-clamp-1">{car.title}</h3>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <PriceIndicatorBadge price={car.price} make={car.make} model={car.model} year={car.year} mileage={car.mileage} />
              {car.dealer_id && <DealerPerformanceBadge dealerId={car.dealer_id} />}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm leading-none text-muted-foreground">
              {specs.slice(0, 3).map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  <s.icon className="h-3.5 w-3.5 shrink-0 overflow-visible" /> {s.value}
                </span>
              ))}
            </div>

            {/* Finance + delivery row */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
              {Number(car.price) > 1000 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                  <Wallet className="h-3 w-3" />
                  {t("carCard.from")} {formatPrice(estimateMonthly(Number(car.price)), config)}{t("carCard.perMonth")}
                </span>
              )}
              {car.dealer_id && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-medium text-success">
                  <Truck className="h-3 w-3" />
                  {t("carCard.homeDelivery")}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              {(car.location || car._distance_km != null) && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {car.location}
                  {car._distance_km != null && (
                    <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{(car._distance_km * 0.621371).toFixed(1)} mi</span>
                  )}
                </div>
              )}
              <Badge variant={car.dealer_id ? "default" : "outline"} className="text-xs">
                {car.dealer_id ? <><Shield className="mr-1 h-3 w-3" /> {t("carCard.dealer")}</> : t("carCard.private")}
              </Badge>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CarCard;
