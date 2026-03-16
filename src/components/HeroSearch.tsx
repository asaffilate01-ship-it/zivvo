import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-cars.jpg";

const HeroSearch = () => {
  const navigate = useNavigate();
  const { config } = useCountry();
  const [keyword, setKeyword] = useState("");
  const [make, setMake] = useState("");
  const [bodyType, setBodyType] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/browse?q=${keyword}&make=${make}&body=${bodyType}`);
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="gradient-dark absolute inset-0" />
      <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${heroImage})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      <div className="container relative mx-auto px-4 pb-20 pt-16 md:pb-28 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            <span className="text-primary-foreground">Find Your </span>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Perfect Drive
            </span>
          </h1>
          <p className="mt-4 text-lg text-primary-foreground/70 md:text-xl">
            Browse thousands of verified vehicles from trusted dealers and private sellers
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          onSubmit={handleSearch}
          className="mx-auto mt-10 max-w-4xl"
        >
          <div className="rounded-2xl border border-primary-foreground/10 bg-background/95 p-3 shadow-elevated backdrop-blur-xl md:p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search make, model, or keyword..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-full md:w-44">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Make</label>
                <Select value={make} onValueChange={setMake}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Make" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.makes.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-44">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Body Type</label>
                <Select value={bodyType} onValueChange={setBodyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.bodyTypes.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" size="lg" className="gradient-primary border-0 px-8">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>

            <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate("/browse")}>
                <SlidersHorizontal className="mr-1 h-4 w-4" />
                Advanced Filters
              </Button>
              <div className="hidden gap-2 md:flex">
                {[`Under ${formatPrice(30000, config)}`, "SUVs", "Electric", "Low Mileage"].map((tag) => (
                  <Button key={tag} variant="outline" size="sm" className="rounded-full text-xs" onClick={() => {
                    if (tag.startsWith("Under")) navigate(`/browse?priceMax=30000`);
                    else if (tag === "SUVs") navigate("/browse?body=SUV");
                    else if (tag === "Electric") navigate("/browse?fuel=Electric");
                    else navigate("/browse?mileageMax=30000");
                  }}>
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </motion.form>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mx-auto mt-10 flex max-w-2xl justify-center gap-8 md:gap-16"
        >
          {[
            { value: "25,000+", label: "Active Listings" },
            { value: "3,200+", label: "Verified Dealers" },
            { value: "98%", label: "Satisfaction Rate" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-2xl font-bold text-primary-foreground md:text-3xl">{stat.value}</p>
              <p className="mt-1 text-sm text-primary-foreground/60">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSearch;
