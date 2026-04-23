import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useCountry } from "@/contexts/CountryContext";
import bodySaloon from "@/assets/body-saloon.jpg";
import bodySuv from "@/assets/body-suv.jpg";
import bodyCoupe from "@/assets/body-coupe.jpg";
import bodyHatchback from "@/assets/body-hatchback.jpg";
import bodyEstate from "@/assets/body-estate.jpg";
import bodyConvertible from "@/assets/body-convertible.jpg";
import bodyPickup from "@/assets/body-pickup.jpg";
import bodyVan from "@/assets/body-van.jpg";

const bodyTypeImages: Record<string, string> = {
  "Saloon": bodySaloon,
  "Sedan": bodySaloon,
  "SUV": bodySuv,
  "Coupe": bodyCoupe,
  "Hatchback": bodyHatchback,
  "Estate": bodyEstate,
  "Convertible": bodyConvertible,
  "Pickup": bodyPickup,
  "Truck": bodyPickup,
  "Van": bodyVan,
  "Minivan": bodyVan,
  "Crossover": bodySuv,
};

const gradients: Record<string, string> = {
  "Saloon": "from-blue-500/20 to-indigo-500/20",
  "Sedan": "from-blue-500/20 to-indigo-500/20",
  "SUV": "from-amber-500/20 to-orange-500/20",
  "Coupe": "from-red-500/20 to-rose-500/20",
  "Hatchback": "from-green-500/20 to-emerald-500/20",
  "Estate": "from-violet-500/20 to-purple-500/20",
  "Convertible": "from-sky-500/20 to-cyan-500/20",
  "Pickup": "from-yellow-500/20 to-amber-500/20",
  "Truck": "from-yellow-500/20 to-amber-500/20",
  "Van": "from-slate-500/20 to-gray-500/20",
  "Minivan": "from-slate-500/20 to-gray-500/20",
  "Crossover": "from-teal-500/20 to-green-500/20",
};

interface Props {
  counts?: Record<string, number>;
}

const BrowseByBodyType = ({ counts = {} }: Props) => {
  const { config } = useCountry();
  const bodyTypes = config.bodyTypes.slice(0, 8);

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
          <Badge variant="outline" className="mb-3 text-xs">Browse</Badge>
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Shop by Body Type</h2>
          <p className="mt-1 text-muted-foreground">Find the perfect style for your lifestyle</p>
        </div>
        <Link to="/browse">
          <Button variant="ghost" size="sm" className="text-primary">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
        {bodyTypes.map((label, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
            viewport={{ once: true }}
          >
            <Link
              to={`/browse?body=${label}`}
              className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-elevated hover:-translate-y-1"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={bodyTypeImages[label] || bodySaloon}
                  alt={label}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-display text-lg font-bold text-primary-foreground">{label}</h3>
                  <p className="text-xs text-primary-foreground/70">{counts[label] || 0} vehicles</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default BrowseByBodyType;
