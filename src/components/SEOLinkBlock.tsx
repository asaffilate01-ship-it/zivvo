import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";

type CountMap = Record<string, number>;

const SEOLinkBlock = () => {
  const { country, config } = useCountry();
  const { t } = useTranslation();
  const [tab, setTab] = useState<"makes" | "body" | "popular" | "local">("makes");
  const [makeCounts, setMakeCounts] = useState<CountMap>({});
  const [bodyCounts, setBodyCounts] = useState<CountMap>({});
  const [cityCounts, setCityCounts] = useState<CountMap>({});

  const TABS = [
    { id: "makes" as const, label: t("seoLinks.tabs.makes") },
    { id: "body" as const, label: t("seoLinks.tabs.body") },
    { id: "popular" as const, label: t("seoLinks.tabs.popular") },
    { id: "local" as const, label: t("seoLinks.tabs.local") },
  ];

  const POPULAR_SEARCHES = [
    { label: t("seoLinks.popular.under", { price: formatPrice(5000, config) }), href: "/browse?priceMax=5000" },
    { label: t("seoLinks.popular.under", { price: formatPrice(10000, config) }), href: "/browse?priceMax=10000" },
    { label: t("seoLinks.popular.electric"), href: "/browse?fuel=Electric" },
    { label: t("seoLinks.popular.hybrid"), href: "/browse?fuel=Hybrid" },
    { label: t("seoLinks.popular.automatic"), href: "/browse?transmission=Automatic" },
    { label: t("seoLinks.popular.manual"), href: "/browse?transmission=Manual" },
    { label: t("seoLinks.popular.lowMileage"), href: "/browse?mileageMax=30000" },
    { label: t("seoLinks.popular.convertibles"), href: "/browse?body=Convertible" },
    { label: t("seoLinks.popular.familySuvs"), href: "/browse?body=SUV" },
    { label: t("seoLinks.popular.firstTime"), href: "/browse?priceMax=4000&engine=1.0L" },
    { label: t("seoLinks.popular.diesel"), href: "/browse?fuel=Diesel" },
    { label: t("seoLinks.popular.vans"), href: "/browse?body=Van" },
  ];

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
    const prefix = t("seoLinks.usedPrefix");
    if (tab === "makes") {
      return config.makes.map((make) => ({
        label: `${prefix} ${make}`,
        count: makeCounts[make] ?? 0,
        href: `/browse?make=${encodeURIComponent(make)}`,
      }));
    }
    if (tab === "body") {
      return config.bodyTypes.map((body) => ({
        label: `${prefix} ${body}`,
        count: bodyCounts[body] ?? 0,
        href: `/browse?body=${encodeURIComponent(body)}`,
      }));
    }
    if (tab === "local") {
      return config.popularCities.map((city) => ({
        label: t("seoLinks.usedCarsIn", { city }),
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
          <p className="text-xs font-medium uppercase tracking-wider text-primary">{t("seoLinks.eyebrow")}</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-foreground md:text-3xl">{t("seoLinks.title")}</h2>
        </motion.div>

        <div className="mx-auto mb-6 inline-flex w-full max-w-3xl flex-wrap justify-center gap-1.5 rounded-full border border-border bg-muted/40 p-1.5">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                tab === tb.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tb.label}
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
