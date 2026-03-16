import { Link } from "react-router-dom";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const RecentlyViewedCarousel = () => {
  const { items, clearAll } = useRecentlyViewed();
  const { config } = useCountry();

  if (items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">Recently Viewed</h2>
          <Badge variant="outline" className="text-xs">{items.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-muted-foreground">
          <X className="mr-1 h-3 w-3" /> Clear
        </Button>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {items.slice(0, 10).map((car, i) => (
          <motion.div
            key={car.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Link
              to={`/car/${car.id}`}
              className="group flex w-48 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-card"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={car.image} alt={car.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-card-foreground line-clamp-1">{car.year} {car.make} {car.model}</p>
                <p className="mt-1 text-sm font-bold text-primary">{formatPrice(car.price, config)}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewedCarousel;
