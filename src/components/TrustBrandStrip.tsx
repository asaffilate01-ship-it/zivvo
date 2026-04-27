import { motion } from "framer-motion";
import { ShieldCheck, Award, Lock, Star, BadgeCheck, Sparkles } from "lucide-react";

const badges = [
  { icon: ShieldCheck, label: "KYC-Verified Dealers", sub: "Every seller checked" },
  { icon: Lock, label: "Buyer Protection", sub: "Escrow & deposits" },
  { icon: Award, label: "AA-Style Inspections", sub: "200-point report" },
  { icon: BadgeCheck, label: "HPI & MOT Clear", sub: "Full history reports" },
  { icon: Sparkles, label: "7-Day Guarantee", sub: "On eligible vehicles" },
  { icon: Star, label: "Founding Members", sub: "Be one of the first" },
];

const TrustBrandStrip = () => {
  return (
    <section className="border-y border-border bg-gradient-to-b from-muted/40 to-background py-10">
      <div className="container mx-auto px-4">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Built for UK buyers, sellers & dealers
        </motion.p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {badges.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              className="group flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/60 px-3 py-2.5 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card hover:shadow-card"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-accent/10 text-primary ring-1 ring-primary/20">
                <b.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">{b.label}</p>
                <p className="truncate text-[10px] text-muted-foreground">{b.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBrandStrip;
