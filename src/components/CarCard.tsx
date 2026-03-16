import { Link } from "react-router-dom";
import { Heart, MapPin, Fuel, Gauge, Calendar, Shield, BadgeCheck } from "lucide-react";
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
    location?: string | null;
    images?: string[] | null;
    is_featured?: boolean | null;
    verified?: boolean | null;
    dealer_id?: string | null;
  };
  index?: number;
}

const CarCard = ({ car, index = 0 }: CarCardProps) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={`/car/${car.id}`} className="group block">
        <div className="shadow-card overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1">
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={mainImage}
              alt={car.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />

            <div className="absolute left-3 top-3 flex gap-1.5">
              {car.is_featured && (
                <Badge className="gradient-primary border-0 text-xs font-semibold text-primary-foreground">
                  Featured
                </Badge>
              )}
              {car.verified && (
                <Badge variant="secondary" className="bg-background/90 text-xs backdrop-blur-sm">
                  <BadgeCheck className="mr-1 h-3 w-3 text-success" />
                  Verified
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-accent text-accent" : "text-foreground"}`} />
            </Button>

            <div className="absolute bottom-3 left-3">
              <p className="font-display text-2xl font-bold text-primary-foreground">
                £{Number(car.price).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-display text-lg font-semibold text-card-foreground line-clamp-1">
              {car.title}
            </h3>

            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {car.year}
              </span>
              {car.mileage != null && (
                <span className="flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5" />
                  {car.mileage.toLocaleString()} mi
                </span>
              )}
              {car.fuel_type && (
                <span className="flex items-center gap-1">
                  <Fuel className="h-3.5 w-3.5" />
                  {car.fuel_type}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              {car.location && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {car.location}
                </div>
              )}
              <Badge variant={car.dealer_id ? "default" : "outline"} className="text-xs">
                {car.dealer_id ? (
                  <><Shield className="mr-1 h-3 w-3" /> Dealer</>
                ) : (
                  "Private"
                )}
              </Badge>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CarCard;
