import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const bodyTypes = [
  { label: "SUV", image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80", gradient: "from-amber-500/20 to-orange-500/20" },
  { label: "Sedan", image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80", gradient: "from-blue-500/20 to-indigo-500/20" },
  { label: "Hatchback", image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&q=80", gradient: "from-green-500/20 to-emerald-500/20" },
  { label: "Coupe", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80", gradient: "from-red-500/20 to-rose-500/20" },
  { label: "Estate", image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&q=80", gradient: "from-violet-500/20 to-purple-500/20" },
  { label: "Convertible", image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80", gradient: "from-sky-500/20 to-cyan-500/20" },
  { label: "Pickup", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80", gradient: "from-yellow-500/20 to-amber-500/20" },
  { label: "Van", image: "https://images.unsplash.com/photo-1632245889029-e406faaa34cd?w=400&q=80", gradient: "from-slate-500/20 to-gray-500/20" },
];

interface Props {
  counts?: Record<string, number>;
}

const BrowseByBodyType = ({ counts = {} }: Props) => (
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
      {bodyTypes.map((bt, i) => (
        <motion.div
          key={bt.label}
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.04, duration: 0.35 }}
          viewport={{ once: true }}
        >
          <Link
            to={`/browse?body=${bt.label}`}
            className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-elevated hover:-translate-y-1"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={bt.image}
                alt={bt.label}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="font-display text-lg font-bold text-primary-foreground">{bt.label}</h3>
                <p className="text-xs text-primary-foreground/70">{counts[bt.label] || 0} vehicles</p>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  </section>
);

export default BrowseByBodyType;
