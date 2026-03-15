import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import { makes, bodyTypes, fuelTypes, transmissions } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, SlidersHorizontal, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 12;

const Browse = () => {
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("q") || "");
  const [selectedMake, setSelectedMake] = useState(searchParams.get("make") || "");
  const [selectedBody, setSelectedBody] = useState(searchParams.get("body") || "");
  const [selectedFuel, setSelectedFuel] = useState("");
  const [selectedTransmission, setSelectedTransmission] = useState("");
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [keyword, selectedMake, selectedBody, selectedFuel, selectedTransmission, priceRange, sortBy]);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);

      let query = supabase
        .from("car_listings")
        .select("*", { count: "exact" })
        .eq("status", "active")
        .gte("price", priceRange[0])
        .lte("price", priceRange[1]);

      if (keyword) {
        query = query.or(`title.ilike.%${keyword}%,make.ilike.%${keyword}%,model.ilike.%${keyword}%`);
      }
      if (selectedMake) query = query.eq("make", selectedMake);
      if (selectedBody) query = query.eq("body_type", selectedBody);
      if (selectedFuel) query = query.eq("fuel_type", selectedFuel);
      if (selectedTransmission) query = query.eq("transmission", selectedTransmission);

      const orderCol = sortBy === "price_asc" ? "price" : sortBy === "price_desc" ? "price" : "created_at";
      const ascending = sortBy === "price_asc";
      query = query.order(orderCol, { ascending }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      const { data, count, error } = await query;
      if (!error && data) {
        setListings(data);
        setTotalCount(count || 0);
      }
      setLoading(false);
    };
    fetchListings();
  }, [keyword, selectedMake, selectedBody, selectedFuel, selectedTransmission, priceRange, sortBy, page]);

  const clearFilters = () => {
    setKeyword("");
    setSelectedMake("");
    setSelectedBody("");
    setSelectedFuel("");
    setSelectedTransmission("");
    setPriceRange([0, 200000]);
  };

  const activeFilters = [selectedMake, selectedBody, selectedFuel, selectedTransmission].filter(Boolean).length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Browse Cars</h1>
            <p className="text-muted-foreground">{totalCount} vehicles found</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_asc">Price: Low-High</SelectItem>
                <SelectItem value="price_desc">Price: High-Low</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters {activeFilters > 0 && `(${activeFilters})`}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className={`lg:col-span-1 ${showFilters ? "block" : "hidden lg:block"}`}>
            <div className="sticky top-20 space-y-5 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-card-foreground">Filters</h3>
                {activeFilters > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-primary">
                    Clear all
                  </Button>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Keyword..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="pl-10"
                  />
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
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Price: ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
                </label>
                <Slider
                  min={0}
                  max={200000}
                  step={5000}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center">
                <Search className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-display text-lg font-semibold">No vehicles found</h3>
                <p className="mt-1 text-muted-foreground">Try adjusting your filters</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {listings.map((car, i) => (
                    <CarCard key={car.id} car={car} index={i} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
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
