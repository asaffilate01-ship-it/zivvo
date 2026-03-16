import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Mail, Globe, Loader2, Car, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";

interface LandingConfig {
  hero_title?: string;
  hero_subtitle?: string;
  hero_image?: string;
  accent_color?: string;
  about_text?: string;
  show_phone?: boolean;
  show_email?: boolean;
  show_address?: boolean;
  cta_text?: string;
}

const DealerLanding = () => {
  const { slug } = useParams();
  const [dealer, setDealer] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<LandingConfig>({});

  useEffect(() => {
    const fetch = async () => {
      const { data: d } = await supabase
        .from("dealer_landing_public")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (d) {
        setDealer(d);
        setConfig((d.landing_page_config as LandingConfig) || {});
        const { data: cars } = await supabase
          .from("car_listings")
          .select("*")
          .eq("dealer_id", d.id)
          .eq("status", "active")
          .order("created_at", { ascending: false });
        if (cars) setListings(cars);
      }
      setLoading(false);
    };
    fetch();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex flex-col items-center justify-center px-4 py-32 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Dealer Not Found</h1>
          <p className="mt-2 text-muted-foreground">This dealer page may no longer be available.</p>
          <Link to="/browse">
            <Button className="mt-6 gradient-primary border-0">Browse All Cars</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const heroImage = config.hero_image || "https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=1920&q=80";
  const showPhone = config.show_phone !== false;
  const showEmail = config.show_email !== false;
  const showAddress = config.show_address !== false;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative overflow-hidden">
        <div className="gradient-dark absolute inset-0" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {config.accent_color && (
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundColor: config.accent_color }}
          />
        )}
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-background/10 backdrop-blur-sm">
              {dealer.logo_url ? (
                <img src={dealer.logo_url} alt={dealer.business_name} className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <Building2 className="h-10 w-10 text-primary-foreground" />
              )}
            </div>
            <h1 className="font-display text-3xl font-bold text-primary-foreground md:text-5xl">
              {config.hero_title || dealer.business_name}
            </h1>
            {config.hero_subtitle && (
              <p className="mt-3 text-lg text-primary-foreground/70">{config.hero_subtitle}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {dealer.kyc_verified && (
                <Badge className="bg-success/20 text-success border-0">
                  <BadgeCheck className="mr-1 h-3 w-3" /> Verified Dealer
                </Badge>
              )}
              <Badge variant="secondary" className="bg-primary-foreground/10 text-primary-foreground/80 border-0">
                {dealer.tier?.charAt(0).toUpperCase() + dealer.tier?.slice(1)} Plan
              </Badge>
            </div>

            {config.cta_text && (
              <a href="#inventory">
                <Button
                  className="mt-6 border-0 text-primary-foreground"
                  style={{ backgroundColor: config.accent_color || undefined }}
                >
                  {config.cta_text}
                </Button>
              </a>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-primary-foreground/60">
              {showAddress && (dealer.city || dealer.address) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {[dealer.address, dealer.city, dealer.postcode].filter(Boolean).join(", ")}
                </span>
              )}
              {showPhone && dealer.business_phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {dealer.business_phone}
                </span>
              )}
              {showEmail && dealer.business_email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {dealer.business_email}
                </span>
              )}
              {dealer.website_url && (
                <a href={dealer.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary-foreground">
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      {config.about_text && (
        <section className="border-b border-border">
          <div className="container mx-auto max-w-3xl px-4 py-10 text-center">
            <h2 className="font-display text-xl font-bold text-foreground">About Us</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground whitespace-pre-line">{config.about_text}</p>
          </div>
        </section>
      )}

      {/* Inventory */}
      <div id="inventory" className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Our Inventory
            <span className="ml-2 text-base font-normal text-muted-foreground">({listings.length} vehicles)</span>
          </h2>
        </div>

        {listings.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center">
            <Car className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-display text-lg font-semibold">No vehicles listed yet</h3>
            <p className="mt-1 text-muted-foreground">Check back soon for new inventory</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((car, i) => (
              <CarCard key={car.id} car={car} index={i} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default DealerLanding;
