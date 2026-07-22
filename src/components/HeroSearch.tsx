import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, SlidersHorizontal, MapPin, Car as CarIcon, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCountry } from "@/contexts/CountryContext";
import RecentSearchesChips from "@/components/RecentSearchesChips";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { formatPrice } from "@/lib/countryConfig";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-cars.jpg";

const PRICE_STEPS = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000, 50000, 75000, 100000];
const MONTHLY_STEPS = [100, 150, 200, 250, 300, 400, 500, 600, 750, 1000, 1500];
const DISTANCE_STEPS = [5, 10, 25, 50, 75, 100, 150, 200, 300, 500];

// Carlingo-style approximation: ~£245/mo per £10k full-price → priceMax = monthlyMax / 0.0245
const monthlyToPrice = (m: number) => Math.round(m / 0.0245);

const HeroSearch = () => {
  const navigate = useNavigate();
  const { config, country } = useCountry();
  const { t } = useTranslation();
  const { add: addRecentSearch } = useRecentSearches();

  const [budgetMode, setBudgetMode] = useState<"price" | "monthly">("price");
  const [vehicleType, setVehicleType] = useState<"cars" | "vans" | "electric">("cars");
  const [postcode, setPostcode] = useState("");
  const [distance, setDistance] = useState<string>("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [monthlyMax, setMonthlyMax] = useState<string>("");
  const [sellerType, setSellerType] = useState<string>("");

  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);

  // Load models when make changes
  useEffect(() => {
    if (!make) { setModels([]); setModel(""); return; }
    setModelsLoading(true);
    supabase
      .from("car_listings")
      .select("model")
      .eq("status", "active")
      .eq("make", make)
      .limit(500)
      .then(({ data }) => {
        const unique = Array.from(new Set((data || []).map((r: any) => r.model).filter(Boolean))).sort();
        setModels(unique);
        setModelsLoading(false);
      });
  }, [make]);

  // Live count — debounced
  useEffect(() => {
    const t = setTimeout(async () => {
      setCounting(true);
      let q = supabase.from("car_listings").select("id", { count: "exact", head: true }).eq("status", "active").eq("country", country);
      if (make) q = q.eq("make", make);
      if (model) q = q.eq("model", model);
      if (vehicleType === "vans") q = q.in("body_type", ["Van", "Pickup"]);
      else if (vehicleType === "electric") q = q.eq("fuel_type", "Electric");
      const effectiveMin = priceMin ? Number(priceMin) : undefined;
      const effectiveMax = budgetMode === "monthly" && monthlyMax
        ? monthlyToPrice(Number(monthlyMax))
        : priceMax ? Number(priceMax) : undefined;
      if (effectiveMin) q = q.gte("price", effectiveMin);
      if (effectiveMax) q = q.lte("price", effectiveMax);
      if (sellerType === "Dealer") q = q.not("dealer_id", "is", null);
      else if (sellerType === "Private") q = q.is("dealer_id", null);
      const { count } = await q;
      setResultCount(count ?? 0);
      setCounting(false);
    }, 350);
    return () => clearTimeout(t);
  }, [make, model, priceMin, priceMax, monthlyMax, budgetMode, vehicleType, sellerType, country]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (vehicleType === "vans") params.set("body", "Van");
    if (vehicleType === "electric") params.set("fuel", "Electric");
    if (priceMin) params.set("priceMin", priceMin);
    if (budgetMode === "monthly" && monthlyMax) {
      params.set("priceMax", String(monthlyToPrice(Number(monthlyMax))));
      params.set("monthlyMax", monthlyMax);
    } else if (priceMax) {
      params.set("priceMax", priceMax);
    }
    if (postcode) params.set("postcode", postcode.trim());
    if (distance) params.set("distance", distance);
    if (sellerType) params.set("seller", sellerType);

    const labelParts: string[] = [];
    if (make) labelParts.push(make);
    if (model) labelParts.push(model);
    if (vehicleType !== "cars") labelParts.push(vehicleType);
    const label = labelParts.join(" · ") || "All cars";
    addRecentSearch(label, params.toString());

    navigate(`/browse?${params.toString()}`);
  };

  const countLabel = useMemo(() => {
    if (counting && resultCount === null) return t("hero.search.searchDefault");
    if (resultCount === null) return t("hero.search.searchDefault");
    const type = vehicleType === "vans" ? t("hero.search.vans") : t("hero.search.cars");
    return t("hero.search.searchCta", { count: resultCount.toLocaleString(config.currency.locale), type });
  }, [counting, resultCount, vehicleType, t, config.currency.locale]);

  return (
    <section className="relative min-h-[640px] overflow-hidden md:min-h-[720px]">
      {/* Layered background */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Floating accent shapes */}
      <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -left-10 bottom-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />

      <div className="container relative mx-auto px-4 pb-24 pt-20 md:pb-32 md:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Copy */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              {t("hero.badge")}
            </div>

            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
              {t("hero.title1")}<br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                {t("hero.title2")}
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-primary-foreground/65 md:text-lg">
              {t("hero.subtitle")}
            </p>

            <div className="mt-8 flex gap-8">
              {[
                { value: "25K+", label: t("hero.stats.listings") },
                { value: "3.2K+", label: t("hero.stats.dealers") },
                { value: "98%", label: t("hero.stats.satisfaction") },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                  <p className="font-display text-2xl font-bold text-primary-foreground md:text-3xl">{stat.value}</p>
                  <p className="text-xs text-primary-foreground/50">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Search card */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
            <form onSubmit={handleSearch}>
              <div className="rounded-2xl border border-border/50 bg-card/95 p-5 shadow-elevated backdrop-blur-xl md:p-6">
                {/* Vehicle type tabs */}
                <div className="mb-4 inline-flex rounded-full bg-muted p-1">
                  {[
                    { id: "cars" as const, icon: CarIcon, label: t("hero.search.cars") },
                    { id: "vans" as const, icon: Truck, label: t("hero.search.vans") },
                    { id: "electric" as const, icon: Zap, label: t("hero.search.electric") },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setVehicleType(tab.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        vehicleType === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <h2 className="font-display text-lg font-semibold text-card-foreground">{t("hero.search.title")}</h2>
                <p className="mb-4 text-xs text-muted-foreground">{t("hero.search.subtitle")}</p>

                <div className="space-y-3">
                  {/* Postcode + Distance */}
                  <div className="grid grid-cols-5 gap-3">
                    <div className="relative col-span-3">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                        placeholder={t("hero.search.postcode")}
                        className="h-11 pl-9"
                        maxLength={10}
                      />
                    </div>
                    <Select value={distance} onValueChange={setDistance}>
                      <SelectTrigger className="col-span-2 h-11"><SelectValue placeholder={t("hero.search.distance")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{t("hero.search.anyDistance")}</SelectItem>
                        {DISTANCE_STEPS.map((d) => (
                          <SelectItem key={d} value={String(d)}>{t("hero.search.within")} {d} km</SelectItem>
                        ))}
                        <SelectItem value="nationwide">{t("hero.search.nationwide")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Make + Model */}
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={make} onValueChange={(v) => { setMake(v); setModel(""); }}>
                      <SelectTrigger className="h-11"><SelectValue placeholder={t("hero.search.anyMake")} /></SelectTrigger>
                      <SelectContent>
                        {config.makes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={model} onValueChange={setModel} disabled={!make || modelsLoading}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={!make ? t("hero.search.selectMakeFirst") : modelsLoading ? t("common.loading") : models.length ? t("hero.search.anyModel") : t("hero.search.noModels")} />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Seller type */}
                  <Select value={sellerType || undefined} onValueChange={(v) => setSellerType(v === "any" ? "" : v)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder={t("hero.search.anySeller")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t("hero.search.anySeller")}</SelectItem>
                      <SelectItem value="Private">{t("hero.search.privateSeller")}</SelectItem>
                      <SelectItem value="Dealer">{t("hero.search.dealer")}</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-1">
                    <button
                      type="button"
                      onClick={() => setBudgetMode("price")}
                      className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                        budgetMode === "price" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      {t("hero.search.fullPrice")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBudgetMode("monthly")}
                      className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                        budgetMode === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      {t("hero.search.monthlyCost")}
                    </button>
                  </div>

                  {/* Price range */}
                  {budgetMode === "price" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={priceMin} onValueChange={setPriceMin}>
                        <SelectTrigger className="h-11"><SelectValue placeholder={t("hero.search.minPrice")} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">{t("hero.search.noMin")}</SelectItem>
                          {PRICE_STEPS.map((p) => <SelectItem key={p} value={String(p)}>{formatPrice(p, config)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={priceMax} onValueChange={setPriceMax}>
                        <SelectTrigger className="h-11"><SelectValue placeholder={t("hero.search.maxPrice")} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">{t("hero.search.noMax")}</SelectItem>
                          {PRICE_STEPS.map((p) => <SelectItem key={p} value={String(p)}>{formatPrice(p, config)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <Select value={monthlyMax} onValueChange={setMonthlyMax}>
                      <SelectTrigger className="h-11"><SelectValue placeholder={t("hero.search.maxMonthly")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{t("hero.search.noMax")}</SelectItem>
                        {MONTHLY_STEPS.map((m) => (
                          <SelectItem key={m} value={String(m)}>{t("hero.search.upTo")} {formatPrice(m, config)}{t("hero.search.perMonth")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button type="submit" size="lg" className="gradient-primary h-12 w-full border-0 text-sm font-semibold">
                    <Search className="mr-2 h-4 w-4" />
                    {countLabel}
                  </Button>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <Button variant="ghost" size="sm" type="button" className="text-xs text-muted-foreground" onClick={() => navigate("/browse")}>
                    <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
                    {t("hero.search.advancedFilters")}
                  </Button>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: t("hero.search.underPrice", { price: "5.000 €" }), path: "/browse?priceMax=5000" },
                      { label: t("hero.search.lowMileage"), path: "/browse?mileageMax=30000" },
                      { label: t("hero.search.suvs"), path: "/browse?body=SUV" },
                    ].map((tag) => (
                      <button
                        key={tag.label}
                        type="button"
                        onClick={() => navigate(tag.path)}
                        className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            <div className="mt-4">
              <RecentSearchesChips variant="dark" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSearch;
