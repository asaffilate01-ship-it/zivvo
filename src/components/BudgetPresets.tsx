import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";

const BudgetPresets = () => {
  const { config } = useCountry();
  const { t } = useTranslation();

  const presets = [
    { max: 5000, color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
    { max: 10000, color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
    { max: 15000, color: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20" },
    { max: 20000, color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
    { max: 30000, color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" },
    { max: 50000, color: "bg-primary/10 text-primary border-primary/20" },
    { max: 100000, color: "bg-foreground/5 text-foreground border-border", plus: true },
  ];

  return (
    <section className="container mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-5">
          <Badge variant="outline" className="text-xs">{t("home.budget.quickSearch")}</Badge>
          <h2 className="font-display text-lg font-bold text-foreground">{t("home.budget.title")}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, i) => {
            const label = p.plus
              ? t("home.budget.plus", { price: formatPrice(50000, config) })
              : t("home.budget.under", { price: formatPrice(p.max, config) });
            return (
              <motion.div
                key={p.max}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                viewport={{ once: true }}
              >
                <Link
                  to={p.plus ? `/browse?priceMin=50000` : `/browse?priceMax=${p.max}`}
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-all hover:shadow-card hover:-translate-y-0.5 ${p.color}`}
                >
                  {label}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
};

export default BudgetPresets;
