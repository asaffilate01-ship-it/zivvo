import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/contexts/CountryContext";

type CountMap = Record<string, number>;

const TABS = [
  { id: "makes", label: "All makes" },
  { id: "body", label: "Popular body styles" },
  { id: "popular", label: "Popular searches" },
  { id: "local", label: "Local searches" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const POPULAR_SEARCHES = [
  { label: "Cars under £5,000", href: "/browse?priceMax=5000" },
  { label: "Cars under £10,000", href: "/browse?priceMax=10000" },
  { label: "Electric cars", href: "/browse?fuel=Electric" },
  { label: "Hybrid cars", href: "/browse?fuel=Hybrid" },
  { label: "Automatic cars", href: "/browse?transmission=Automatic" },
  { label: "Manual cars", href: "/browse?transmission=Manual" },
  { label: "Low mileage cars", href: "/browse?mileageMax=30000" },
  { label: "Convertibles", href: "/browse?body=Convertible" },
  { label: "Family SUVs", href: "/browse?body=SUV" },
  { label: "First-time driver cars", href: "/browse?priceMax=4000&engine=1.0L" },
  { label: "Diesel cars", href: "/browse?fuel=Diesel" },
  { label: "Vans for sale", href: "/browse?body=Van" },
];

const SEOLinkBlock = () => {
  const { country, config } = useCountry();
  const [tab, setTab] = useState<TabId>("makes");
  const [makeCounts, setMakeCounts] = useState<CountMap>({});
  const [bodyCounts, setBodyCounts] = useState<CountMap>({});
  const [cityCounts, setCityCounts] = useState<CountMap>({});

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("car_listings")
        .select("make, body_type, location")
        .eq("status", "active")
        .eq("country", country)
        .limit(1000);
      if (!data) return;
      const m: CountMap = {};
      const b: CountMap = {};
      const c: CountMap = {};
      data.forEach((l: any) => {
        if (l.make) m[l.make] = (m[l.make] || 0) + 1;
        if (l.body_type) b[l.body_type] = (b[l.body_type] || 0) + 1;
        if (l.location) {
          const city = String(l.location).split(",")[0].trim();
          if (city) c[city] = (c[city] || 0) + 1;
        }
      });
      setMakeCounts(m);
      setBodyCounts(b);
      setCityCounts(c);
    };
    load();
  }, [country]);

  const renderItems = () => {
    if (tab === "makes") {
      return config.makes.map((make) => ({
        label: `Used ${make}`,
        count: makeCounts[make] ?? 0,
        href: `/browse?make=${encodeURIComponent(make)}`,
      }));
    }
    if (tab === "body") {
      return config.bodyTypes.map((body) => ({
        label: `Used ${body}`,
        count: bodyCounts[body] ?? 0,
        href: `/browse?body=${encodeURIComponent(body)}`,
      }));
    }
    if (tab === "local") {
      return config.popularCities.map((city) => ({
        label: `Used cars in ${city}`,
        count: cityCounts[city] ?? 0,
        href: `/browse?location=${encodeURIComponent(city)}`,
      }));
    }
    return POPULAR_SEARCHES.map((s) => ({ label: s.label, count: null as null | number, href: s.href }));
  };

  const items = renderItems();

  return (
    <section className="bg-background py-14">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Browse the marketplace</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-foreground md:text-3xl">Find used cars by make, body or city</h2>
        </motion.div>

        <div className="mx-auto mb-6 inline-flex w-full max-w-3xl flex-wrap justify-center gap-1.5 rounded-full border border-border bg-muted/40 p-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3 md:grid-cols-4">
          {items.map((it) => (
            <Link
              key={it.label}
              to={it.href}
              className="flex items-baseline justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-card-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <span className="truncate">{it.label}</span>
              {it.count !== null && (
                <span className="shrink-0 text-xs text-muted-foreground">({it.count.toLocaleString()})</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SEOLinkBlock;
