import Navbar from "@/components/Navbar";
import HeroSearch from "@/components/HeroSearch";
import CarCard from "@/components/CarCard";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { CarGridSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ArrowRight, Shield, Search, FileCheck, Car, Truck, Zap, Globe,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";

const categories = [
  { icon: Car, label: "Sedan", count: "—" },
  { icon: Truck, label: "SUV", count: "—" },
  { icon: Car, label: "Coupe", count: "—" },
  { icon: Zap, label: "Electric", count: "—" },
  { icon: Car, label: "Estate", count: "—" },
  { icon: Globe, label: "Hybrid", count: "—" },
];

const Index = () => {
  const [featured, setFeatured] = useState<any[]>([]);
  const [latest, setLatest] = useState<any[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [featuredRes, latestRes] = await Promise.all([
        supabase.from("car_listings").select("*").eq("status", "active").eq("is_featured", true).order("created_at", { ascending: false }).limit(8),
        supabase.from("car_listings").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(8),
      ]);
      if (featuredRes.data) setFeatured(featuredRes.data);
      if (latestRes.data) setLatest(latestRes.data);

      const { data: allActive } = await supabase.from("car_listings").select("body_type").eq("status", "active");
      if (allActive) {
        const counts: Record<string, number> = {};
        allActive.forEach((l: any) => {
          if (l.body_type) counts[l.body_type] = (counts[l.body_type] || 0) + 1;
        });
        const { data: fuelData } = await supabase.from("car_listings").select("fuel_type").eq("status", "active");
        if (fuelData) {
          fuelData.forEach((l: any) => {
            if (l.fuel_type === "Electric") counts["Electric"] = (counts["Electric"] || 0) + 1;
            if (l.fuel_type === "Hybrid") counts["Hybrid"] = (counts["Hybrid"] || 0) + 1;
          });
        }
        setCategoryCounts(counts);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="AutoVault — Buy & Sell Cars with Confidence"
        description="Browse thousands of verified vehicles from trusted dealers and private sellers. Finance checks, full history reports, and transparent pricing."
        canonical="https://autovault.co"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "AutoVault",
          "description": "Buy & sell cars with verified dealers and private sellers.",
          "applicationCategory": "AutomotiveMarketplace",
          "operatingSystem": "Web",
        }}
      />
      <Navbar />
      <HeroSearch />

      {/* Categories */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Browse by Category</h2>
            <p className="mt-1 text-muted-foreground">Find exactly what you're looking for</p>
          </div>
          <Link to="/browse">
            <Button variant="ghost" className="text-primary">View All <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
          {categories.map((cat, i) => (
            <motion.div key={cat.label} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }}>
              <Link
                to={cat.label === "Electric" || cat.label === "Hybrid" ? `/browse?fuel=${cat.label}` : `/browse?body=${cat.label}`}
                className="group flex flex-col items-center rounded-xl border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-card md:p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <cat.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="mt-3 font-display text-sm font-semibold text-card-foreground">{cat.label}</span>
                <span className="text-xs text-muted-foreground">{categoryCounts[cat.label] || 0} ads</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Featured Vehicles</h2>
              <Badge className="gradient-primary border-0 text-primary-foreground">Hot</Badge>
            </div>
            <p className="mt-1 text-muted-foreground">Hand-picked premium listings</p>
          </div>
          <Link to="/browse?featured=true">
            <Button variant="ghost" className="text-primary">See All <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </Link>
        </div>

        <div className="mt-8">
          {loading ? (
            <CarGridSkeleton count={4} />
          ) : featured.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featured.map((car, i) => (
                <CarCard key={car.id} car={car} index={i} />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground">No featured vehicles yet. Check back soon!</p>
          )}
        </div>
      </section>

      {/* Trust Section */}
      <section className="border-y border-border bg-secondary/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Why Choose AutoVault?</h2>
            <p className="mt-2 text-muted-foreground">We go the extra mile to ensure every transaction is safe and transparent</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Shield, title: "Verified Listings", desc: "Every dealer is vetted. Verified badges mean the vehicle has passed our checks for legality and outstanding finance." },
              { icon: Search, title: "Finance & Legal Check", desc: "Instantly check if a vehicle has outstanding finance, is reported stolen, or has been written off — before you buy." },
              { icon: FileCheck, title: "Full History Reports", desc: "Access complete MOT history, mileage verification, and previous owner details with a single click." },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-card-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Listings */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Latest Listings</h2>
            <p className="mt-1 text-muted-foreground">Just posted by sellers near you</p>
          </div>
          <Link to="/browse">
            <Button variant="ghost" className="text-primary">View All <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </Link>
        </div>

        <div className="mt-8">
          {loading ? (
            <CarGridSkeleton count={4} />
          ) : latest.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {latest.map((car, i) => (
                <CarCard key={car.id} car={car} index={i} />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground">No listings yet. Be the first to post!</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-dark py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl font-bold text-primary-foreground md:text-4xl">Ready to Sell Your Car?</h2>
          <p className="mx-auto mt-3 max-w-lg text-primary-foreground/70">Reach thousands of buyers instantly. Individual listings or dealer subscriptions available.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/sell"><Button size="lg" className="gradient-primary border-0 px-8">Post Your Ad — It's Free</Button></Link>
            <Link to="/dealers"><Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">Dealer Plans from £49/mo</Button></Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
