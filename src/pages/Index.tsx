import Navbar from "@/components/Navbar";
import HeroSearch from "@/components/HeroSearch";
import CarCard from "@/components/CarCard";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import RecentlyViewedCarousel from "@/components/RecentlyViewedCarousel";
import BrowseByBodyType from "@/components/BrowseByBodyType";
import BudgetPresets from "@/components/BudgetPresets";
import RecentlySoldFeed from "@/components/RecentlySoldFeed";
import TrustReviewWidget from "@/components/TrustReviewWidget";
import EVSection from "@/components/EVSection";
import { CarGridSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  ArrowRight, Shield, Search, FileCheck, Car, Truck, Zap, Globe, Star, Quote,
  CheckCircle, Users, TrendingUp, Mail, Calculator,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import { useToast } from "@/hooks/use-toast";
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
  { name: "Sarah K.", location: "London", rating: 5, text: "Sold my BMW in 3 days. The verified badge made buyers trust my listing instantly." },
  { name: "James T.", location: "Manchester", rating: 5, text: "The finance check feature saved me from buying a car with outstanding debt." },
  { name: "Aisha M.", location: "Dubai", rating: 5, text: "As a dealer, AutoVault brings us qualified leads every day." },
  { name: "David R.", location: "New York", rating: 5, text: "Found my dream Porsche through AutoVault. Transparent and verified." },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const Index = () => {
  const { country, config } = useCountry();
  const { toast } = useToast();
  const [featured, setFeatured] = useState<any[]>([]);
  const [latest, setLatest] = useState<any[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

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

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: newsletterEmail.trim() });
    if (error?.code === "23505") {
      toast({ title: "Already subscribed", description: "This email is already on our list." });
    } else if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Subscribed!", description: "You'll receive the latest listings and deals." });
      setNewsletterEmail("");
    }
    setSubscribing(false);
  };

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

      {/* Browse by Body Type */}
      <BrowseByBodyType counts={categoryCounts} />

      {/* Budget Presets */}
      <BudgetPresets />

      {/* Featured */}
      <section className="border-y border-border bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Featured Vehicles</h2>
                <Badge className="gradient-primary border-0 text-primary-foreground">Hot</Badge>
              </div>
              <p className="mt-1 text-muted-foreground">Hand-picked premium listings</p>
            </div>
            <Link to="/browse?featured=true">
              <Button variant="ghost" size="sm" className="text-primary">See All <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </motion.div>

          <div className="mt-8">
            {loading ? (
              <CarGridSkeleton count={4} />
            ) : featured.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {featured.map((car, i) => <CarCard key={car.id} car={car} index={i} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16">
                <Car className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-muted-foreground">No featured vehicles yet. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <Badge variant="outline" className="mb-4 text-xs">Why AutoVault</Badge>
              <h2 className="font-display text-2xl font-bold text-foreground md:text-4xl">
                Buy with
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Complete Confidence</span>
              </h2>
              <p className="mt-3 max-w-lg text-muted-foreground">We go the extra mile to ensure every transaction is safe, transparent, and hassle-free.</p>

              <div className="mt-10 space-y-6">
                {[
                  { icon: Shield, title: "Verified Listings", desc: "Every dealer is vetted. Verified badges mean the vehicle has passed our checks for legality and outstanding finance." },
                  { icon: Search, title: "Finance & Legal Check", desc: "Instantly check if a vehicle has outstanding finance, is reported stolen, or has been written off." },
                  { icon: FileCheck, title: "Full History Reports", desc: "Access complete MOT history, mileage verification, and previous owner details with a single click." },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12 }}
                    viewport={{ once: true }}
                    className="flex gap-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 blur-xl" />
              <img src={trustImage} alt="Vehicle verification process" className="relative rounded-2xl shadow-elevated" loading="lazy" />
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-elevated">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="text-xs font-semibold text-card-foreground">Verified Clean</p>
                  <p className="text-[10px] text-muted-foreground">No finance · No theft</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Review Widget */}
      <TrustReviewWidget />

      {/* Social Proof Strip */}
      <section className="border-y border-border bg-muted/30 py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { icon: Users, value: "50,000+", label: "Active Users" },
              { icon: Car, value: "25,000+", label: "Vehicles Listed" },
              { icon: TrendingUp, value: "£2.3B+", label: "Total Value Sold" },
              { icon: Star, value: "4.9/5", label: "Average Rating" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="flex items-center gap-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-foreground md:text-xl">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <motion.div {...fadeUp} className="text-center">
          <Badge variant="outline" className="mb-4 text-xs">Testimonials</Badge>
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">What Our Users Say</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">Trusted by thousands of buyers, sellers, and dealers worldwide</p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              className="group rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-card"
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-warning text-warning" />
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
              <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recently Viewed */}
      <RecentlyViewedCarousel />

      {/* Car Valuation CTA */}
      <section className="container mx-auto px-4 py-12">
        <motion.div {...fadeUp}>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 md:p-12 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Calculator className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-foreground md:text-3xl">What's My Car Worth?</h2>
            <p className="mt-2 max-w-md text-muted-foreground">Get a free instant valuation in seconds. No sign-up required.</p>
            <Link to="/valuation">
              <Button className="gradient-primary mt-6 border-0 px-8" size="lg">
                Get Free Valuation <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Latest Listings */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Latest Listings</h2>
              <p className="mt-1 text-muted-foreground">Just posted by sellers near you</p>
            </div>
            <Link to="/browse">
              <Button variant="ghost" size="sm" className="text-primary">View All <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </motion.div>

          <div className="mt-8">
            {loading ? (
              <CarGridSkeleton count={4} />
            ) : latest.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {latest.map((car, i) => <CarCard key={car.id} car={car} index={i} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16">
                <Car className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-muted-foreground">No listings yet. Be the first to post!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Blog Teaser */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="flex items-end justify-between">
            <div>
              <Badge variant="outline" className="mb-3 text-xs">Blog</Badge>
              <h2 className="font-display text-2xl font-bold text-foreground">From the Blog</h2>
            </div>
            <Link to="/blog">
              <Button variant="ghost" size="sm" className="text-primary">View All <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </motion.div>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              { title: "Used Car Buying Checklist 2026", cat: "Buying Guide", img: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&q=80" },
              { title: "Electric vs Hybrid: Which Is Right?", cat: "EV Guide", img: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&q=80" },
              { title: "10 Tips to Sell Your Car Fast", cat: "Selling Tips", img: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&q=80" },
            ].map((post, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                <Link to="/blog" className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:shadow-elevated block">
                  <div className="overflow-hidden">
                    <img src={post.img} alt={post.title} className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  </div>
                  <div className="p-5">
                    <Badge variant="outline" className="text-[10px]">{post.cat}</Badge>
                    <h3 className="mt-2 font-display text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">{post.title}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter + CTA */}
      <section className="gradient-dark py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to Find Your Next Car?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-primary-foreground/60">
              Join thousands of buyers and sellers. Individual listings are free — dealer subscriptions start from {formatPrice(config.dealerPlans[0].price, config)}/mo.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link to="/sell">
                <Button size="lg" className="gradient-primary border-0 px-8 font-semibold">
                  Post Your Ad — Free
                </Button>
              </Link>
              <Link to="/dealers">
                <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  Dealer Plans
                </Button>
              </Link>
            </div>

            {/* Newsletter */}
            <form onSubmit={handleNewsletter} className="mx-auto mt-10 flex max-w-md gap-2">
              <Input
                type="email"
                placeholder="Enter your email for weekly deals"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="h-11 border-primary-foreground/10 bg-primary-foreground/5 text-primary-foreground placeholder:text-primary-foreground/40"
                required
              />
              <Button type="submit" size="lg" variant="secondary" className="h-11 shrink-0" disabled={subscribing}>
                <Mail className="mr-1 h-4 w-4" />
                {subscribing ? "..." : "Subscribe"}
              </Button>
            </form>
            <p className="mt-2 text-xs text-primary-foreground/40">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
