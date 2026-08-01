import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface SoldCar {
  id: string;
  title: string;
  price: number;
  images: string[] | null;
  updated_at: string;
}

const RecentlySoldFeed = () => {
  const { config, country } = useCountry();
  const { t } = useTranslation();
  const [soldCars, setSoldCars] = useState<SoldCar[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (supabase.from as any)("recently_sold_public")
        .select("id, title, price, images, updated_at")
        .eq("country", country)
        .order("updated_at", { ascending: false })
        .limit(12);
      if (data) setSoldCars(data as SoldCar[]);
    };
    fetch();
  }, [country]);

  if (soldCars.length === 0) return null;

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return t("home.recentlySold.justNow");
    if (hours < 24) return t("home.recentlySold.hoursAgo", { h: hours });
    const days = Math.floor(hours / 24);
    return t("home.recentlySold.daysAgo", { d: days });
  };

  return (
    <section className="border-y border-border bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-6"
        >
          <Badge className="bg-success/10 text-success border-success/20">{t("home.recentlySold.live")}</Badge>
          <h2 className="font-display text-lg font-bold text-foreground">{t("home.recentlySold.title")}</h2>
        </motion.div>

        <div className="relative overflow-hidden">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {soldCars.map((car, i) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="flex-shrink-0 snap-start w-56"
              >
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                  <img
                    src={car.images?.[0] || "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=100&q=60"}
                    alt={car.title}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-card-foreground">{car.title}</p>
                    <p className="text-sm font-bold text-primary">{formatPrice(car.price, config)}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-success" />
                      {t("home.recentlySold.sold")}
                      <Clock className="ml-1 h-3 w-3" />
                      {timeAgo(car.updated_at)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecentlySoldFeed;
