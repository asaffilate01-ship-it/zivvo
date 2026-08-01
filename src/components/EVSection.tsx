import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Leaf, Battery, Gauge, Fuel } from "lucide-react";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import { useState } from "react";

const EVSection = () => {
  const { config } = useCountry();
  const { t } = useTranslation();
  const [fuelCost] = useState(1.75); // per litre (DE avg)
  const [elecCost] = useState(0.32); // per kWh
  const [annualKilometres] = useState(15000);

  const petrolCostYear = Math.round((annualKilometres / 100) * 7 * fuelCost);
  const evCostYear = Math.round((annualKilometres / 5.5) * elecCost);

  return (
    <section className="py-16 border-y border-border">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-10 lg:grid-cols-2 items-center"
        >
          <div>
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
              <Zap className="mr-1 h-3 w-3" /> {t("home.ev.badge")}
            </Badge>
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              {t("home.ev.titleA")}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent"> {t("home.ev.titleB")}</span>
            </h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              {t("home.ev.subtitle")}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { icon: Leaf, label: t("home.ev.zeroEmissions"), desc: t("home.ev.zeroEmissionsDesc") },
                { icon: Battery, label: t("home.ev.lowerCost"), desc: t("home.ev.lowerCostDesc", { amount: formatPrice(petrolCostYear - evCostYear, config) }) },
                { icon: Gauge, label: t("home.ev.torque"), desc: t("home.ev.torqueDesc") },
                { icon: Fuel, label: t("home.ev.homeCharging"), desc: t("home.ev.homeChargingDesc") },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <item.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-card-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Link to="/browse?fuel=Electric">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                  <Zap className="mr-1 h-4 w-4" /> {t("home.ev.browseEvs")}
                </Button>
              </Link>
              <Link to="/browse?fuel=Hybrid">
                <Button variant="outline">{t("home.ev.browseHybrids")} <ArrowRight className="ml-1 h-4 w-4" /></Button>
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <h3 className="font-display text-base font-semibold text-card-foreground mb-4">
              {t("home.ev.comparisonTitle")}
            </h3>
            <p className="text-xs text-muted-foreground mb-6">{t("home.ev.comparisonSub", { miles: annualKilometres.toLocaleString(config.currency.locale) })}</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1 text-muted-foreground"><Fuel className="h-3.5 w-3.5" /> {t("home.ev.petrol")}</span>
                  <span className="font-semibold text-foreground">{formatPrice(petrolCostYear, config)}{t("home.ev.perYear")}</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: "100%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1 text-muted-foreground"><Zap className="h-3.5 w-3.5" /> {t("home.ev.electric")}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatPrice(evCostYear, config)}{t("home.ev.perYear")}</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(evCostYear / petrolCostYear) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-emerald-500/10 p-4 text-center">
              <p className="text-xs text-muted-foreground">{t("home.ev.youCouldSave")}</p>
              <p className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatPrice(petrolCostYear - evCostYear, config)}
              </p>
              <p className="text-xs text-muted-foreground">{t("home.ev.perYearSwitching")}</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default EVSection;
