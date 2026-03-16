import { Link } from "react-router-dom";
import { Heart, MapPin, Fuel, Gauge, Calendar, Shield, BadgeCheck, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useSavedCars } from "@/contexts/SavedCarsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice, formatDistance } from "@/lib/countryConfig";

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
  };
  index?: number;
  layout?: "grid" | "list";
}

const CarCard = ({ car, index = 0, layout = "grid" }: CarCardProps) => {
  const { isSaved, toggle } = useSavedCars();
  const { user } = useAuth();
  const { toast } = useToast();
  const { config } = useCountry();
  const liked = isSaved(car.id);
  const mainImage = car.images?.[0] || "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80";

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Sign in to save cars", description: "Create an account to save your favourite listings." });
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
              <div className="absolute left-2 top-2 flex gap-1">
                {(car as any).is_promoted && <Badge className="bg-warning text-warning-foreground border-0 text-[10px]">🔥 Promoted</Badge>}
                {car.is_featured && <Badge className="gradient-primary border-0 text-[10px] text-primary-foreground">Featured</Badge>}
                {car.verified && <Badge variant="secondary" className="bg-background/90 text-[10px] backdrop-blur-sm"><BadgeCheck className="mr-0.5 h-3 w-3 text-success" />Verified</Badge>}
              </div>
              <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background" onClick={handleLike}>
                <Heart className={`h-3.5 w-3.5 ${liked ? "fill-accent text-accent" : "text-foreground"}`} />
              </Button>
            </div>

            <div className="flex flex-1 flex-col justify-between p-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base font-semibold text-card-foreground line-clamp-1 sm:text-lg">{car.title}</h3>
                  <p className="shrink-0 font-display text-lg font-bold text-primary sm:text-xl">{formatPrice(Number(car.price), config)}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {specs.map((s, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <s.icon className="h-3.5 w-3.5" /> {s.value}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                {car.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {car.location}
                  </div>
                )}
                <Badge variant={car.dealer_id ? "default" : "outline"} className="text-xs">
                  {car.dealer_id ? <><Shield className="mr-1 h-3 w-3" /> Dealer</> : "Private"}
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
            <div className="absolute left-3 top-3 flex gap-1.5">
              {(car as any).is_promoted && <Badge className="bg-warning text-warning-foreground border-0 text-xs font-semibold">🔥 Promoted</Badge>}
              {car.is_featured && <Badge className="gradient-primary border-0 text-xs font-semibold text-primary-foreground">Featured</Badge>}
              {car.verified && <Badge variant="secondary" className="bg-background/90 text-xs backdrop-blur-sm"><BadgeCheck className="mr-1 h-3 w-3 text-success" />Verified</Badge>}
            </div>
            <Button variant="ghost" size="icon" className="absolute right-3 top-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background" onClick={handleLike}>
              <Heart className={`h-4 w-4 ${liked ? "fill-accent text-accent" : "text-foreground"}`} />
            </Button>
            <div className="absolute bottom-3 left-3">
              <p className="font-display text-2xl font-bold text-primary-foreground">{formatPrice(Number(car.price), config)}</p>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-display text-lg font-semibold text-card-foreground line-clamp-1">{car.title}</h3>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
              {specs.slice(0, 3).map((s, i) => (
                <span key={i} className="flex items-center gap-1">
                  <s.icon className="h-3.5 w-3.5" /> {s.value}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              {car.location && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {car.location}
                </div>
              )}
              <Badge variant={car.dealer_id ? "default" : "outline"} className="text-xs">
                {car.dealer_id ? <><Shield className="mr-1 h-3 w-3" /> Dealer</> : "Private"}
              </Badge>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CarCard;
