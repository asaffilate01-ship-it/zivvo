import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice, formatDistance } from "@/lib/countryConfig";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Plus, X, Car, ArrowLeft, Printer, Share2, BadgeCheck,
  Sparkles, Fuel, Settings2, Calendar, Gauge, Palette, DoorOpen, Cog, MapPin,
  CheckCircle, XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const MAX_COMPARE = 3;

const CompareCars = () => {
  const { config } = useCountry();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialCar = searchParams.get("car");
  const [selectedIds, setSelectedIds] = useState<string[]>(initialCar ? [initialCar] : []);
  const [cars, setCars] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedIds.length === 0) { setCars([]); return; }
    const fetchCars = async () => {
      const { data } = await supabase
        .from("car_listings")
        .select("*")
        .in("id", selectedIds)
        .eq("status", "active");
      if (data) setCars(data);
    };
    fetchCars();
  }, [selectedIds]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const tsQuery = searchQuery.trim().split(/\s+/).join(" & ");
      const { data } = await supabase
        .from("car_listings")
        .select("id, title, make, model, year, price, images, verified, is_featured")
        .eq("status", "active")
        .textSearch("search_vector", tsQuery, { config: "english" })
        .limit(8);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const addCar = (id: string) => {
    if (selectedIds.includes(id) || selectedIds.length >= MAX_COMPARE) return;
    setSelectedIds((prev) => [...prev, id]);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeCar = (id: string) => {
    setSelectedIds((prev) => prev.filter((i) => i !== id));
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/compare?${selectedIds.map((id) => `car=${id}`).join("&")}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Car Comparison — AutoSouq", url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Comparison link copied!" });
    }
  };

  const handlePrint = () => window.print();

  const specRows = [
    { label: "Price", key: "price", icon: Sparkles, fmt: (v: any) => v ? formatPrice(Number(v), config) : "N/A" },
    { label: "Year", key: "year", icon: Calendar, fmt: (v: any) => v || "N/A" },
    { label: config.terminology.mileage, key: "mileage", icon: Gauge, fmt: (v: any) => v ? formatDistance(Number(v), config) : "N/A" },
    { label: "Fuel Type", key: "fuel_type", icon: Fuel, fmt: (v: any) => v || "N/A" },
    { label: "Transmission", key: "transmission", icon: Settings2, fmt: (v: any) => v || "N/A" },
    { label: "Body Type", key: "body_type", icon: Car, fmt: (v: any) => v || "N/A" },
    { label: "Engine Size", key: "engine_size", icon: Cog, fmt: (v: any) => v || "N/A" },
    { label: "Doors", key: "doors", icon: DoorOpen, fmt: (v: any) => v || "N/A" },
    { label: "Color", key: "color", icon: Palette, fmt: (v: any) => v || "N/A" },
    { label: "Location", key: "location", icon: MapPin, fmt: (v: any) => v || "N/A" },
  ];

  // Collect all unique features across all cars
  const allFeatures = Array.from(
    new Set(cars.flatMap((car) => car.features || []))
  ).sort();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Compare Cars Side by Side"
        description="Compare up to 3 vehicles side by side — specs, price, features, and more on AutoSouq."
      />
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/browse" className="hover:text-primary">Browse</Link>
          <span>/</span>
          <span className="text-foreground">Compare</span>
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/browse">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Compare Cars</h1>
              <p className="text-sm text-muted-foreground">Select up to {MAX_COMPARE} vehicles to compare side by side</p>
            </div>
          </div>
          {cars.length >= 2 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="mr-1 h-4 w-4" /> Share
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex">
                <Printer className="mr-1 h-4 w-4" /> Print
              </Button>
            </div>
          )}
        </div>

        {/* Car slots */}
        <div className={`grid gap-4 ${cars.length === 0 ? "grid-cols-1" : cars.length === 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
          {cars.map((car) => (
            <motion.div key={car.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="relative overflow-hidden group">
                <button
                  onClick={() => removeCar(car.id)}
                  className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow backdrop-blur-sm hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="aspect-video overflow-hidden">
                  <img
                    src={car.images?.[0] || "/placeholder.svg"}
                    alt={car.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="absolute left-2 top-2 flex gap-1.5">
                  {car.is_featured && (
                    <Badge className="gradient-primary border-0 text-primary-foreground text-[10px]">Featured</Badge>
                  )}
                  {car.verified && (
                    <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-[10px]">
                      <BadgeCheck className="mr-0.5 h-3 w-3 text-success" /> Verified
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <Link
                    to={`/car/${car.id}`}
                    className="font-display font-semibold text-card-foreground hover:text-primary line-clamp-1 transition-colors"
                  >
                    {car.title}
                  </Link>
                  <p className="mt-1 font-display text-lg font-bold text-primary">
                    {formatPrice(Number(car.price), config)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {car.year && <Badge variant="outline" className="text-[10px]">{car.year}</Badge>}
                    {car.fuel_type && <Badge variant="outline" className="text-[10px]">{car.fuel_type}</Badge>}
                    {car.transmission && <Badge variant="outline" className="text-[10px]">{car.transmission}</Badge>}
                    {car.mileage && (
                      <Badge variant="outline" className="text-[10px]">
                        {formatDistance(car.mileage, config)}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {selectedIds.length < MAX_COMPARE && (
            <Card className="flex min-h-[240px] items-center justify-center border-dashed border-2">
              <CardContent className="flex flex-col items-center py-8">
                <AnimatePresence mode="wait">
                  {showSearch ? (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full space-y-3 px-2"
                    >
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search by make, model..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {searching && (
                          <p className="text-center text-sm text-muted-foreground py-4">Searching...</p>
                        )}
                        {searchResults
                          .filter((r) => !selectedIds.includes(r.id))
                          .map((r) => (
                            <button
                              key={r.id}
                              onClick={() => addCar(r.id)}
                              className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
                            >
                              <img
                                src={r.images?.[0] || "/placeholder.svg"}
                                alt=""
                                className="h-10 w-14 rounded object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                  <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                                  {r.verified && <BadgeCheck className="h-3 w-3 text-success shrink-0" />}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatPrice(Number(r.price), config)}
                                </p>
                              </div>
                            </button>
                          ))}
                        {searchQuery && !searching && searchResults.length === 0 && (
                          <p className="text-center text-sm text-muted-foreground py-4">No results found</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                      >
                        Cancel
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-muted-foreground">Add a vehicle</p>
                      <p className="text-xs text-muted-foreground mt-1">Search to add a car for comparison</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowSearch(true)}>
                        <Search className="mr-2 h-4 w-4" /> Search Cars
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Comparison table */}
        {cars.length >= 2 && (
          <div ref={tableRef} className="mt-8">
            {/* Specifications */}
            <h2 className="font-display text-lg font-bold text-foreground mb-4">Specifications</h2>
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 border-b border-border bg-card p-3 text-left font-medium text-muted-foreground min-w-[140px]">
                      Specification
                    </th>
                    {cars.map((car) => (
                      <th
                        key={car.id}
                        className="border-b border-border p-3 text-left font-display font-semibold text-card-foreground min-w-[180px]"
                      >
                        <Link to={`/car/${car.id}`} className="hover:text-primary transition-colors">
                          {car.year} {car.make} {car.model}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {specRows.map((row, i) => (
                    <tr key={row.key} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                      <td className="sticky left-0 z-10 border-b border-border bg-inherit p-3 font-medium text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <row.icon className="h-3.5 w-3.5 text-primary" />
                          {row.label}
                        </span>
                      </td>
                      {cars.map((car) => {
                        const val = row.fmt(car[row.key]);
                        const isBest =
                          (row.key === "price" || row.key === "mileage") &&
                          car[row.key] &&
                          car[row.key] === Math.min(...cars.filter((c) => c[row.key]).map((c) => Number(c[row.key])));
                        return (
                          <td
                            key={car.id}
                            className={`border-b border-border p-3 text-card-foreground ${isBest ? "font-semibold text-success" : ""}`}
                          >
                            {val}
                            {isBest && (
                              <Badge
                                variant="outline"
                                className="ml-2 border-success text-success text-[10px] px-1 py-0"
                              >
                                Best
                              </Badge>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Features Comparison */}
            {allFeatures.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-lg font-bold text-foreground mb-4">Features & Equipment</h2>
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full border-separate border-spacing-0 text-sm">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-10 border-b border-border bg-card p-3 text-left font-medium text-muted-foreground min-w-[180px]">
                          Feature
                        </th>
                        {cars.map((car) => (
                          <th
                            key={car.id}
                            className="border-b border-border p-3 text-center font-display font-semibold text-card-foreground min-w-[180px]"
                          >
                            {car.make} {car.model}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allFeatures.map((feature, i) => (
                        <tr key={feature} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                          <td className="sticky left-0 z-10 border-b border-border bg-inherit p-3 font-medium text-muted-foreground">
                            {feature}
                          </td>
                          {cars.map((car) => {
                            const has = (car.features || []).includes(feature);
                            return (
                              <td key={car.id} className="border-b border-border p-3 text-center">
                                {has ? (
                                  <CheckCircle className="mx-auto h-4 w-4 text-success" />
                                ) : (
                                  <XCircle className="mx-auto h-4 w-4 text-muted-foreground/30" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Verdict Summary */}
            <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-6">
              <h3 className="font-display text-base font-bold text-foreground">Quick Verdict</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cars.map((car) => {
                  const featureCount = (car.features || []).length;
                  return (
                    <div key={car.id} className="rounded-lg border border-border bg-card p-4">
                      <p className="font-display font-semibold text-card-foreground text-sm">
                        {car.year} {car.make} {car.model}
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <p>💰 {formatPrice(Number(car.price), config)}</p>
                        <p>🛣️ {car.mileage ? formatDistance(car.mileage, config) : "N/A"}</p>
                        <p>✨ {featureCount} feature{featureCount !== 1 ? "s" : ""}</p>
                        {car.verified && (
                          <p className="flex items-center gap-1 text-success">
                            <BadgeCheck className="h-3 w-3" /> Verified
                          </p>
                        )}
                      </div>
                      <Link to={`/car/${car.id}`}>
                        <Button size="sm" variant="outline" className="mt-3 w-full text-xs">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {cars.length < 2 && cars.length > 0 && (
          <div className="mt-8 rounded-xl border border-border bg-muted/30 p-8 text-center">
            <Car className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium text-foreground">Add at least one more vehicle</p>
            <p className="text-sm text-muted-foreground mt-1">Select another car to start comparing specs and features</p>
          </div>
        )}

        {cars.length === 0 && (
          <div className="mt-8 rounded-xl border border-border bg-muted/30 p-12 text-center">
            <Car className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-display text-lg font-bold text-foreground">No vehicles selected</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add vehicles above to compare specs, features, and pricing side by side
            </p>
            <Link to="/browse">
              <Button className="gradient-primary border-0 mt-4">Browse Cars</Button>
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CompareCars;
