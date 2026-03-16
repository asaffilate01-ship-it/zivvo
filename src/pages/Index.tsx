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
  ArrowRight, Shield, Search, FileCheck, Car, Truck, Zap, Globe, Star, Quote,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import trustImage from "@/assets/trust-verify.jpg";

const categories = [
  { icon: Car, label: "Sedan", count: "—" },
  { icon: Truck, label: "SUV", count: "—" },
  { icon: Car, label: "Coupe", count: "—" },
  { icon: Zap, label: "Electric", count: "—" },
  { icon: Car, label: "Estate", count: "—" },
  { icon: Globe, label: "Hybrid", count: "—" },
];

const testimonials = [
  { name: "Sarah K.", location: "London", rating: 5, text: "Sold my BMW in 3 days. The verified badge made buyers trust my listing instantly. Best platform I've used." },
  { name: "James T.", location: "Manchester", rating: 5, text: "The finance check feature saved me from buying a car with outstanding debt. Absolutely invaluable service." },
  { name: "Aisha M.", location: "Dubai", rating: 5, text: "As a dealer, AutoVault brings us qualified leads every day. The analytics dashboard helps us understand what sells." },
  { name: "David R.", location: "New York", rating: 5, text: "Found my dream Porsche through AutoVault. The whole process was transparent and the seller was verified." },
];

const Index = () => {
  const { country, config } = useCountry();
  const [featured, setFeatured] = useState<any[]>([]);
  const [latest, setLatest] = useState<any[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [featuredRes, latestRes] = await Promise.all([
        supabase.from("car_listings").select("*").eq("status", "active").eq("country", country).eq("is_featured", true).order("created_at", { ascending: false }).limit(8),
        supabase.from("car_listings").select("*").eq("status", "active").eq("country", country).order("created_at", { ascending: false }).limit(8),
      ]);
      if (featuredRes.data) setFeatured(featuredRes.data);
      if (latestRes.data) setLatest(latestRes.data);

      const { data: allActive } = await supabase.from("car_listings").select("body_type, fuel_type").eq("status", "active").eq("country", country);
      if (allActive) {
        const counts: Record<string, number> = {};
        allActive.forEach((l: any) => {
          if (l.body_type) counts[l.body_type] = (counts[l.body_type] || 0) + 1;
          if (l.fuel_type === "Electric") counts["Electric"] = (counts["Electric"] || 0) + 1;
          if (l.fuel_type === "Hybrid") counts["Hybrid"] = (counts["Hybrid"] || 0) + 1;
        });
        setCategoryCounts(counts);
      }
      setLoading(false);
    };
    fetchData();
  }, [country]);

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

      {/* Trust Section — Enhanced with image */}
      <section className="border-y border-border bg-secondary/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-4">Why AutoVault</Badge>
              <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Buy with Complete Confidence</h2>
              <p className="mt-2 text-muted-foreground">We go the extra mile to ensure every transaction is safe and transparent</p>
              <div className="mt-8 space-y-6">
                {[
                  { icon: Shield, title: "Verified Listings", desc: "Every dealer is vetted. Verified badges mean the vehicle has passed our checks for legality and outstanding finance." },
                  { icon: Search, title: "Finance & Legal Check", desc: "Instantly check if a vehicle has outstanding finance, is reported stolen, or has been written off — before you buy." },
                  { icon: FileCheck, title: "Full History Reports", desc: "Access complete MOT history, mileage verification, and previous owner details with a single click." },
                ].map((item, i) => (
                  <motion.div key={item.title} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="hidden lg:block">
              <img src={trustImage} alt="Vehicle verification process" className="rounded-2xl shadow-elevated" loading="lazy" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center">
          <Badge variant="outline" className="mb-4">Testimonials</Badge>
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">What Our Users Say</h2>
          <p className="mt-2 text-muted-foreground">Trusted by thousands of buyers, sellers, and dealers</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <Quote className="h-5 w-5 text-primary/40" />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
              <div className="mt-4 flex items-center gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-warning text-warning" />
                ))}
              </div>
              <div className="mt-2">
                <p className="font-display text-sm font-semibold text-card-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.location}</p>
              </div>
            </motion.div>
          ))}
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

      {/* Blog Teaser */}
      <section className="border-t border-border bg-secondary/30 py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">From the Blog</h2>
              <p className="mt-1 text-muted-foreground">Tips, guides and expert advice</p>
            </div>
            <Link to="/blog">
              <Button variant="ghost" className="text-primary">View All <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              { title: "Used Car Buying Checklist 2026", cat: "Buying Guide", img: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&q=80" },
              { title: "Electric vs Hybrid: Which Is Right?", cat: "EV Guide", img: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&q=80" },
              { title: "10 Tips to Sell Your Car Fast", cat: "Selling Tips", img: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&q=80" },
            ].map((post, i) => (
              <Link key={i} to="/blog" className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:shadow-elevated">
                <img src={post.img} alt={post.title} className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                <div className="p-4">
                  <Badge variant="outline" className="text-xs">{post.cat}</Badge>
                  <h3 className="mt-2 font-display text-sm font-semibold text-card-foreground">{post.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-dark py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl font-bold text-primary-foreground md:text-4xl">Ready to Sell Your Car?</h2>
          <p className="mx-auto mt-3 max-w-lg text-primary-foreground/70">Reach thousands of buyers instantly. Individual listings or dealer subscriptions available.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/sell"><Button size="lg" className="gradient-primary border-0 px-8">Post Your Ad — It's Free</Button></Link>
            <Link to="/dealers"><Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">Dealer Plans from {formatPrice(config.dealerPlans[0].price, config)}/mo</Button></Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
