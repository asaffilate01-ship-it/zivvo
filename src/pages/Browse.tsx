import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import SEOHead from "@/components/SEOHead";
import { CarGridSkeleton } from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import { makes, bodyTypes, fuelTypes, transmissions } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 12;
const currentYear = new Date().getFullYear();
const colors = ["Black", "White", "Silver", "Grey", "Blue", "Red", "Green", "Brown", "Beige", "Yellow", "Orange"];
const doorOptions = ["2", "3", "4", "5"];
const engineSizes = ["1.0L", "1.2L", "1.4L", "1.5L", "1.6L", "1.8L", "2.0L", "2.5L", "3.0L", "3.5L", "4.0L", "5.0L+"];

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("q") || "");
  const [selectedMake, setSelectedMake] = useState(searchParams.get("make") || "");
  const [selectedBody, setSelectedBody] = useState(searchParams.get("body") || "");
  const [selectedFuel, setSelectedFuel] = useState(searchParams.get("fuel") || "");
  const [selectedTransmission, setSelectedTransmission] = useState(searchParams.get("transmission") || "");
  const [selectedColor, setSelectedColor] = useState(searchParams.get("color") || "");
  const [priceRange, setPriceRange] = useState([
    parseInt(searchParams.get("priceMin") || "0"),
    parseInt(searchParams.get("priceMax") || "200000"),
  ]);
  const [yearRange, setYearRange] = useState([
    parseInt(searchParams.get("yearMin") || "2000"),
    parseInt(searchParams.get("yearMax") || String(currentYear)),
  ]);
  const [mileageMax, setMileageMax] = useState(
    parseInt(searchParams.get("mileageMax") || "200000")
  );
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "0"));

  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (selectedMake) params.set("make", selectedMake);
    if (selectedBody) params.set("body", selectedBody);
    if (selectedFuel) params.set("fuel", selectedFuel);
    if (selectedTransmission) params.set("transmission", selectedTransmission);
    if (selectedColor) params.set("color", selectedColor);
    if (priceRange[0] > 0) params.set("priceMin", String(priceRange[0]));
    if (priceRange[1] < 200000) params.set("priceMax", String(priceRange[1]));
    if (yearRange[0] > 2000) params.set("yearMin", String(yearRange[0]));
    if (yearRange[1] < currentYear) params.set("yearMax", String(yearRange[1]));
    if (mileageMax < 200000) params.set("mileageMax", String(mileageMax));
    if (sortBy !== "newest") params.set("sort", sortBy);
    if (page > 0) params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [keyword, selectedMake, selectedBody, selectedFuel, selectedTransmission, selectedColor, priceRange, yearRange, mileageMax, sortBy, page, setSearchParams]);

  useEffect(() => { updateURL(); }, [updateURL]);

  useEffect(() => {
    setPage(0);
  }, [keyword, selectedMake, selectedBody, selectedFuel, selectedTransmission, selectedColor, priceRange, yearRange, mileageMax, sortBy]);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);

      let query = supabase
        .from("car_listings")
        .select("*", { count: "exact" })
        .eq("status", "active")
        .gte("price", priceRange[0])
        .lte("price", priceRange[1])
        .gte("year", yearRange[0])
        .lte("year", yearRange[1]);

      if (mileageMax < 200000) {
        query = query.lte("mileage", mileageMax);
      }
      if (keyword) {
        query = query.or(`title.ilike.%${keyword}%,make.ilike.%${keyword}%,model.ilike.%${keyword}%`);
      }
      if (selectedMake) query = query.eq("make", selectedMake);
      if (selectedBody) query = query.eq("body_type", selectedBody);
      if (selectedFuel) query = query.eq("fuel_type", selectedFuel);
      if (selectedTransmission) query = query.eq("transmission", selectedTransmission);
      if (selectedColor) query = query.ilike("color", `%${selectedColor}%`);

      const orderCol = sortBy === "price_asc" ? "price" : sortBy === "price_desc" ? "price" : sortBy === "mileage_asc" ? "mileage" : "created_at";
      const ascending = sortBy === "price_asc" || sortBy === "mileage_asc";
      query = query.order(orderCol, { ascending }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      const { data, count, error } = await query;
      if (!error && data) {
        setListings(data);
        setTotalCount(count || 0);
      }
      setLoading(false);
    };
    fetchListings();
  }, [keyword, selectedMake, selectedBody, selectedFuel, selectedTransmission, selectedColor, priceRange, yearRange, mileageMax, sortBy, page]);

  const clearFilters = () => {
    setKeyword("");
    setSelectedMake("");
    setSelectedBody("");
    setSelectedFuel("");
    setSelectedTransmission("");
    setSelectedColor("");
    setPriceRange([0, 200000]);
    setYearRange([2000, currentYear]);
    setMileageMax(200000);
  };

  const activeFiltersList: { label: string; clear: () => void }[] = [];
  if (selectedMake) activeFiltersList.push({ label: selectedMake, clear: () => setSelectedMake("") });
  if (selectedBody) activeFiltersList.push({ label: selectedBody, clear: () => setSelectedBody("") });
  if (selectedFuel) activeFiltersList.push({ label: selectedFuel, clear: () => setSelectedFuel("") });
  if (selectedTransmission) activeFiltersList.push({ label: selectedTransmission, clear: () => setSelectedTransmission("") });
  if (selectedColor) activeFiltersList.push({ label: selectedColor, clear: () => setSelectedColor("") });
  if (priceRange[0] > 0 || priceRange[1] < 200000) activeFiltersList.push({ label: `$${priceRange[0].toLocaleString()}-$${priceRange[1].toLocaleString()}`, clear: () => setPriceRange([0, 200000]) });
  if (yearRange[0] > 2000 || yearRange[1] < currentYear) activeFiltersList.push({ label: `${yearRange[0]}-${yearRange[1]}`, clear: () => setYearRange([2000, currentYear]) });
  if (mileageMax < 200000) activeFiltersList.push({ label: `≤${mileageMax.toLocaleString()} mi`, clear: () => setMileageMax(200000) });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Browse Cars for Sale"
        description={`Browse ${totalCount > 0 ? totalCount.toLocaleString() : ""} verified vehicles. Filter by make, model, price, year, and more.`}
      />
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Browse Cars</h1>
            <p className="text-muted-foreground">{totalCount} vehicles found</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_asc">Price: Low-High</SelectItem>
                <SelectItem value="price_desc">Price: High-Low</SelectItem>
                <SelectItem value="mileage_asc">Mileage: Low-High</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
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
                <button onClick={f.clear} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-primary">
              Clear all
            </Button>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className={`lg:col-span-1 ${showFilters ? "block" : "hidden lg:block"}`}>
            {/* Mobile overlay backdrop */}
            {showFilters && (
              <div className="fixed inset-0 z-40 bg-foreground/50 lg:hidden" onClick={() => setShowFilters(false)} />
            )}
            <div className={`${showFilters ? "fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl lg:static lg:max-h-none lg:rounded-none" : ""} sticky top-20 space-y-5 rounded-xl border border-border bg-card p-5`}>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-card-foreground">Filters</h3>
                <div className="flex items-center gap-2">
                  {activeFiltersList.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-primary">
                      Clear all
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={() => setShowFilters(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Keyword..." value={keyword} onChange={(e) => setKeyword(e.target.value)} className="pl-10" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Make</label>
                <Select value={selectedMake} onValueChange={setSelectedMake}>
                  <SelectTrigger><SelectValue placeholder="Any Make" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Make</SelectItem>
                    {makes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Body Type</label>
                <Select value={selectedBody} onValueChange={setSelectedBody}>
                  <SelectTrigger><SelectValue placeholder="Any Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Type</SelectItem>
                    {bodyTypes.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Fuel Type</label>
                <Select value={selectedFuel} onValueChange={setSelectedFuel}>
                  <SelectTrigger><SelectValue placeholder="Any Fuel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Fuel</SelectItem>
                    {fuelTypes.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Transmission</label>
                <Select value={selectedTransmission} onValueChange={setSelectedTransmission}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {transmissions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Color</label>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger><SelectValue placeholder="Any Color" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Color</SelectItem>
                    {colors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Price: ${priceRange[0].toLocaleString()} — ${priceRange[1].toLocaleString()}
                </label>
                <Slider min={0} max={200000} step={5000} value={priceRange} onValueChange={setPriceRange} className="mt-2" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Year: {yearRange[0]} — {yearRange[1]}
                </label>
                <Slider min={2000} max={currentYear} step={1} value={yearRange} onValueChange={setYearRange} className="mt-2" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Max Mileage: {mileageMax >= 200000 ? "Any" : `${mileageMax.toLocaleString()} mi`}
                </label>
                <Slider min={0} max={200000} step={5000} value={[mileageMax]} onValueChange={(v) => setMileageMax(v[0])} className="mt-2" />
              </div>

              {/* Mobile apply button */}
              <Button className="w-full gradient-primary border-0 lg:hidden" onClick={() => setShowFilters(false)}>
                Show {totalCount} Results
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
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {listings.map((car, i) => (
                    <CarCard key={car.id} car={car} index={i} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </span>
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

      <Footer />
    </div>
  );
};

export default Browse;
