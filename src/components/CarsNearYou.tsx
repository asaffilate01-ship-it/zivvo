import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Loader2 } from "lucide-react";
import CarCard from "@/components/CarCard";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/contexts/CountryContext";

const CarsNearYou = () => {
  const { country } = useCountry();
  const [cars, setCars] = useState<any[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNearby = async () => {
      setLoading(true);
      // Try to get user's approximate location from browser
      const locationLabels: Record<string, string> = {
        GB: "London",
        US: "New York",
        PK: "Lahore",
        AE: "Dubai",
      };
      const fallbackCity = locationLabels[country] || "your area";
      setLocation(fallbackCity);

      const { data } = await supabase
        .from("car_listings")
        .select("*")
        .eq("status", "active")
        .eq("country", country)
        .order("created_at", { ascending: false })
        .limit(4);

      if (data) setCars(data);
      setLoading(false);
    };
    fetchNearby();
  }, [country]);

  if (!loading && cars.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex items-end justify-between"
      >
        <div>
          <Badge variant="outline" className="mb-3 text-xs">
            <MapPin className="mr-1 h-3 w-3" /> Near You
          </Badge>
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Cars Near {location || "You"}
          </h2>
          <p className="mt-1 text-muted-foreground">Browse vehicles available in your area</p>
        </div>
        <Link to="/browse">
          <Button variant="ghost" size="sm" className="text-primary">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>

      <div className="mt-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cars.map((car, i) => (
              <CarCard key={car.id} car={car} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CarsNearYou;
