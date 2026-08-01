import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, ArrowRight, Eye, Calendar, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice, formatDistance } from "@/lib/countryConfig";
import { useTranslation } from "react-i18next";

const CarOfTheWeek = () => {
  const { country, config } = useCountry();
  const { t } = useTranslation();
  const [car, setCar] = useState<any>(null);

  useEffect(() => {
    const fetchPick = async () => {
      const { data } = await supabase
        .from("car_listings")
        .select("*")
        .eq("status", "active")
        .eq("country", country)
        .eq("is_featured", true)
        .order("views_count", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setCar(data);
    };
    fetchPick();
  }, [country]);

  if (!car) return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
          <div className="grid lg:grid-cols-2">
            {/* Image */}
            <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto">
              <img
                src={car.images?.[0] || "/placeholder.svg"}
                alt={car.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent lg:bg-gradient-to-r" />
              <Badge className="absolute left-4 top-4 bg-warning text-warning-foreground border-0 gap-1">
                <Award className="h-3 w-3" /> {t("home.carOfWeek.editorsPick")}
              </Badge>
            </div>

            {/* Details */}
            <div className="flex flex-col justify-center p-6 lg:p-10">
              <Badge variant="outline" className="mb-3 w-fit text-xs">{t("home.carOfWeek.badge")}</Badge>
              <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                {car.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-muted-foreground">
                {car.description || t("home.carOfWeek.defaultDesc", { year: car.year, make: car.make, model: car.model })}
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <Calendar className="mx-auto h-4 w-4 text-muted-foreground" />
                  <p className="mt-1 text-xs text-muted-foreground">{t("home.carOfWeek.year")}</p>
                  <p className="font-display text-sm font-bold text-foreground">{car.year}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <Gauge className="mx-auto h-4 w-4 text-muted-foreground" />
                  <p className="mt-1 text-xs text-muted-foreground">{t("home.carOfWeek.mileage")}</p>
                  <p className="font-display text-sm font-bold text-foreground">
                    {car.mileage ? formatDistance(car.mileage, config) : t("home.carOfWeek.na")}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <Eye className="mx-auto h-4 w-4 text-muted-foreground" />
                  <p className="mt-1 text-xs text-muted-foreground">{t("home.carOfWeek.views")}</p>
                  <p className="font-display text-sm font-bold text-foreground">{car.views_count || 0}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="font-display text-3xl font-bold text-primary">
                  {formatPrice(car.price, config)}
                </p>
                <Link to={`/car/${car.id}`}>
                  <Button className="gradient-primary border-0 gap-1.5">
                    {t("home.carOfWeek.viewDetails")} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default CarOfTheWeek;
