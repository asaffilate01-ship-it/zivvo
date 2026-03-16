import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice, formatDistance } from "@/lib/countryConfig";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, X, Car, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const MAX_COMPARE = 3;

const CompareCars = () => {
  const { config } = useCountry();
  const [searchParams] = useSearchParams();
  const initialCar = searchParams.get("car");
  const [selectedIds, setSelectedIds] = useState<string[]>(initialCar ? [initialCar] : []);
  const [cars, setCars] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

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
        .select("id, title, make, model, year, price, images")
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

  const specRows = [
    { label: "Price", key: "price", fmt: (v: any) => v ? formatPrice(Number(v), config) : "N/A" },
    { label: "Year", key: "year", fmt: (v: any) => v || "N/A" },
    { label: config.terminology.mileage, key: "mileage", fmt: (v: any) => v ? formatDistance(Number(v), config) : "N/A" },
    { label: "Fuel Type", key: "fuel_type", fmt: (v: any) => v || "N/A" },
    { label: "Transmission", key: "transmission", fmt: (v: any) => v || "N/A" },
    { label: "Body Type", key: "body_type", fmt: (v: any) => v || "N/A" },
    { label: "Engine Size", key: "engine_size", fmt: (v: any) => v || "N/A" },
    { label: "Doors", key: "doors", fmt: (v: any) => v || "N/A" },
    { label: "Color", key: "color", fmt: (v: any) => v || "N/A" },
    { label: "Location", key: "location", fmt: (v: any) => v || "N/A" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Compare Cars" description="Compare up to 3 vehicles side by side — specs, price, features and more." />
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/browse"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Compare Cars</h1>
            <p className="text-muted-foreground">Select up to {MAX_COMPARE} vehicles to compare side by side</p>
          </div>
        </div>

        {/* Car slots */}
        <div className={`grid gap-4 ${cars.length === 0 ? "grid-cols-1" : cars.length === 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
          {cars.map((car) => (
            <Card key={car.id} className="relative overflow-hidden">
              <button onClick={() => removeCar(car.id)} className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow backdrop-blur-sm hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
              <div className="aspect-video overflow-hidden">
                <img src={car.images?.[0] || "/placeholder.svg"} alt={car.title} className="h-full w-full object-cover" />
              </div>
              <CardContent className="p-4">
                <Link to={`/car/${car.id}`} className="font-display font-semibold text-card-foreground hover:text-primary line-clamp-1">{car.title}</Link>
                <p className="mt-1 font-display text-lg font-bold text-primary">£{Number(car.price).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}

          {selectedIds.length < MAX_COMPARE && (
            <Card className="flex min-h-[200px] items-center justify-center border-dashed">
              <CardContent className="flex flex-col items-center py-8">
                {showSearch ? (
                  <div className="w-full space-y-3 px-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Search by make, model..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" autoFocus />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {searching && <p className="text-center text-sm text-muted-foreground py-4">Searching...</p>}
                      {searchResults.filter((r) => !selectedIds.includes(r.id)).map((r) => (
                        <button key={r.id} onClick={() => addCar(r.id)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted">
                          <img src={r.images?.[0] || "/placeholder.svg"} alt="" className="h-10 w-14 rounded object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                            <p className="text-xs text-muted-foreground">£{Number(r.price).toLocaleString()}</p>
                          </div>
                        </button>
                      ))}
                      {searchQuery && !searching && searchResults.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-4">No results found</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => { setShowSearch(false); setSearchQuery(""); }}>Cancel</Button>
                  </div>
                ) : (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">Add a vehicle</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowSearch(true)}>
                      <Search className="mr-2 h-4 w-4" /> Search
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Comparison table */}
        {cars.length >= 2 && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 border-b border-border bg-background p-3 text-left font-medium text-muted-foreground">Specification</th>
                  {cars.map((car) => (
                    <th key={car.id} className="border-b border-border p-3 text-left font-display font-semibold text-card-foreground min-w-[180px]">
                      {car.year} {car.make} {car.model}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specRows.map((row, i) => (
                  <tr key={row.key} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="sticky left-0 border-b border-border bg-inherit p-3 font-medium text-muted-foreground">{row.label}</td>
                    {cars.map((car) => {
                      const val = row.fmt(car[row.key]);
                      // Highlight best value for price (lowest) and mileage (lowest)
                      const isBest = (row.key === "price" || row.key === "mileage") && car[row.key] &&
                        car[row.key] === Math.min(...cars.filter((c) => c[row.key]).map((c) => Number(c[row.key])));
                      return (
                        <td key={car.id} className={`border-b border-border p-3 text-card-foreground ${isBest ? "font-semibold text-success" : ""}`}>
                          {val}
                          {isBest && <Badge variant="outline" className="ml-2 border-success text-success text-[10px] px-1 py-0">Best</Badge>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {cars.length < 2 && cars.length > 0 && (
          <div className="mt-8 rounded-xl border border-border bg-muted/30 p-8 text-center">
            <Car className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Add at least one more vehicle to start comparing</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CompareCars;
