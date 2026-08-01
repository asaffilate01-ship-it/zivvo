import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, MapPin, Phone, Mail, Globe, Loader2, Car, BadgeCheck,
  Star, Clock, Shield, Search, ArrowRight, MessageCircle, ChevronDown,
  Fuel, SlidersHorizontal, Award, ThumbsUp, Wrench, Heart, Sparkles,
  Facebook, Instagram, Twitter, Youtube, ExternalLink, Quote, CheckCircle2,
  Share2, Copy, Check, Eye, Calendar, CreditCard, Truck, FileCheck,
  HandCoins, ShieldCheck, TrendingUp, Search as SearchIcon, Gauge,
  ChevronUp, HelpCircle, Send, Trophy, Zap, Users, Euro,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import { useToast } from "@/hooks/use-toast";
import DealerEnquiryDialog from "@/components/dealer/DealerEnquiryDialog";
import DealerStickyBar from "@/components/dealer/DealerStickyBar";
import DealerLandingSkeleton from "@/components/dealer/DealerLandingSkeleton";
import LiveMap from "@/components/LiveMap";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import JustArrivedRail from "@/components/dealer/JustArrivedRail";
import VehicleFinderForm from "@/components/dealer/VehicleFinderForm";
import ListingMiniActions from "@/components/dealer/ListingMiniActions";
import FinanceCalculator from "@/components/dealer/FinanceCalculator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import defaultDealerHero from "@/assets/hero-cars.jpg";

export interface LandingConfig {
  hero_title?: string;
  hero_subtitle?: string;
  hero_image?: string;
  accent_color?: string;
  about_text?: string;
  show_phone?: boolean;
  show_email?: boolean;
  show_address?: boolean;
  cta_text?: string;
  tagline?: string;
  show_stats?: boolean;
  show_testimonials?: boolean;
  testimonials?: Array<{ name: string; text: string; rating: number }>;
  opening_hours?: string;
  specialities?: string[];
  hero_style?: "overlay" | "split" | "minimal";
  layout?: "grid" | "list";
  // New fields
  announcement?: string;
  whatsapp_number?: string;
  social_links?: { facebook?: string; instagram?: string; twitter?: string; youtube?: string };
  usps?: Array<{ icon: string; title: string; description: string }>;
  show_usps?: boolean;
  show_finance_cta?: boolean;
  finance_cta_text?: string;
  secondary_cta_text?: string;
  secondary_cta_url?: string;
  font_style?: "modern" | "classic" | "bold";
  show_featured_banner?: boolean;
  // Newer fields
  opening_hours_table?: Array<{ day: string; hours: string }>;
  faqs?: Array<{ q: string; a: string }>;
  finance_apr?: string;
  finance_disclaimer?: string;
  vat_number?: string;
  company_number?: string;
  fca_number?: string;
  established_year?: number;
  awards?: Array<{ name: string; image?: string }>;
  newsletter_enabled?: boolean;
}

const USP_ICONS: Record<string, any> = {
  award: Award,
  thumbsUp: ThumbsUp,
  wrench: Wrench,
  shield: Shield,
  heart: Heart,
  sparkles: Sparkles,
  checkCircle: CheckCircle2,
  car: Car,
  star: Star,
  clock: Clock,
};

const safeHttpsUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
};

const safeCtaUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return safeHttpsUrl(value);
};

