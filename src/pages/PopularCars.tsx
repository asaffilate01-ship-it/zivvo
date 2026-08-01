import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import CarCard from "@/components/CarCard";
import { CarGridSkeleton } from "@/components/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/contexts/CountryContext";

const popularMakes = [
  { slug: "bmw", name: "BMW", image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80" },
  { slug: "mercedes-benz", name: "Mercedes-Benz", image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&q=80" },
  { slug: "audi", name: "Audi", image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&q=80" },
  { slug: "toyota", name: "Toyota", image: "https://images.unsplash.com/photo-1621007806512-be7837896e64?w=400&q=80" },
  { slug: "volkswagen", name: "Volkswagen", image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&q=80" },
  { slug: "ford", name: "Ford", image: "https://images.unsplash.com/photo-1551830820-330a71b99659?w=400&q=80" },
  { slug: "tesla", name: "Tesla", image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&q=80" },
  { slug: "porsche", name: "Porsche", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80" },
  { slug: "land-rover", name: "Land Rover", image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=400&q=80" },
  { slug: "hyundai", name: "Hyundai", image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80" },
  { slug: "kia", name: "Kia", image: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&q=80" },
  { slug: "nissan", name: "Nissan", image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&q=80" },
];

const PopularCars = () => {
  const { make } = useParams<{ make?: string }>();
  const { country } = useCountry();
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const makeName = make ? popularMakes.find((m) => m.slug === make)?.name || make : null;

  useEffect(() => {
    if (!makeName) return;
    setLoading(true);
    supabase
      .from("car_listings_public")
      .select("*")
      .eq("status", "active")
      .eq("country", country)
      .ilike("make", makeName)
      .order("created_at", { ascending: false })
      .limit(24)
      .then(({ data }) => {
        if (data) setCars(data);
        setLoading(false);
      });
  }, [makeName, country]);

  // Landing page — show all makes
  if (!make) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead
          title="Popular Cars — Browse by Make"
          description="Browse the most popular car makes on Zivvo. Find BMW, Mercedes, Audi, Tesla, and more."
        />
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-xs">Popular Makes</Badge>
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">Browse by Make</h1>
            <p className="mt-2 text-muted-foreground">Find your perfect car from the most popular manufacturers</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {popularMakes.map((m, i) => (
              <motion.div
                key={m.slug}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                viewport={{ once: true }}
              >
                <Link
                  to={`/cars/${m.slug}`}
                  className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-elevated hover:-translate-y-1"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img src={m.image} alt={m.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <h3 className="font-display text-base font-bold text-primary-foreground">{m.name}</h3>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Make-specific page
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`Used ${makeName} Cars For Sale`}
        description={`Browse active used ${makeName} listings on Zivvo and compare seller-provided vehicle details and prices.`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": `Used ${makeName} Cars`,
          "description": `Browse used ${makeName} vehicles for sale.`,
        }}
      />
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/cars" className="hover:text-foreground">Popular Cars</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{makeName}</span>
        </div>

        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Used {makeName} Cars</h1>
            <p className="mt-1 text-muted-foreground">{cars.length} vehicles available</p>
          </div>
          <Link to={`/browse?make=${makeName}`}>
            <Button variant="outline" size="sm">
              Advanced Search <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <CarGridSkeleton count={8} />
        ) : cars.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cars.map((car, i) => (
              <CarCard key={car.id} car={car} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16">
            <Car className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No {makeName} listings currently available.</p>
            <Link to="/browse" className="mt-4">
              <Button variant="outline" size="sm">Browse All Cars</Button>
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PopularCars;
