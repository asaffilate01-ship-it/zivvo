import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import RecentlyViewedCarousel from "@/components/RecentlyViewedCarousel";
import SEOHead from "@/components/SEOHead";
import { CarGridSkeleton } from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Search, SlidersHorizontal, ChevronLeft, ChevronRight, X, GitCompare,
  LayoutGrid, List, MapPin, ChevronDown, ShieldCheck, Sparkles,
} from "lucide-react";
import { lazy, Suspense } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SaveSearchDialog from "@/components/SaveSearchDialog";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice, formatDistance } from "@/lib/countryConfig";

const BrowseMapView = lazy(() => import("@/components/BrowseMapView"));

const PAGE_SIZE = 12;
const currentYear = new Date().getFullYear();
const colors = ["Black", "White", "Silver", "Grey", "Blue", "Red", "Green", "Brown", "Beige", "Yellow", "Orange"];
const doorOptions = ["2", "3", "4", "5"];
const engineSizes = ["1.0L", "1.2L", "1.4L", "1.5L", "1.6L", "1.8L", "2.0L", "2.5L", "3.0L", "3.5L", "4.0L", "5.0L+"];
const sellerTypes = ["Any", "Private", "Dealer"];

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { country, config } = useCountry();

  const makes = config.makes;
  const bodyTypes = config.bodyTypes;
  const fuelTypes = config.fuelTypes;
  const transmissions = config.transmissions;
  const cities = config.popularCities;

  // Dynamic models from DB
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Core filters
  const [keyword, setKeyword] = useState(searchParams.get("q") || "");
  const [selectedMake, setSelectedMake] = useState(searchParams.get("make") || "");
  const [model, setModel] = useState(searchParams.get("model") || "");
  const [selectedBody, setSelectedBody] = useState(searchParams.get("body") || "");
  const [selectedFuel, setSelectedFuel] = useState(searchParams.get("fuel") || "");
  const [selectedTransmission, setSelectedTransmission] = useState(searchParams.get("transmission") || "");
  const [selectedColor, setSelectedColor] = useState(searchParams.get("color") || "");
  const [selectedDoors, setSelectedDoors] = useState(searchParams.get("doors") || "");
  const [selectedEngine, setSelectedEngine] = useState(searchParams.get("engine") || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("location") || "");
  const [sellerType, setSellerType] = useState(searchParams.get("seller") || "");
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verified") === "true");
  const [featuredOnly, setFeaturedOnly] = useState(searchParams.get("featured") === "true");
  const [postcode, setPostcode] = useState(searchParams.get("postcode") || "");
  const [distance, setDistance] = useState(searchParams.get("distance") || "");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // Range filters
  const [priceRange, setPriceRange] = useState([
    parseInt(searchParams.get("priceMin") || "0"),
    parseInt(searchParams.get("priceMax") || "200000"),
  ]);
  const [yearRange, setYearRange] = useState([
    parseInt(searchParams.get("yearMin") || "2000"),
    parseInt(searchParams.get("yearMax") || String(currentYear)),
  ]);
  const [mileageMax, setMileageMax] = useState(parseInt(searchParams.get("mileageMax") || "200000"));

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "0"));

  // Collapsible sections
  // Fetch models when make changes
  useEffect(() => {
    if (!selectedMake) {
      setAvailableModels([]);
      return;
    }
    setModelsLoading(true);
    supabase.rpc("get_models_for_make", { _make: selectedMake, _country: country })
      .then(({ data }) => {
        setAvailableModels(data?.map((r: any) => r.model) || []);
        setModelsLoading(false);
      });
  }, [selectedMake, country]);

  const [openSections, setOpenSections] = useState({
    vehicle: true,
    price: true,
    details: false,
    location: false,
    options: false,
  });

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (selectedMake) params.set("make", selectedMake);
    if (model) params.set("model", model);
    if (selectedBody) params.set("body", selectedBody);
    if (selectedFuel) params.set("fuel", selectedFuel);
    if (selectedTransmission) params.set("transmission", selectedTransmission);
    if (selectedColor) params.set("color", selectedColor);
    if (selectedDoors) params.set("doors", selectedDoors);
    if (selectedEngine) params.set("engine", selectedEngine);
    if (selectedCity) params.set("location", selectedCity);
    if (sellerType) params.set("seller", sellerType);
    if (verifiedOnly) params.set("verified", "true");
    if (featuredOnly) params.set("featured", "true");
    if (priceRange[0] > 0) params.set("priceMin", String(priceRange[0]));
    if (priceRange[1] < 200000) params.set("priceMax", String(priceRange[1]));
    if (yearRange[0] > 2000) params.set("yearMin", String(yearRange[0]));
    if (yearRange[1] < currentYear) params.set("yearMax", String(yearRange[1]));
    if (mileageMax < 200000) params.set("mileageMax", String(mileageMax));
    if (sortBy !== "newest") params.set("sort", sortBy);
    if (page > 0) params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [keyword, selectedMake, model, selectedBody, selectedFuel, selectedTransmission, selectedColor, selectedDoors, selectedEngine, selectedCity, sellerType, verifiedOnly, featuredOnly, priceRange, yearRange, mileageMax, sortBy, page, setSearchParams]);

  useEffect(() => { updateURL(); }, [updateURL]);

  useEffect(() => {
    setPage(0);
  }, [keyword, selectedMake, model, selectedBody, selectedFuel, selectedTransmission, selectedColor, selectedDoors, selectedEngine, selectedCity, sellerType, verifiedOnly, featuredOnly, priceRange, yearRange, mileageMax, sortBy, country]);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      let query = supabase
        .from("car_listings_public")
        .select("*", { count: "exact" })
        .eq("status", "active")
        .eq("country", country)
        .gte("price", priceRange[0])
        .lte("price", priceRange[1])
        .gte("year", yearRange[0])
        .lte("year", yearRange[1]);

      if (mileageMax < 200000) query = query.lte("mileage", mileageMax);
      if (keyword) {
        const tsQuery = keyword.trim().split(/\s+/).join(" & ");
        query = query.textSearch("search_vector", tsQuery, { config: "english" });
      }
      if (selectedMake) query = query.eq("make", selectedMake);
      if (model) query = query.ilike("model", `%${model}%`);
      if (selectedBody) query = query.eq("body_type", selectedBody);
      if (selectedFuel) query = query.eq("fuel_type", selectedFuel);
      if (selectedTransmission) query = query.eq("transmission", selectedTransmission);
      if (selectedColor) query = query.ilike("color", `%${selectedColor}%`);
      if (selectedDoors) query = query.eq("doors", parseInt(selectedDoors));
      if (selectedEngine) query = query.eq("engine_size", selectedEngine);
      if (selectedCity) query = query.ilike("location", `%${selectedCity}%`);
      if (sellerType === "Dealer") query = query.not("dealer_id", "is", null);
      if (sellerType === "Private") query = query.is("dealer_id", null);
      if (verifiedOnly) query = query.eq("verified", true);
      if (featuredOnly) query = query.eq("is_featured", true);

      const orderCol = sortBy === "price_asc" ? "price" : sortBy === "price_desc" ? "price" : sortBy === "mileage_asc" ? "mileage" : sortBy === "year_desc" ? "year" : "created_at";
      const ascending = sortBy === "price_asc" || sortBy === "mileage_asc";
      query = query.order("is_promoted", { ascending: false, nullsFirst: false }).order(orderCol, { ascending }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      const { data, count, error } = await query;
      if (!error && data) { setListings(data); setTotalCount(count || 0); }
      setLoading(false);
    };
    fetchListings();
  }, [keyword, selectedMake, model, selectedBody, selectedFuel, selectedTransmission, selectedColor, selectedDoors, selectedEngine, selectedCity, sellerType, verifiedOnly, featuredOnly, priceRange, yearRange, mileageMax, sortBy, page, country]);

  const clearFilters = () => {
    setKeyword(""); setSelectedMake(""); setModel(""); setSelectedBody(""); setSelectedFuel("");
    setSelectedTransmission(""); setSelectedColor(""); setSelectedDoors(""); setSelectedEngine("");
    setSelectedCity(""); setSellerType(""); setVerifiedOnly(false); setFeaturedOnly(false);
    setPriceRange([0, 200000]); setYearRange([2000, currentYear]); setMileageMax(200000);
  };

  const activeFiltersList: { label: string; clear: () => void }[] = [];
  if (selectedMake) activeFiltersList.push({ label: selectedMake, clear: () => setSelectedMake("") });
  if (model) activeFiltersList.push({ label: `Model: ${model}`, clear: () => setModel("") });
  if (selectedBody) activeFiltersList.push({ label: selectedBody, clear: () => setSelectedBody("") });
  if (selectedFuel) activeFiltersList.push({ label: selectedFuel, clear: () => setSelectedFuel("") });
  if (selectedTransmission) activeFiltersList.push({ label: selectedTransmission, clear: () => setSelectedTransmission("") });
  if (selectedColor) activeFiltersList.push({ label: selectedColor, clear: () => setSelectedColor("") });
  if (selectedDoors) activeFiltersList.push({ label: `${selectedDoors} doors`, clear: () => setSelectedDoors("") });
  if (selectedEngine) activeFiltersList.push({ label: selectedEngine, clear: () => setSelectedEngine("") });
  if (selectedCity) activeFiltersList.push({ label: selectedCity, clear: () => setSelectedCity("") });
  if (sellerType) activeFiltersList.push({ label: sellerType, clear: () => setSellerType("") });
  if (verifiedOnly) activeFiltersList.push({ label: "Verified", clear: () => setVerifiedOnly(false) });
  if (featuredOnly) activeFiltersList.push({ label: "Featured", clear: () => setFeaturedOnly(false) });
  if (priceRange[0] > 0 || priceRange[1] < 200000) activeFiltersList.push({ label: `${formatPrice(priceRange[0], config)}-${formatPrice(priceRange[1], config)}`, clear: () => setPriceRange([0, 200000]) });
  if (yearRange[0] > 2000 || yearRange[1] < currentYear) activeFiltersList.push({ label: `${yearRange[0]}-${yearRange[1]}`, clear: () => setYearRange([2000, currentYear]) });
  if (mileageMax < 200000) activeFiltersList.push({ label: `≤${formatDistance(mileageMax, config)}`, clear: () => setMileageMax(200000) });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const FilterSelect = ({ label, value, onChange, placeholder, options }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; options: string[] }) => (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value || undefined} onValueChange={(v) => onChange(v === "__clear__" ? "" : v)}>
        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__clear__">{placeholder}</SelectItem>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  const FilterSection = ({ title, sectionKey, children }: { title: string; sectionKey: keyof typeof openSections; children: React.ReactNode }) => (
    <Collapsible open={openSections[sectionKey]} onOpenChange={() => toggleSection(sectionKey)}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-semibold text-card-foreground hover:text-primary transition-colors">
        {title}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSections[sectionKey] ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pb-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );

  // Price quick-select presets
  const pricePresets = [
    { label: "Under " + config.currency.symbol + "5k", min: 0, max: 5000 },
    { label: config.currency.symbol + "5k–15k", min: 5000, max: 15000 },
    { label: config.currency.symbol + "15k–30k", min: 15000, max: 30000 },
    { label: config.currency.symbol + "30k–50k", min: 30000, max: 50000 },
    { label: config.currency.symbol + "50k+", min: 50000, max: 200000 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Browse Cars for Sale"
        description={`Browse ${totalCount > 0 ? totalCount.toLocaleString() : ""} verified vehicles. Filter by make, model, price, year, and more.`}
      />
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Browse Cars</h1>
            <p className="text-sm text-muted-foreground">{totalCount.toLocaleString()} vehicles found</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/compare">
              <Button variant="outline" size="sm"><GitCompare className="mr-1 h-4 w-4" /> Compare</Button>
            </Link>

            {/* View toggle */}
            <div className="hidden items-center rounded-lg border border-border bg-secondary p-0.5 sm:flex">
              {(["grid", "list", "map"] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "ghost"}
                  size="icon"
                  className={`h-7 w-7 ${viewMode === mode ? "gradient-primary border-0" : ""}`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode === "grid" ? <LayoutGrid className="h-3.5 w-3.5" /> : mode === "list" ? <List className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                </Button>
              ))}
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_asc">Price: Low–High</SelectItem>
                <SelectItem value="price_desc">Price: High–Low</SelectItem>
                <SelectItem value="mileage_asc">Mileage: Low–High</SelectItem>
                <SelectItem value="year_desc">Year: Newest</SelectItem>
              </SelectContent>
            </Select>

            <SaveSearchDialog
              filters={{
                q: keyword, make: selectedMake, model, body: selectedBody, fuel: selectedFuel,
                transmission: selectedTransmission, color: selectedColor, doors: selectedDoors,
                engine: selectedEngine, location: selectedCity, seller: sellerType,
                verified: verifiedOnly, featured: featuredOnly,
                priceMin: priceRange[0], priceMax: priceRange[1],
                yearMin: yearRange[0], yearMax: yearRange[1], mileageMax,
              }}
            />

            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
              <SlidersHorizontal className="mr-1 h-4 w-4" />
              Filters {activeFiltersList.length > 0 && `(${activeFiltersList.length})`}
            </Button>
          </div>
        </div>

        {/* Active filter tags */}
        {activeFiltersList.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFiltersList.map((f, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {f.label}
                <button onClick={f.clear} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-primary">Clear all</Button>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className={`lg:col-span-1 ${showFilters ? "block" : "hidden lg:block"}`}>
            {showFilters && <div className="fixed inset-0 z-40 bg-foreground/50 lg:hidden" onClick={() => setShowFilters(false)} />}
            <div className={`${showFilters ? "fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl lg:static lg:max-h-none lg:rounded-none" : ""} sticky top-20 space-y-1 rounded-xl border border-border bg-card p-4`}>
              <div className="flex items-center justify-between pb-2">
                <h3 className="font-display text-sm font-semibold text-card-foreground">Filters</h3>
                <div className="flex items-center gap-2">
                  {activeFiltersList.length > 0 && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-primary">Clear all</Button>}
                  <Button variant="ghost" size="icon" className="h-7 w-7 lg:hidden" onClick={() => setShowFilters(false)}><X className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Search */}
              <div className="pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search make, model, keyword..." value={keyword} onChange={(e) => setKeyword(e.target.value)} className="h-9 pl-10 text-sm" />
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Vehicle Section */}
              <FilterSection title="Vehicle" sectionKey="vehicle">
                <FilterSelect label="Make" value={selectedMake} onChange={(v) => { setSelectedMake(v); setModel(""); }} placeholder="Any Make" options={makes} />
                {availableModels.length > 0 ? (
                  <FilterSelect
                    label="Model"
                    value={model}
                    onChange={setModel}
                    placeholder={modelsLoading ? "Loading models..." : "Any Model"}
                    options={availableModels}
                  />
                ) : (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Model</label>
                    <Input
                      placeholder={selectedMake ? (modelsLoading ? "Loading..." : `Search ${selectedMake} models...`) : "Select a make first"}
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="h-9 text-sm"
                      disabled={!selectedMake}
                    />
                  </div>
                )}
                <FilterSelect label="Body Type" value={selectedBody} onChange={setSelectedBody} placeholder="Any Type" options={bodyTypes} />
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Year: {yearRange[0]} — {yearRange[1]}</label>
                  <Slider min={2000} max={currentYear} step={1} value={yearRange} onValueChange={setYearRange} className="mt-2" />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>2000</span><span>{currentYear}</span>
                  </div>
                </div>
              </FilterSection>

              <div className="h-px bg-border" />

              {/* Price Section */}
              <FilterSection title="Price" sectionKey="price">
                <div className="flex flex-wrap gap-1.5">
                  {pricePresets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant={priceRange[0] === preset.min && priceRange[1] === preset.max ? "default" : "outline"}
                      size="sm"
                      className={`h-7 text-xs ${priceRange[0] === preset.min && priceRange[1] === preset.max ? "gradient-primary border-0" : ""}`}
                      onClick={() => setPriceRange([preset.min, preset.max])}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {formatPrice(priceRange[0], config)} — {formatPrice(priceRange[1], config)}
                  </label>
                  <Slider min={0} max={200000} step={1000} value={priceRange} onValueChange={setPriceRange} className="mt-2" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Min Price</label>
                    <Input
                      type="number"
                      value={priceRange[0] || ""}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                      className="h-8 text-xs"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Max Price</label>
                    <Input
                      type="number"
                      value={priceRange[1] === 200000 ? "" : priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 200000])}
                      className="h-8 text-xs"
                      placeholder="No max"
                    />
                  </div>
                </div>
              </FilterSection>

              <div className="h-px bg-border" />

              {/* Details Section */}
              <FilterSection title="Specifications" sectionKey="details">
                <FilterSelect label="Fuel Type" value={selectedFuel} onChange={setSelectedFuel} placeholder="Any Fuel" options={fuelTypes} />
                <FilterSelect label="Transmission" value={selectedTransmission} onChange={setSelectedTransmission} placeholder="Any" options={transmissions} />
                <FilterSelect label="Color" value={selectedColor} onChange={setSelectedColor} placeholder="Any Color" options={colors} />
                <FilterSelect label="Doors" value={selectedDoors} onChange={setSelectedDoors} placeholder="Any" options={doorOptions} />
                <FilterSelect label="Engine Size" value={selectedEngine} onChange={setSelectedEngine} placeholder="Any" options={engineSizes} />
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Max {config.terminology.mileage}: {mileageMax >= 200000 ? "Any" : formatDistance(mileageMax, config)}
                  </label>
                  <Slider min={0} max={200000} step={5000} value={[mileageMax]} onValueChange={(v) => setMileageMax(v[0])} className="mt-2" />
                </div>
              </FilterSection>

              <div className="h-px bg-border" />

              {/* Location & Seller Section */}
              <FilterSection title="Location & Seller" sectionKey="location">
                <FilterSelect label="City / Area" value={selectedCity} onChange={setSelectedCity} placeholder="Any Location" options={cities} />
                <FilterSelect label="Seller Type" value={sellerType} onChange={setSellerType} placeholder="Any Seller" options={sellerTypes} />
              </FilterSection>

              <div className="h-px bg-border" />

              {/* Quick Options */}
              <FilterSection title="Quick Filters" sectionKey="options">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    <span className="text-sm text-foreground">Verified Only</span>
                  </div>
                  <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-warning" />
                    <span className="text-sm text-foreground">Featured Only</span>
                  </div>
                  <Switch checked={featuredOnly} onCheckedChange={setFeaturedOnly} />
                </div>
              </FilterSection>

              <Button className="w-full gradient-primary border-0 lg:hidden mt-3" onClick={() => setShowFilters(false)}>
                Show {totalCount.toLocaleString()} Results
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {loading ? (
              <CarGridSkeleton count={6} />
            ) : listings.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No vehicles found"
                description="Try adjusting your filters or search criteria"
                actionLabel="Clear Filters"
                onAction={clearFilters}
              />
            ) : (
              <>
                {viewMode === "map" ? (
                  <Suspense fallback={<div className="h-[500px] w-full animate-pulse rounded-xl bg-muted" />}>
                    <BrowseMapView listings={listings} country={country} />
                    <p className="mt-2 text-xs text-muted-foreground text-center">
                      {listings.filter(l => l.location).length} of {listings.length} listings shown on map (based on location data)
                    </p>
                  </Suspense>
                ) : (
                  <div className={
                    viewMode === "list"
                      ? "flex flex-col gap-4"
                      : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                  }>
                    {listings.map((car, i) => (
                      <CarCard key={car.id} car={car} index={i} layout={viewMode} />
                    ))}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pageNum = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            className={`h-8 w-8 p-0 ${page === pageNum ? "gradient-primary border-0" : ""}`}
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum + 1}
                          </Button>
                        );
                      })}
                    </div>
                    <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recently Viewed */}
      <RecentlyViewedCarousel />

      <Footer />
    </div>
  );
};

export default Browse;
