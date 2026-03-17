import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCountry } from "@/contexts/CountryContext";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { formatPrice } from "@/lib/countryConfig";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-cars.jpg";

const HeroSearch = () => {
  const navigate = useNavigate();
  const { config } = useCountry();
  const [keyword, setKeyword] = useState("");
  const [make, setMake] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [priceRange, setPriceRange] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (make) params.set("make", make);
    if (bodyType) params.set("body", bodyType);
    if (priceRange) params.set("priceMax", priceRange);
    navigate(`/browse?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[600px] overflow-hidden md:min-h-[680px]">
      {/* Layered background */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Floating accent shapes */}
      <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -left-10 bottom-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />

      <div className="container relative mx-auto px-4 pb-24 pt-20 md:pb-32 md:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Live marketplace — updated in real-time
            </div>

            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
              Find Your
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Perfect Drive
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-primary-foreground/65 md:text-lg">
              Browse thousands of verified vehicles from trusted dealers and private sellers across the {config.name}.
            </p>

            {/* Stats row */}
            <div className="mt-8 flex gap-8">
              {[
                { value: "25K+", label: "Listings" },
                { value: "3.2K+", label: "Dealers" },
                { value: "98%", label: "Satisfaction" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <p className="font-display text-2xl font-bold text-primary-foreground md:text-3xl">{stat.value}</p>
                  <p className="text-xs text-primary-foreground/50">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Search card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <form onSubmit={handleSearch}>
              <div className="rounded-2xl border border-border/50 bg-card/95 p-5 shadow-elevated backdrop-blur-xl md:p-6">
                <h2 className="font-display text-lg font-semibold text-card-foreground">Search Vehicles</h2>
                <p className="mb-4 text-xs text-muted-foreground">Find exactly what you're looking for</p>

                <div className="space-y-3">
                  <SearchAutocomplete
                    value={keyword}
                    onChange={setKeyword}
                    placeholder="Search make, model, or keyword..."
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Select value={make} onValueChange={setMake}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Any Make" /></SelectTrigger>
                      <SelectContent>
                        {config.makes.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={bodyType} onValueChange={setBodyType}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Body Type" /></SelectTrigger>
                      <SelectContent>
                        {config.bodyTypes.map((b) => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Max Price" /></SelectTrigger>
                    <SelectContent>
                      {[5000, 10000, 15000, 20000, 30000, 50000, 75000, 100000].map((p) => (
                        <SelectItem key={p} value={String(p)}>Up to {formatPrice(p, config)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button type="submit" size="lg" className="gradient-primary h-12 w-full border-0 text-sm font-semibold">
                    <Search className="mr-2 h-4 w-4" />
                    Search Vehicles
                  </Button>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/browse")}>
                    <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
                    Advanced Filters
                  </Button>
                  <div className="flex flex-wrap gap-1.5">
                    {["Electric", "SUVs", "Low Mileage"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                        onClick={() => {
                          if (tag === "SUVs") navigate("/browse?body=SUV");
                          else if (tag === "Electric") navigate("/browse?fuel=Electric");
                          else navigate("/browse?mileageMax=30000");
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSearch;
