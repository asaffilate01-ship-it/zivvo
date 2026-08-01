import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/countryConfig";
import { useCountry } from "@/contexts/CountryContext";

interface Props {
  dealerId: string;
  days?: number;
}

interface Item {
  id: string; title: string; price: number; year: number;
  mileage?: number | null; images?: string[] | null; created_at: string;
  vat_qualifying?: boolean | null;
}

const JustArrivedRail = ({ dealerId, days = 14 }: Props) => {
  const { t } = useTranslation();
  const { config } = useCountry();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("car_listings_public")
        .select("id,title,price,year,mileage,images,created_at")
        .eq("dealer_id", dealerId)
        .eq("status", "active")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10);
      setItems((data as Item[]) || []);
      setLoading(false);
    })();
  }, [dealerId, days]);

  if (loading || items.length === 0) return null;

  return (
    <section className="py-10 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-5">
          <div>
            <Badge variant="secondary" className="mb-2">
              <Sparkles className="w-3 h-3 mr-1" /> {t("dealer.justArrived.badge")}
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold">{t("dealer.justArrived.heading")}</h2>
            <p className="text-sm text-muted-foreground">{t("dealer.justArrived.subtitle", { days })}</p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory -mx-4 px-4">
          {items.map((c) => (
            <Link key={c.id} to={`/car/${c.id}`} className="snap-start shrink-0 w-64">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                <div className="aspect-video bg-muted relative">
                  {c.images?.[0] && (
                    <img src={c.images[0]} alt={c.title} className="w-full h-full object-cover" loading="lazy" />
                  )}
                  <Badge className="absolute top-2 left-2">{t("dealer.justArrived.newIn")}</Badge>
                </div>
                <div className="p-3">
                  <div className="font-semibold text-sm line-clamp-1">{c.title}</div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {c.year}{c.mileage ? ` · ${t("dealer.justArrived.mileage", { count: c.mileage.toLocaleString() })}` : ""}
                  </div>
                  <div className="font-bold text-primary">
                    {formatPrice(c.price, config)}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          <div className="snap-start shrink-0 w-12 flex items-center text-muted-foreground">
            <ChevronRight className="w-6 h-6" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default JustArrivedRail;