const DealerLanding = () => {
  const { slug } = useParams();
  const { config: countryCfg } = useCountry();
  const { toast } = useToast();
  const [dealer, setDealer] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [filteredListings, setFilteredListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<LandingConfig>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterFuel, setFilterFuel] = useState("all");
  const [filterBody, setFilterBody] = useState("all");
  const [filterMake, setFilterMake] = useState("all");
  const [filterModel, setFilterModel] = useState("all");
  const [budgetMax, setBudgetMax] = useState<number | null>(null);
  const [budgetMode, setBudgetMode] = useState<"price" | "monthly">("price");
  const [monthlyMax, setMonthlyMax] = useState<number | null>(null);
  const [searchTab, setSearchTab] = useState<"buy" | "sell" | "finance" | "service">("buy");
  const [showAllCars, setShowAllCars] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [financeCar, setFinanceCar] = useState<{ id: string; price: number } | null>(null);
  const [newsletterSent, setNewsletterSent] = useState(false);
  const { items: recentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    const fetchDealer = async () => {
      const { data: d } = await supabase
        .from("dealer_landing_public")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (d) {
        setDealer(d);
        setConfig((d.landing_page_config as LandingConfig) || {});
        const { data: cars } = await supabase
          .from("car_listings_public")
          .select("*")
          .eq("dealer_id", d.id)
          .eq("status", "active")
          .order("created_at", { ascending: false });
        if (cars) {
          setListings(cars);
          setFilteredListings(cars);
        }
      }
      setLoading(false);
    };
    fetchDealer();
  }, [slug]);

  useEffect(() => {
    let result = [...listings];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) => c.title?.toLowerCase().includes(q) || c.make?.toLowerCase().includes(q) || c.model?.toLowerCase().includes(q)
      );
    }
    if (filterFuel !== "all") result = result.filter((c) => c.fuel_type === filterFuel);
    if (filterBody !== "all") result = result.filter((c) => c.body_type === filterBody);
    if (filterMake !== "all") result = result.filter((c) => c.make === filterMake);
    if (filterModel !== "all") result = result.filter((c) => c.model === filterModel);
    if (budgetMode === "price" && budgetMax !== null) result = result.filter((c) => (c.price || 0) <= budgetMax);
    // Approx monthly @ representative APR over 48 months — used purely for filtering
    if (budgetMode === "monthly" && monthlyMax !== null) {
      const approxMonthly = (price: number) => Math.round((price * 0.0245)); // ~€245/mo per €10k
      result = result.filter((c) => approxMonthly(c.price || 0) <= monthlyMax);
    }
    result.sort((a, b) => {
      if (sortBy === "price-low") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price-high") return (b.price || 0) - (a.price || 0);
      if (sortBy === "year") return (b.year || 0) - (a.year || 0);
      if (sortBy === "mileage") return (a.mileage || 0) - (b.mileage || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setFilteredListings(result);
  }, [listings, searchQuery, sortBy, filterFuel, filterBody, filterMake, filterModel, budgetMax, budgetMode, monthlyMax]);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${dealer?.business_name || "Händler"} auf Zivvo`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      toast({ title: "Link kopiert", description: "Die Händlerseite kann jetzt geteilt werden." });
      setTimeout(() => setShared(false), 2000);
    } catch {
      toast({ title: "Kopieren fehlgeschlagen", description: "Bitte kopieren Sie die Adresse aus der Browserzeile.", variant: "destructive" });
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !/^\S+@\S+\.\S+$/.test(newsletterEmail)) {
      toast({ title: "Ungültige E-Mail-Adresse", description: "Bitte geben Sie eine gültige E-Mail-Adresse ein.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.functions.invoke("newsletter-subscribe", { body: { email: newsletterEmail } });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast({ title: "Anmeldung fehlgeschlagen", description: error.message, variant: "destructive" });
      return;
    }
    setNewsletterSent(true);
    toast({ title: "Angemeldet", description: "Sie erhalten künftig Zivvo-Updates per E-Mail." });
    setNewsletterEmail("");
    setTimeout(() => setNewsletterSent(false), 4000);
  };

  const uniqueFuels = [...new Set(listings.map((c) => c.fuel_type).filter(Boolean))];
  const uniqueBodies = [...new Set(listings.map((c) => c.body_type).filter(Boolean))];
  const uniqueMakes = [...new Set(listings.map((c) => c.make).filter(Boolean))];
  const displayedListings = showAllCars ? filteredListings : filteredListings.slice(0, 12);
  const fontClass = config.font_style === "classic" ? "font-serif" : config.font_style === "bold" ? "font-black tracking-tight" : "font-display";

  if (loading) {
    return <DealerLandingSkeleton />;
  }

  if (!dealer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex flex-col items-center justify-center px-4 py-32 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Händler nicht gefunden</h1>
          <p className="mt-2 text-muted-foreground">Diese Händlerseite ist möglicherweise nicht mehr verfügbar.</p>
          <Link to="/browse">
            <Button className="mt-6 gradient-primary border-0">Alle Fahrzeuge ansehen</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const accent = /^#[0-9a-f]{3,8}$/i.test(config.accent_color || "") ? config.accent_color! : "hsl(var(--primary))";
  const heroImage = safeHttpsUrl(config.hero_image) || defaultDealerHero;
  const showPhone = config.show_phone !== false;
  const showEmail = config.show_email !== false;
  const showAddress = config.show_address !== false;
  const heroStyle = config.hero_style || "overlay";
  const secondaryCtaUrl = safeCtaUrl(config.secondary_cta_url);
  const websiteUrl = safeHttpsUrl(dealer.website_url);
  const socialLinks = {
    facebook: safeHttpsUrl(config.social_links?.facebook),
    instagram: safeHttpsUrl(config.social_links?.instagram),
    twitter: safeHttpsUrl(config.social_links?.twitter),
    youtube: safeHttpsUrl(config.social_links?.youtube),
  };
  const hasSocials = Object.values(socialLinks).some(Boolean);

  const priceRange = listings.length > 0
    ? { min: Math.min(...listings.map((c) => c.price)), max: Math.max(...listings.map((c) => c.price)) }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${dealer.business_name} — Zivvo Händler`}
        description={config.about_text || `Fahrzeuge von ${dealer.business_name} auf Zivvo ansehen.`}
      />
      <Navbar />

      {/* ─── Announcement Bar ─── */}
      {config.announcement && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-border py-2 text-center text-sm font-medium"
          style={{ backgroundColor: `${accent}10`, color: accent }}
        >
          <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
          {config.announcement}
        </motion.div>
      )}

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        {heroStyle === "split" ? (
          <div className="grid lg:grid-cols-2">
            <div className="flex flex-col justify-center px-6 py-16 md:px-12 lg:py-24">
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                {dealer.logo_url && (
                  <img src={dealer.logo_url} alt={dealer.business_name} className="mb-6 h-14 w-auto object-contain" />
                )}
                <h1 className={`${fontClass} text-3xl font-bold text-foreground md:text-5xl lg:text-6xl`}>
                  {config.hero_title || dealer.business_name}
                </h1>
                {(config.hero_subtitle || config.tagline) && (
                  <p className="mt-4 max-w-md text-lg text-muted-foreground">
                    {config.hero_subtitle || config.tagline}
                  </p>
                )}
                <HeroBadges dealer={dealer} config={config} accent={accent} />
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#inventory">
                    <Button size="lg" className="border-0 text-white shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: accent }}>
                      {config.cta_text || "Bestand ansehen"} <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </a>
                  {config.secondary_cta_text && secondaryCtaUrl && (
                    <a href={secondaryCtaUrl}>
                      <Button size="lg" variant="outline">{config.secondary_cta_text}</Button>
                    </a>
                  )}
                  {!config.secondary_cta_text && showPhone && dealer.business_phone && (
                    <a href={`tel:${dealer.business_phone}`}>
                      <Button size="lg" variant="outline"><Phone className="mr-1 h-4 w-4" /> Anrufen</Button>
                    </a>
                  )}
                </div>
              </motion.div>
            </div>
            <div className="relative min-h-[300px] lg:min-h-0">
              <img src={heroImage} alt="Dealership" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent lg:block hidden" />
            </div>
          </div>
        ) : heroStyle === "minimal" ? (
          <div className="border-b border-border">
            <div className="container mx-auto px-4 py-12 md:py-16">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center md:flex-row md:text-left md:gap-8">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-card">
                  {dealer.logo_url ? (
                    <img src={dealer.logo_url} alt={dealer.business_name} className="h-14 w-14 rounded-xl object-contain" />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h1 className={`${fontClass} text-3xl font-bold text-foreground md:text-4xl`}>
                    {config.hero_title || dealer.business_name}
                  </h1>
                  {config.hero_subtitle && (
                    <p className="mt-1 text-muted-foreground">{config.hero_subtitle}</p>
                  )}
                  <HeroBadges dealer={dealer} config={config} accent={accent} />
                </div>
                <div className="mt-4 flex gap-3 md:ml-auto md:mt-0">
                  <a href="#inventory">
                    <Button className="border-0 text-white" style={{ backgroundColor: accent }}>
                      {config.cta_text || "Bestand ansehen"}
                    </Button>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* Default overlay hero */
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/80 via-foreground/60 to-foreground/90" />
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
            {accent !== "hsl(var(--primary))" && (
              <div className="absolute inset-0 opacity-15" style={{ backgroundColor: accent }} />
            )}
            <div className="container relative mx-auto px-4 py-20 md:py-32">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mx-auto max-w-3xl text-center"
              >
                {dealer.logo_url && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-2xl"
                  >
                    <img src={dealer.logo_url} alt={dealer.business_name} className="h-14 w-14 rounded-xl object-contain" />
                  </motion.div>
                )}
                <h1 className={`${fontClass} text-4xl font-bold text-white md:text-6xl`}>
                  {config.hero_title || dealer.business_name}
                </h1>
                {config.hero_subtitle && (
                  <p className="mt-4 text-lg text-white/70">{config.hero_subtitle}</p>
                )}
                <HeroBadges dealer={dealer} config={config} accent={accent} isOnDark />

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <a href="#inventory">
                    <Button size="lg" className="border-0 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105" style={{ backgroundColor: accent }}>
                      {config.cta_text || "Bestand durchsuchen"} <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </a>
                  {config.secondary_cta_text && secondaryCtaUrl ? (
                    <a href={secondaryCtaUrl}>
                      <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        {config.secondary_cta_text}
                      </Button>
                    </a>
                  ) : showPhone && dealer.business_phone ? (
                    <a href={`tel:${dealer.business_phone}`}>
                      <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        <Phone className="mr-1 h-4 w-4" /> Jetzt anrufen
                      </Button>
                    </a>
                  ) : null}
                </div>

                <ContactBar dealer={dealer} config={config} showPhone={showPhone} showEmail={showEmail} showAddress={showAddress} isOnDark />
              </motion.div>
            </div>
          </>
        )}
      </section>

      {/* ─── Quick Action Panel (Jim Reid–style tabbed search) ─── */}
      {listings.length > 0 && (
        <section className="relative -mt-6 md:-mt-16 z-10 px-4">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              {/* Tab strip */}
              <div role="tablist" className="grid grid-cols-4 border-b border-border">
                {[
                  { id: "buy" as const, label: "Buy", icon: Car },
                  { id: "sell" as const, label: "Verkaufen", icon: Euro },
                  { id: "finance" as const, label: "Finanzierung", icon: HandCoins },
                  { id: "service" as const, label: "Service", icon: Wrench },
                ].map((t) => {
                  const active = searchTab === t.id;
                  return (
                    <button
                      key={t.id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSearchTab(t.id)}
                      className={`group relative flex flex-col items-center justify-center gap-1.5 px-3 py-4 text-xs font-semibold transition-colors md:flex-row md:gap-2 md:py-5 md:text-sm ${
                        active ? "text-white" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                      style={active ? { backgroundColor: accent } : undefined}
                    >
                      <t.icon className="h-4 w-4 md:h-5 md:w-5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab body */}
              <div className="p-5 md:p-7">
                {searchTab === "buy" && (
                  <div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h2 className={`${fontClass} text-lg font-bold text-foreground md:text-xl`}>
                        Finden Sie das passende Fahrzeug im aktuellen Bestand
                      </h2>
                      <Badge variant="outline" className="hidden whitespace-nowrap md:inline-flex">
                        {listings.length} Fahrzeuge verfügbar
                      </Badge>
                    </div>

                    {/* Make / Model / Fuel row */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <Select value={filterMake} onValueChange={(v) => { setFilterMake(v); setFilterModel("all"); }}>
                        <SelectTrigger><SelectValue placeholder="Alle Marken" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Marken</SelectItem>
                          {uniqueMakes.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={filterModel} onValueChange={setFilterModel} disabled={filterMake === "all"}>
                        <SelectTrigger><SelectValue placeholder={filterMake === "all" ? "Zuerst Marke wählen" : "Alle Modelle"} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Modelle</SelectItem>
                          {[...new Set(listings.filter((c) => c.make === filterMake).map((c) => c.model).filter(Boolean))].map((m) => (
                            <SelectItem key={m as string} value={m as string}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={filterFuel} onValueChange={setFilterFuel}>
                        <SelectTrigger><SelectValue placeholder="Alle Kraftstoffarten" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Kraftstoffarten</SelectItem>
                          {[...new Set(listings.map((c) => c.fuel_type).filter(Boolean))].map((f) => (
                            <SelectItem key={f as string} value={f as string}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Full Price ⇄ Monthly Budget toggle */}
                    <div className="mt-4 flex rounded-full bg-muted p-1">
                      {(["price", "monthly"] as const).map((mode) => {
                        const active = budgetMode === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setBudgetMode(mode)}
                            className={`flex-1 rounded-full px-4 py-1.5 text-xs font-semibold transition-all md:text-sm ${
                              active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {mode === "price" ? "Gesamtpreis" : "Monatsbudget"}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {budgetMode === "price" ? (
                        <>
                          <Select value="any" onValueChange={() => {}} disabled>
                            <SelectTrigger><SelectValue placeholder="Kein Mindestpreis" /></SelectTrigger>
                            <SelectContent><SelectItem value="any">Kein Mindestpreis</SelectItem></SelectContent>
                          </Select>
                          <Select value={budgetMax === null ? "any" : String(budgetMax)} onValueChange={(v) => setBudgetMax(v === "any" ? null : Number(v))}>
                            <SelectTrigger><SelectValue placeholder="Kein Höchstpreis" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Kein Höchstpreis</SelectItem>
                              {[5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000].map((p) => (
                                <SelectItem key={p} value={String(p)}>Bis {formatPrice(p, countryCfg)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      ) : (
                        <>
                          <Select value="any" onValueChange={() => {}} disabled>
                            <SelectTrigger><SelectValue placeholder="Kein Minimum/Monat" /></SelectTrigger>
                            <SelectContent><SelectItem value="any">Kein Minimum/Monat</SelectItem></SelectContent>
                          </Select>
                          <Select value={monthlyMax === null ? "any" : String(monthlyMax)} onValueChange={(v) => setMonthlyMax(v === "any" ? null : Number(v))}>
                            <SelectTrigger><SelectValue placeholder="Kein Maximum/Monat" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Kein Maximum/Monat</SelectItem>
                              {[150, 200, 250, 300, 400, 500, 750, 1000].map((p) => (
                                <SelectItem key={p} value={String(p)}>Bis {formatPrice(p, countryCfg)} /Monat</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>

                    <a href="#inventory">
                      <Button
                        size="lg"
                        className="mt-4 w-full border-0 text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110"
                        style={{ backgroundColor: accent }}
                      >
                        <Search className="mr-2 h-4 w-4" />
                        Suchen ({filteredListings.length})
                      </Button>
                    </a>

                    <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                      Monatsraten sind unverbindliche Rechenbeispiele. {config.finance_apr ? `Verwendete Zinsannahme: ${config.finance_apr}% effektiver Jahreszins. ` : ""}
                      {config.finance_disclaimer || "Verfügbarkeit und vollständige Kreditbedingungen bestätigt ausschließlich der Händler."}
                    </p>
                  </div>
                )}

                {searchTab === "sell" && (
                  <div className="space-y-4 text-center">
                    <div
                      className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${accent}15` }}
                    >
                      <Euro className="h-7 w-7" style={{ color: accent }} />
                    </div>
                    <div>
                      <h3 className={`${fontClass} text-xl font-bold text-foreground`}>Unverbindliche Marktpreisorientierung</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Vergleichen Sie Ihr Fahrzeug mit aktuellen Zivvo-Inseraten und fragen Sie eine Inzahlungnahme separat bei {dealer.business_name} an.
                      </p>
                    </div>
                    <div className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row">
                      <Link to="/valuation" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full border-0 text-white" style={{ backgroundColor: accent }}>
                          Fahrzeug einordnen <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {searchTab === "finance" && (
                  <div className="space-y-4 text-center">
                    <div
                      className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${accent}15` }}
                    >
                      <HandCoins className="h-7 w-7" style={{ color: accent }} />
                    </div>
                    <div>
                      <h3 className={`${fontClass} text-xl font-bold text-foreground`}>
                        Finanzierung beim Händler anfragen
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Verfügbarkeit, Anbieter, effektiver Jahreszins, Gesamtkosten und Händlerrolle müssen vor einem Antrag offengelegt werden.
                      </p>
                    </div>
                    <div className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row">
                      <a href="#finance" className="flex-1">
                        <Button size="lg" variant="outline" className="w-full">Rechenbeispiele ansehen</Button>
                      </a>
                      <Button
                        size="lg"
                        className="flex-1 border-0 text-white"
                        style={{ backgroundColor: accent }}
                        onClick={() => setEnquiryOpen(true)}
                      >
                        Anfrage senden <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Eine Anfrage ist keine Kreditzusage. Prüfen Sie die regulierten Unterlagen des tatsächlichen Anbieters.
                    </p>
                  </div>
                )}

                {searchTab === "service" && (
                  <div className="space-y-4 text-center">
                    <div
                      className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${accent}15` }}
                    >
                      <Wrench className="h-7 w-7" style={{ color: accent }} />
                    </div>
                    <div>
                      <h3 className={`${fontClass} text-xl font-bold text-foreground`}>Servicing & aftercare</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Wartung, HU/AU, Reparaturen und Garantieleistungen können Sie direkt beim Händler anfragen. Umfang und Anbieter bestätigt der Händler individuell.
                      </p>
                    </div>
                    <div className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row">
                      <Button
                        size="lg"
                        className="flex-1 border-0 text-white"
                        style={{ backgroundColor: accent }}
                        onClick={() => setEnquiryOpen(true)}
                      >
                        Service anfragen
                      </Button>
                      {(dealer as any)?.business_phone && (
                        <a href={`tel:${(dealer as any).business_phone}`} className="flex-1">
                          <Button size="lg" variant="outline" className="w-full">
                            <Phone className="mr-2 h-4 w-4" /> Händler anrufen
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      )}


      {/* ─── Just Arrived rail ─── */}
      {dealer?.id && <JustArrivedRail dealerId={dealer.id} />}

      {/* ─── Why Choose Us — Feature Row (Carlingo-style) ─── */}
      <section className="border-b border-border bg-background py-14 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <h2 className={`${fontClass} text-3xl font-bold text-foreground md:text-4xl`}>
              Aktuellen Fahrzeugbestand vergleichen
            </h2>
            <p className="mt-2 text-muted-foreground">
              Prüfen Sie die Angaben jedes Fahrzeugs und kontaktieren Sie den Händler bei Fragen.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "Aktueller Bestand", desc: `${listings.length || "Verfügbare"} Fahrzeuge ansehen und wichtige Angaben selbst prüfen.`, href: "#inventory" },
              { icon: FileCheck, title: "Dokumentenstatus", desc: "Jedes Inserat zeigt die aktuell verfügbaren Prüf- und Dokumentenangaben.", href: "#inventory" },
              { icon: HandCoins, title: "Finanzierung anfragen", desc: config.finance_apr ? `Die angezeigte Zinsannahme von ${config.finance_apr}% ist nur ein Rechenwert. Fragen Sie den Händler nach Anbieter und vollständigen Bedingungen.` : "Fragen Sie den Händler, ob für ein bestimmtes Fahrzeug eine Finanzierung verfügbar ist.", href: "#inventory" },
              { icon: Trophy, title: config.established_year ? `Gegründet ${config.established_year}` : "Händlerangaben", desc: config.established_year ? "Prüfen Sie Historie und aktuelle Unternehmensangaben des Händlers vor dem Kauf." : "Prüfen Sie das Händlerprofil und fordern Sie vor dem Kauf schriftliche Bedingungen an.", href: "#about" },
            ].map((f, i) => (
              <motion.a
                key={f.title}
                href={f.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-transparent hover:shadow-xl"
              >
                <div
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${accent}15` }}
                >
                  <f.icon className="h-7 w-7" style={{ color: accent }} />
                </div>
                <h3 className={`${fontClass} mb-1.5 text-lg font-bold text-foreground`}>{f.title}</h3>
                <p className="flex-1 text-sm text-muted-foreground">{f.desc}</p>
                <div
                  className="mt-4 inline-flex items-center text-sm font-semibold transition-transform group-hover:translate-x-1"
                  style={{ color: accent }}
                >
                  Mehr erfahren <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats Strip ─── */}
      {config.show_stats !== false && (
        <section className="border-b border-border bg-card">
          <div className="container mx-auto grid grid-cols-2 gap-px md:grid-cols-4">
            {[
              { icon: Car, value: listings.length, label: "Fahrzeuge im Bestand", isString: false },
              { icon: MapPin, value: dealer.city || "Deutschland", label: "Standort", isString: true },
              { icon: Clock, value: config.opening_hours || "Nicht angegeben", label: "Öffnungszeiten", isString: true },
              {
                icon: Shield,
                value: priceRange ? `Ab ${formatPrice(priceRange.min, countryCfg)}` : (dealer.kyc_verified ? "Freigegeben" : "Profil"),
                label: priceRange ? "Einstiegspreis" : "Händlerstatus",
                isString: true,
              },
            ].map((stat: any, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="group flex items-center gap-3 px-6 py-5 transition-colors hover:bg-muted/30"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${accent}15` }}
                >
                  <stat.icon className="h-5 w-5" style={{ color: accent }} />
                </div>
                <div>
                  <p className={`${fontClass} text-lg font-bold text-foreground`}>
                    {stat.isString ? stat.value : <CountUp end={stat.value as number} decimals={stat.decimals || 0} suffix={stat.suffix || ""} />}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Brands We Stock ─── */}
      {uniqueMakes.length >= 3 && (
        <section className="border-b border-border bg-card py-10">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6 text-center">
              <Badge variant="outline" className="mb-2 text-xs">Brands We Stock</Badge>
              <h2 className={`${fontClass} text-2xl font-bold text-foreground md:text-3xl`}>Shop by manufacturer</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tap a brand to filter our inventory instantly</p>
            </motion.div>
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
              <button
                type="button"
                onClick={() => { setFilterMake("all"); document.getElementById("inventory")?.scrollIntoView({ behavior: "smooth" }); }}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${filterMake === "all" ? "text-white border-transparent" : "border-border bg-background text-foreground hover:-translate-y-0.5 hover:shadow-sm"}`}
                style={filterMake === "all" ? { backgroundColor: accent } : undefined}
              >
                All ({listings.length})
              </button>
              {uniqueMakes.map((make) => {
                const count = listings.filter((c) => c.make === make).length;
                const active = filterMake === make;
                return (
                  <button
                    key={make}
                    type="button"
                    onClick={() => { setFilterMake(active ? "all" : make!); document.getElementById("inventory")?.scrollIntoView({ behavior: "smooth" }); }}
                    className={`group flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${active ? "text-white border-transparent" : "border-border bg-background text-foreground hover:-translate-y-0.5 hover:shadow-sm"}`}
                    style={active ? { backgroundColor: accent } : undefined}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                      {make!.charAt(0)}
                    </span>
                    <span>{make}</span>
                    <span className={`text-xs ${active ? "text-white/80" : "text-muted-foreground"}`}>· {count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Inventory at a Glance ─── */}
      {listings.length >= 4 && (
        <section className="border-b border-border py-10">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6 flex items-end justify-between gap-4 flex-wrap">
              <div>
                <Badge variant="outline" className="mb-2 text-xs">At a Glance</Badge>
                <h2 className={`${fontClass} text-2xl font-bold text-foreground md:text-3xl`}>Browse our stock</h2>
                <p className="mt-1 text-sm text-muted-foreground">Quick filters to find your perfect car</p>
              </div>
            </motion.div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(() => {
                const bodyCounts: Record<string, number> = {};
                listings.forEach((c) => {
                  if (c.body_type) bodyCounts[c.body_type] = (bodyCounts[c.body_type] || 0) + 1;
                });
                return Object.entries(bodyCounts)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 4)
                  .map(([body, count], i) => (
                    <motion.button
                      key={body}
                      type="button"
                      onClick={() => {
                        setFilterBody(body);
                        document.getElementById("inventory")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      viewport={{ once: true }}
                      className="group rounded-2xl border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                      style={{ borderColor: filterBody === body ? accent : "hsl(var(--border))" }}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                          style={{ backgroundColor: `${accent}12` }}
                        >
                          <Car className="h-5 w-5" style={{ color: accent }} />
                        </div>
                        <span className={`${fontClass} text-2xl font-bold text-foreground`}>{count}</span>
                      </div>
                      <p className={`${fontClass} mt-3 font-semibold text-foreground`}>{body}</p>
                      <p className="text-xs text-muted-foreground">View all {body.toLowerCase()}s →</p>
                    </motion.button>
                  ));
              })()}
            </div>

            {/* Quick price highlights */}
            {priceRange && listings.length >= 6 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <QuickStatTile icon={TrendingUp} label="Price range" value={`${formatPrice(priceRange.min, countryCfg)} – ${formatPrice(priceRange.max, countryCfg)}`} accent={accent} />
                <QuickStatTile icon={Calendar} label="Newest model year" value={String(Math.max(...listings.map((c) => c.year || 0)))} accent={accent} />
                <QuickStatTile icon={Gauge} label="Avg. mileage" value={`${Math.round(listings.reduce((s, c) => s + (c.mileage || 0), 0) / Math.max(listings.length, 1)).toLocaleString()} ${countryCfg.distanceUnit}`} accent={accent} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── USPs (Why Choose Us) ─── */}
      {config.show_usps !== false && config.usps && config.usps.length > 0 && (
        <section className="border-b border-border py-12 md:py-16">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <Badge variant="outline" className="mb-3 text-xs">Why Choose Us</Badge>
              <h2 className={`${fontClass} text-2xl font-bold text-foreground md:text-3xl`}>Why Buy From {dealer.business_name}?</h2>
            </motion.div>
            <div className={`grid gap-6 ${config.usps.length <= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
              {config.usps.map((usp, i) => {
                const IconComp = USP_ICONS[usp.icon] || CheckCircle2;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="group relative rounded-2xl border border-border bg-card p-6 text-center transition-all hover:shadow-lg hover:-translate-y-1"
                  >
                    <div
                      className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${accent}12` }}
                    >
                      <IconComp className="h-6 w-6" style={{ color: accent }} />
                    </div>
                    <h3 className={`${fontClass} text-base font-bold text-foreground`}>{usp.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{usp.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── About ─── */}
      {config.about_text && (
        <section className="border-b border-border">
          <div className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-2 lg:py-16">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Badge variant="outline" className="mb-3 text-xs">About</Badge>
              <h2 className={`${fontClass} text-2xl font-bold text-foreground md:text-3xl`}>About {dealer.business_name}</h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{config.about_text}</p>

              {config.specialities && config.specialities.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {config.specialities.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              )}

              {/* Social Links */}
              {hasSocials && (
                <div className="mt-6 flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-medium">Folgen:</span>
                  {socialLinks.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                      <Facebook className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                      <Instagram className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                      <Twitter className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                      <Youtube className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                </div>
              )}
            </motion.div>

            {/* Contact card */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <h3 className={`${fontClass} text-base font-semibold text-card-foreground mb-4`}>Contact Information</h3>
                <div className="space-y-3">
                  {showPhone && dealer.business_phone && (
                    <a href={`tel:${dealer.business_phone}`} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}15` }}>
                        <Phone className="h-4 w-4" style={{ color: accent }} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium text-foreground">{dealer.business_phone}</p>
                      </div>
                    </a>
                  )}
                  {showEmail && dealer.business_email && (
                    <a href={`mailto:${dealer.business_email}`} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}15` }}>
                        <Mail className="h-4 w-4" style={{ color: accent }} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium text-foreground">{dealer.business_email}</p>
                      </div>
                    </a>
                  )}
                  {showAddress && dealer.city && (
                    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}15` }}>
                        <MapPin className="h-4 w-4" style={{ color: accent }} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="text-sm font-medium text-foreground">{dealer.city}{dealer.country ? `, ${dealer.country}` : ""}</p>
                      </div>
                    </div>
                  )}
                  {websiteUrl && (
                    <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}15` }}>
                        <Globe className="h-4 w-4" style={{ color: accent }} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Website</p>
                        <p className="text-sm font-medium text-foreground">Website besuchen</p>
                      </div>
                    </a>
                  )}
                </div>

                <Button
                  onClick={() => setEnquiryOpen(true)}
                  className="mt-5 w-full border-0 text-white"
                  style={{ backgroundColor: accent }}
                >
                  <MessageCircle className="mr-1 h-4 w-4" /> Enquire Now
                </Button>

                {showAddress && typeof (dealer as any).latitude === "number" && typeof (dealer as any).longitude === "number" && (
                  <div className="mt-5 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Find us</p>
                    <LiveMap
                      markers={[{
                        id: dealer.id,
                        lat: (dealer as any).latitude,
                        lng: (dealer as any).longitude,
                        title: dealer.business_name,
                      }]}
                      fallbackCenter={{ lat: (dealer as any).latitude, lng: (dealer as any).longitude }}
                      fallbackZoom={14}
                      height="200px"
                      showUserLocation
                      fitToMarkers
                    />
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${(dealer as any).latitude},${(dealer as any).longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs font-medium hover:underline"
                      style={{ color: accent }}
                    >
                      Get directions →
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ─── Featured Cars Banner ─── */}
      {config.show_featured_banner !== false && listings.filter((c) => c.is_promoted || c.is_featured).length > 0 && (
        <section className="border-b border-border py-10" style={{ background: `linear-gradient(135deg, ${accent}05, ${accent}10)` }}>
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Badge className="mb-2 border-0 text-white text-xs" style={{ backgroundColor: accent }}>
                  <Sparkles className="mr-1 h-3 w-3" /> Featured
                </Badge>
                <h2 className={`${fontClass} text-xl font-bold text-foreground`}>Spotlight Vehicles</h2>
              </div>
              <a href="#inventory">
                <Button variant="ghost" size="sm" className="text-xs">View All <ArrowRight className="ml-1 h-3 w-3" /></Button>
              </a>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listings.filter((c) => c.is_promoted || c.is_featured).slice(0, 3).map((car, i) => (
                <CarCard key={car.id} car={car} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── How Buying Works ─── */}
      <section className="border-b border-border py-14 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-xs">Einfacher Ablauf</Badge>
            <h2 className={`${fontClass} text-2xl font-bold text-foreground md:text-3xl`}>So funktioniert der Kauf</h2>
            <p className="mt-2 text-muted-foreground max-w-lg mx-auto">Vom Stöbern bis zur Übergabe — vier transparente Schritte.</p>
          </motion.div>

          <div className="relative grid gap-8 md:grid-cols-4">
            <div className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            {[
              { icon: SearchIcon, title: "Stöbern", desc: "Prüfen Sie verfügbare Fahrzeugdaten und Fotos im aktuellen Bestand." },
              { icon: MessageCircle, title: "Anfragen", desc: "Stellen Sie Fragen und vereinbaren Sie Besichtigung oder Probefahrt direkt mit dem Händler." },
              { icon: FileCheck, title: "Reservieren", desc: "Berechtigte Fahrzeuge zeigen Betrag, Frist und Erstattungsbedingungen vor der Zahlung." },
              { icon: Truck, title: "Übernehmen", desc: "Vereinbaren Sie Abholung oder Lieferung und halten Sie die Übergabe schriftlich fest." },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative text-center"
              >
                <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                  <step.icon className="h-6 w-6" style={{ color: accent }} />
                  <span
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white shadow"
                    style={{ backgroundColor: accent }}
                  >
                    {i + 1}
                  </span>
                </div>
                <h3 className={`${fontClass} text-base font-bold text-foreground`}>{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust badges row ─── */}
      <section className="border-b border-border bg-muted/20 py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { icon: ShieldCheck, label: dealer.kyc_verified ? "Identität durch Zivvo geprüft" : "Händlerprofil" },
              { icon: BadgeCheck, label: "Fahrzeugangaben je Inserat" },
              { icon: HandCoins, label: "Inzahlungnahme anfragen" },
              { icon: CreditCard, label: "Finanzierung anfragen" },
            ].map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="flex items-center gap-2.5 text-sm font-medium text-foreground"
              >
                <b.icon className="h-5 w-5 shrink-0" style={{ color: accent }} />
                <span>{b.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Accreditations / Memberships ─── */}
      <section className="border-b border-border py-10">
        <div className="container mx-auto px-4">
          <p className="mb-5 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
            Vom Händler hinterlegte Mitgliedschaften
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 md:gap-x-12">
            {(config.awards || []).map((a, i) => (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="flex items-center gap-2 grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all"
              >
                {a.image ? (
                  <img src={a.image} alt={a.name} className="h-8 w-auto object-contain" />
                ) : (
                  <>
                    <Trophy className="h-4 w-4" style={{ color: accent }} />
                    <span className={`${fontClass} text-sm font-bold text-foreground tracking-wide`}>{a.name}</span>
                  </>
                )}
              </motion.div>
            ))}
            {(!config.awards || config.awards.length === 0) && <p className="text-sm text-muted-foreground">Keine externen Mitgliedschaften hinterlegt.</p>}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">Diese Angaben stammen vom Händler und stellen keine Zivvo-Zertifizierung dar.</p>
        </div>
      </section>

      {/* ─── Inventory ─── */}
      <section id="inventory" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 flex flex-wrap items-end justify-between gap-3"
          >
            <div>
              <h2 className={`${fontClass} text-2xl font-bold text-foreground md:text-3xl`}>Our Inventory</h2>
              <p className="mt-1 text-muted-foreground">
                {listings.length} vehicle{listings.length !== 1 ? "s" : ""} available
                {filteredListings.length !== listings.length && (
                  <> · <span className="text-foreground font-medium">{filteredListings.length} match{filteredListings.length !== 1 ? "es" : ""}</span></>
                )}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
              {shared ? <Check className="h-3.5 w-3.5 text-success" /> : <Share2 className="h-3.5 w-3.5" />}
              {shared ? "Copied" : "Share"}
            </Button>
          </motion.div>

          {/* Budget chips */}
          {listings.length > 3 && priceRange && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Budget:</span>
              {[5000, 10000, 20000, 35000, 50000]
                .filter((v) => v <= priceRange.max * 1.1 && v >= priceRange.min * 0.5)
                .map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setBudgetMax(budgetMax === v ? null : v)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      budgetMax === v
                        ? "border-transparent text-white"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                    style={budgetMax === v ? { backgroundColor: accent } : undefined}
                  >
                    Unter {formatPrice(v, countryCfg)}
                  </button>
                ))}
              {budgetMax !== null && (
                <button
                  type="button"
                  onClick={() => setBudgetMax(null)}
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  Zurücksetzen
                </button>
              )}
            </div>
          )}

          {/* Filters */}
          {listings.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Marke oder Modell suchen…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
              </div>
              {uniqueFuels.length > 1 && (
                <Select value={filterFuel} onValueChange={setFilterFuel}>
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <Fuel className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Kraftstoff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kraftstoffarten</SelectItem>
                    {uniqueFuels.map((f) => <SelectItem key={f} value={f!}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {uniqueBodies.length > 1 && (
                <Select value={filterBody} onValueChange={setFilterBody}>
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <Car className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Karosserie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Typen</SelectItem>
                    {uniqueBodies.map((b) => <SelectItem key={b} value={b!}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SlidersHorizontal className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Neueste zuerst</SelectItem>
                  <SelectItem value="price-low">Preis: niedrig–hoch</SelectItem>
                  <SelectItem value="price-high">Preis: hoch–niedrig</SelectItem>
                  <SelectItem value="year">Baujahr: neueste</SelectItem>
                  <SelectItem value="mileage">Kilometerstand: niedrigste</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
              <Car className="h-12 w-12 text-muted-foreground" />
              <h3 className={`mt-4 ${fontClass} text-lg font-semibold text-foreground`}>
                {searchQuery || filterFuel !== "all" || filterBody !== "all" ? "Keine passenden Fahrzeuge" : "Noch keine Fahrzeuge eingestellt"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery ? "Passen Sie Ihre Suche an" : "Schauen Sie bald wieder nach neuem Bestand"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayedListings.map((car, i) => (
                  <div key={car.id}>
                    <CarCard car={car} index={i} />
                    <ListingMiniActions
                      listingId={car.id}
                      dealerId={dealer?.id}
                      onFinance={() => setFinanceCar({ id: car.id, price: car.price })}
                    />
                  </div>
                ))}
              </div>
              {!showAllCars && filteredListings.length > 12 && (
                <div className="mt-8 text-center">
                  <Button variant="outline" size="lg" onClick={() => setShowAllCars(true)}>
                    Alle {filteredListings.length} Fahrzeuge anzeigen <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ─── Recently Viewed ─── */}
      {recentlyViewed.length > 0 && (
        <section className="border-t border-border bg-muted/20 py-10">
          <div className="container mx-auto px-4">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <Badge variant="outline" className="mb-2 text-xs"><Eye className="mr-1 h-3 w-3" /> Recently Viewed</Badge>
                <h2 className={`${fontClass} text-xl font-bold text-foreground md:text-2xl`}>Pick up where you left off</h2>
              </div>
            </div>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x">
              {recentlyViewed.slice(0, 8).map((c) => (
                <Link
                  key={c.id}
                  to={`/car/${c.id}`}
                  className="group relative w-[220px] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {c.image && (
                      <img src={c.image} alt={c.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold text-foreground">{c.title}</p>
                    <p className={`${fontClass} mt-1 text-base font-bold`} style={{ color: accent }}>
                      {formatPrice(c.price, countryCfg)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Vehicle Finder ─── */}
      {dealer?.id && (
        <section className="border-t border-border bg-muted/20 py-12 md:py-16">
          <div className="container mx-auto max-w-3xl px-4">
            <VehicleFinderForm dealerId={dealer.id} dealerName={dealer.business_name} />
          </div>
        </section>
      )}

      {/* ─── Part-Exchange / Trade-In CTA ─── */}
      <section className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid gap-6 rounded-3xl border border-border bg-card p-6 md:grid-cols-[1fr,auto] md:items-center md:p-8"
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${accent}15` }}
              >
                <HandCoins className="h-6 w-6" style={{ color: accent }} />
              </div>
              <div>
                <Badge variant="outline" className="mb-2 text-[10px]">Inzahlungnahme</Badge>
                <h3 className={`${fontClass} text-lg font-bold text-foreground md:text-xl`}>
                  Aktuelles Fahrzeug in Zahlung geben
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Erhalten Sie eine datenbasierte Marktpreisorientierung. Eine konkrete
                  Inzahlungnahme und deren Bedingungen vereinbaren Sie separat mit dem Händler.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Link to="/valuation">
                <Button className="border-0 text-white" style={{ backgroundColor: accent }}>
                  Marktpreis einordnen <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setEnquiryOpen(true)}>
                Händler kontaktieren
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Finance Representative Bar ─── */}
      {config.show_finance_cta === true && (
        <section className="border-t border-border bg-muted/30 py-5">
          <div className="container mx-auto flex flex-wrap items-center justify-center gap-3 px-4 text-center text-xs text-muted-foreground md:text-sm">
            <Euro className="h-4 w-4 shrink-0" style={{ color: accent }} />
            <span>
              <strong className="text-foreground">Finanzierung auf Anfrage.</strong>{" "}
              {config.finance_apr ? `Verwendete Zinsannahme: ${config.finance_apr}% effektiver Jahreszins. ` : ""}
              {config.finance_disclaimer || "Verfügbarkeit und vollständige Bedingungen bestätigt der Händler."}
            </span>
          </div>
        </section>
      )}

      {/* ─── Finance CTA ─── */}
      {config.show_finance_cta === true && (
        <section className="border-t border-border">
          <div className="container mx-auto px-4 py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-2xl p-8 md:p-12 text-center"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)` }}
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoNnptMC0zMHY2aC02VjRoNnptMCAxMnY2aC02di02aDZ6bTAgMTJ2Nmg2djZoLTZ2LTZoLTZ2LTZoNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
              <div className="relative">
                <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
                  {config.finance_cta_text || "Finanzierung anfragen"}
                </h2>
                <p className="mt-3 text-white/80 max-w-lg mx-auto">
                  Fragen Sie nach Verfügbarkeit und vollständigen Bedingungen für das konkrete Fahrzeug. Eine Anfrage ist keine Kreditzusage.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button
                    size="lg"
                    onClick={() => setEnquiryOpen(true)}
                    className="bg-white hover:bg-white/90 font-semibold shadow-lg"
                    style={{ color: accent }}
                  >
                    Finanzierung anfragen <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ─── FAQ ─── */}
      <section className="border-t border-border py-14 md:py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[1fr,1.5fr]">
          <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <Badge variant="outline" className="mb-3 text-xs"><HelpCircle className="mr-1 h-3 w-3" /> FAQ</Badge>
            <h2 className={`${fontClass} text-2xl font-bold text-foreground md:text-3xl`}>Frequently asked questions</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Everything you need to know about buying from {dealer.business_name}. Can't find what you're looking for? Get in touch — we're happy to help.
            </p>
            <Button onClick={() => setEnquiryOpen(true)} className="mt-5 border-0 text-white" style={{ backgroundColor: accent }}>
              <MessageCircle className="mr-1 h-4 w-4" /> Ask us a question
            </Button>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <Accordion type="single" collapsible className="w-full">
              {(config.faqs && config.faqs.length > 0
                ? config.faqs
                : [
                    { q: "Bieten Sie Finanzierung an?", a: "Senden Sie eine Finanzierungsanfrage. Der Händler teilt Ihnen Anbieter, Konditionen und seine Vermittlerrolle vor Abschluss transparent mit." },
                    { q: "Nehmen Sie mein Fahrzeug in Zahlung?", a: "Eine Inzahlungnahme kann unverbindlich angefragt werden. Bewertung und Annahme erfolgen erst nach Prüfung durch den Händler." },
                    { q: "Welche Fahrzeugprüfungen liegen vor?", a: "Verlassen Sie sich ausschließlich auf die Nachweise und Prüfkennzeichen im jeweiligen Inserat. Nicht jedes Fahrzeug besitzt einen externen Bericht." },
                    { q: "Ist eine Lieferung möglich?", a: "Liefergebiet, Kosten und Übergabebedingungen vereinbaren Sie direkt mit dem Händler." },
                    { q: "Welche Garantie gilt?", a: "Maßgeblich sind die Angaben im Inserat und im Kaufvertrag sowie die gesetzlichen Gewährleistungsrechte. Zusätzliche Garantien müssen ausdrücklich dokumentiert sein." },
                    { q: "Kann ich online reservieren?", a: "Verfügbare Händlerfahrzeuge können über den ausgewiesenen Reservierungsprozess angefragt werden. Betrag, Frist und Erstattungsbedingungen werden vor Zahlung angezeigt." },
                  ]
              ).map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className={`${fontClass} text-left text-base font-semibold`}>{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      {config.show_testimonials !== false && config.testimonials && config.testimonials.length > 0 && (
        <section className="border-t border-border bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <Badge variant="outline" className="mb-3 text-xs">Reviews</Badge>
              <h2 className={`${fontClass} text-2xl font-bold text-foreground md:text-3xl`}>What Our Customers Say</h2>
            </motion.div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {config.testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="relative rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
                >
                  <Quote className="absolute top-4 right-4 h-8 w-8 text-muted-foreground/10" />
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`h-4 w-4 ${j < t.rating ? "fill-warning text-warning" : "text-border"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.text}"</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: accent }}
                    >
                      {t.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <p className="text-sm font-semibold text-card-foreground">{t.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Newsletter & Opening Hours ─── */}
      {config.newsletter_enabled !== false && (
        <section className="border-t border-border py-14">
          <div className="container mx-auto grid gap-6 px-4 md:grid-cols-2">
            {/* Newsletter card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-card"
            >
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-10" style={{ backgroundColor: accent }} />
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${accent}15` }}>
                  <Send className="h-5 w-5" style={{ color: accent }} />
                </div>
                <h3 className={`${fontClass} mt-4 text-xl font-bold text-foreground`}>Zivvo-Neuigkeiten</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Erhalten Sie Marktplatz- und Produktneuigkeiten von Zivvo. Jederzeit abbestellbar.
                </p>
                <form onSubmit={handleNewsletterSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="email"
                    placeholder="sie@beispiel.de"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1"
                    aria-label="E-Mail-Adresse"
                    required
                  />
                  <Button type="submit" className="border-0 text-white" style={{ backgroundColor: accent }}>
                    {newsletterSent ? <><Check className="mr-1 h-4 w-4" /> Angemeldet</> : <>Anmelden <ArrowRight className="ml-1 h-4 w-4" /></>}
                  </Button>
                </form>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Mit der Anmeldung stimmen Sie der in der Datenschutzerklärung beschriebenen Verarbeitung zu. Abmeldung jederzeit möglich.
                </p>
              </div>
            </motion.div>

            {/* Opening hours card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl border border-border bg-card p-7 shadow-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${accent}15` }}>
                    <Clock className="h-5 w-5" style={{ color: accent }} />
                  </div>
                  <h3 className={`${fontClass} text-xl font-bold text-foreground`}>Öffnungszeiten</h3>
                </div>
                <OpenNowBadge hours={config.opening_hours_table} accent={accent} />
              </div>
              <ul className="mt-5 divide-y divide-border text-sm">
                {(config.opening_hours_table && config.opening_hours_table.length > 0
                  ? config.opening_hours_table
                  : [
                      { day: "Öffnungszeiten", hours: "Nicht angegeben" },
                    ]
                ).map((row) => (
                  <li key={row.day} className="flex items-center justify-between py-2.5">
                    <span className="font-medium text-foreground">{row.day}</span>
                    <span className="text-muted-foreground">{row.hours}</span>
                  </li>
                ))}
              </ul>
              {showAddress && dealer.city && (
                <div className="mt-5 flex items-start gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: accent }} />
                  <span>Standort: <strong className="text-foreground">{dealer.city}{dealer.country ? `, ${dealer.country}` : ""}</strong>. Bitte bestätigen Sie Öffnungszeiten und Termin vor der Anreise.</span>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* ─── CTA Footer ─── */}
      <section className="border-t border-border relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent}08, ${accent}15)` }}>
        <div className="container mx-auto px-4 py-14 text-center relative">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className={`${fontClass} text-2xl font-bold text-foreground md:text-3xl`}>
              Bereit für die Fahrzeugsuche?
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">Kontaktieren Sie den Händler oder durchsuchen Sie den aktuellen Bestand.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {showPhone && dealer.business_phone && (
                <a href={`tel:${dealer.business_phone}`}>
                  <Button size="lg" className="border-0 text-white shadow-lg" style={{ backgroundColor: accent }}>
                    <Phone className="mr-1 h-4 w-4" /> {dealer.business_phone}
                  </Button>
                </a>
              )}
              {config.whatsapp_number && (
                <a href={`https://wa.me/${config.whatsapp_number.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-[#25D366] hover:bg-[#20BD5A] text-white border-0">
                    <MessageCircle className="mr-1 h-4 w-4" /> WhatsApp
                  </Button>
                </a>
              )}
              {showEmail && dealer.business_email && (
                <a href={`mailto:${dealer.business_email}`}>
                  <Button size="lg" variant="outline"><Mail className="mr-1 h-4 w-4" /> E-Mail senden</Button>
                </a>
              )}
            </div>

            {/* Business credentials row */}
      {(config.established_year || config.company_number || config.vat_number) && (
              <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 border-t border-border/50 pt-6 md:grid-cols-4">
                {config.established_year && (
                  <BusinessFact label="Gegründet" value={String(config.established_year)} accent={accent} />
                )}
                {config.company_number && (
                  <BusinessFact label="Registernummer" value={config.company_number} accent={accent} />
                )}
                {config.vat_number && (
                  <BusinessFact label="USt-IdNr." value={config.vat_number} accent={accent} />
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ─── WhatsApp FAB (desktop only — sticky bar handles mobile) ─── */}
      {config.whatsapp_number && (
        <a
          href={`https://wa.me/${config.whatsapp_number.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-all hover:scale-110 hover:bg-[#20BD5A] md:flex"
        >
          <MessageCircle className="h-6 w-6" />
        </a>
      )}

      {/* ─── Sticky mobile contact bar ─── */}
      <DealerStickyBar
        phone={showPhone ? dealer.business_phone : null}
        email={showEmail ? dealer.business_email : null}
        whatsapp={config.whatsapp_number}
        accent={accent}
        onEnquireClick={() => setEnquiryOpen(true)}
      />

      {/* ─── Enquiry dialog ─── */}
      <DealerEnquiryDialog
        open={enquiryOpen}
        onOpenChange={setEnquiryOpen}
        dealerId={dealer.id}
        dealerName={dealer.business_name}
        accent={accent}
      />

      <Footer />
      {/* Spacer for mobile sticky bar */}
      <div className="h-14 md:hidden" aria-hidden="true" />

      <Dialog open={!!financeCar} onOpenChange={(o) => !o && setFinanceCar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Finanzierungsrechner</DialogTitle></DialogHeader>
          {financeCar && (
            <FinanceCalculator
              price={Number(financeCar.price) || 0}
              defaultApr={Number(config.finance_apr) || 9.9}
              onApply={() => {
                window.location.href = `/car/${financeCar.id}#finance`;
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ─── Sub-components ─── */

const HeroBadges = ({ dealer, config, accent, isOnDark }: { dealer: any; config: LandingConfig; accent: string; isOnDark?: boolean }) => (
  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
    {dealer.kyc_verified && (
      <Badge className="border-0" style={{ backgroundColor: `${accent}20`, color: accent }}>
        <BadgeCheck className="mr-1 h-3 w-3" /> Händler freigegeben
      </Badge>
    )}
    <Badge variant="secondary" className={isOnDark ? "bg-white/10 text-white/80 border-0" : ""}>
      Zivvo Händler
    </Badge>
    {config.specialities?.[0] && (
      <Badge variant="outline" className={isOnDark ? "border-white/20 text-white/70" : ""}>
        {config.specialities[0]}
      </Badge>
    )}
  </div>
);

const ContactBar = ({ dealer, config, showPhone, showEmail, showAddress, isOnDark }: any) => (
  <div className={`mt-8 flex flex-wrap items-center justify-center gap-4 text-sm ${isOnDark ? "text-white/50" : "text-muted-foreground"}`}>
    {showAddress && dealer.city && (
      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {dealer.city}</span>
    )}
    {showPhone && dealer.business_phone && (
      <a href={`tel:${dealer.business_phone}`} className="flex items-center gap-1 hover:text-white transition-colors">
        <Phone className="h-4 w-4" /> {dealer.business_phone}
      </a>
    )}
    {showEmail && dealer.business_email && (
      <a href={`mailto:${dealer.business_email}`} className="flex items-center gap-1 hover:text-white transition-colors">
        <Mail className="h-4 w-4" /> {dealer.business_email}
      </a>
    )}
    {safeHttpsUrl(dealer.website_url) && (
      <a href={safeHttpsUrl(dealer.website_url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
        <Globe className="h-4 w-4" /> Website
      </a>
    )}
  </div>
);

const QuickStatTile = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}12` }}>
      <Icon className="h-4 w-4" style={{ color: accent }} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  </div>
);

const BusinessFact = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
  <div className="rounded-xl border border-border bg-card/50 p-3 text-left">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
    <p className="mt-0.5 truncate text-sm font-bold" style={{ color: accent }}>{value}</p>
  </div>
);

const OpenNowBadge = ({ hours, accent }: { hours?: Array<{ day: string; hours: string }>; accent: string }) => {
  if (!hours?.length) return <Badge variant="outline">Zeiten nicht angegeben</Badge>;
  const now = new Date();
  const dayPrefixes = [
    ["son", "sun"], ["mon"], ["die", "tue"], ["mit", "wed"],
    ["don", "thu"], ["fre", "fri"], ["sam", "sat"],
  ][now.getDay()];
  const todayRow = hours.find((h) => dayPrefixes.some((prefix) => h.day.toLowerCase().startsWith(prefix)));
  const todayHours = todayRow?.hours || "";
  if (!todayRow) return <Badge variant="outline">Heute nicht angegeben</Badge>;
  const isClosed = /geschlossen|closed/i.test(todayHours);
  let isOpen = false;
  const match = todayHours.match(/(\d{1,2}):?(\d{0,2})\s*[–\-to]+\s*(\d{1,2}):?(\d{0,2})/);
  if (match) {
    const start = parseInt(match[1], 10) * 60 + parseInt(match[2] || "0", 10);
    const end = parseInt(match[3], 10) * 60 + parseInt(match[4] || "0", 10);
    const cur = now.getHours() * 60 + now.getMinutes();
    isOpen = cur >= start && cur <= end;
  }
  if (!match && !isClosed) return <Badge variant="outline">Heute: {todayHours}</Badge>;
  return (
    <Badge
      variant="outline"
      className="gap-1.5 text-[11px] font-semibold"
      style={isOpen ? { borderColor: `${accent}40`, color: accent, backgroundColor: `${accent}10` } : undefined}
    >
      <span className={`h-2 w-2 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
      {isOpen ? "Jetzt geöffnet" : "Geschlossen"}
    </Badge>
  );
};

const CountUp = ({ end, duration = 1200, decimals = 0, suffix = "" }: { end: number; duration?: number; decimals?: number; suffix?: string }) => {
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);
  const id = `countup-${String(end).replace(".", "_")}-${suffix.replace(/\W/g, "")}`;

  useEffect(() => {
    if (started) return;
    const el = document.getElementById(id);
    if (!el) { setStarted(true); return; }
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setStarted(true); }),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [id, started]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(end * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, end, duration]);

  return <span id={id}>{val.toFixed(decimals)}{suffix}</span>;
};

export default DealerLanding;
