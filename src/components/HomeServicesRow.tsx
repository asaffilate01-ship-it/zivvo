import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calculator, Tag, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Calculator,
    title: "Cut the cost of car finance",
    bullets: ["Zero deposit available", "Soft-search — no impact on credit", "Decision in minutes"],
    cta: "Get a quote",
    href: "/finance",
    accent: "from-primary/15 to-primary/5",
    ribbon: "Rates from 8.9% APR",
  },
  {
    icon: Tag,
    title: "Sell your car",
    bullets: ["List in under 2 minutes", "Reach 25K+ active buyers", "Free valuation in seconds"],
    cta: "Get a free valuation",
    href: "/valuation",
    accent: "from-accent/15 to-accent/5",
    ribbon: "Average sale: 7 days",
  },
  {
    icon: ShieldCheck,
    title: "Vehicle history check",
    bullets: ["Outstanding finance", "Stolen / written-off", "Mileage anomalies"],
    cta: "Run an HPI check",
    href: "/hpi-check",
    accent: "from-success/15 to-success/5",
    ribbon: "9 of 10 listings checked",
  },
];

const HomeServicesRow = () => {
  return (
    <section className="bg-background py-14">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">Services</p>
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">All you need, in one place</h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to={s.href}
                className={`group relative block h-full overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${s.accent} p-6 transition-all hover:shadow-elevated`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="rounded-full border border-border bg-card/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur">
                    {s.ribbon}
                  </span>
                </div>

                <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{s.title}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {b}
                    </li>
                  ))}
                </ul>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-6 gap-1.5 border-border bg-card/80 backdrop-blur transition-colors group-hover:border-primary group-hover:text-primary"
                >
                  {s.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeServicesRow;
