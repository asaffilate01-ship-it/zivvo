import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Search, ShieldCheck, ClipboardCheck, KeyRound } from "lucide-react";
import Icon3D from "@/components/Icon3D";

const steps = [
  {
    icon: Search,
    variant: "primary" as const,
    title: "Search & Shortlist",
    desc: "Filter by make, budget, fuel type and distance. Save searches and get instant alerts.",
  },
  {
    icon: ShieldCheck,
    variant: "info" as const,
    title: "Reserve with Confidence",
    desc: "Every dealer is KYC-verified. Buyer protection and pre-auth deposits keep your money safe.",
  },
  {
    icon: ClipboardCheck,
    variant: "success" as const,
    title: "Inspect & Check",
    desc: "200-point AA-style inspections, full HPI, MOT history and finance status — all in one place.",
  },
  {
    icon: KeyRound,
    variant: "warning" as const,
    title: "Drive Away",
    desc: "Collect locally or get nationwide home delivery. 7-day money-back guarantee on eligible cars.",
  },
];

const HowItWorks = () => {
  return (
    <section className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <Badge variant="outline" className="mb-3 text-xs">How it works</Badge>
        <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
          From search to driveway in 4 steps
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          A streamlined buying journey — backed by inspections, escrow and a 7-day guarantee.
        </p>
      </motion.div>

      <div className="relative mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Connecting line on desktop */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
        />

        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            viewport={{ once: true }}
            className="relative flex flex-col items-center rounded-2xl border border-border/60 bg-card p-6 text-center shadow-card hover-lift"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-background px-3 py-0.5 font-display text-xs font-bold text-muted-foreground">
              Step {i + 1}
            </div>
            <Icon3D icon={step.icon} variant={step.variant} size="lg" />
            <h3 className="mt-4 font-display text-base font-semibold text-card-foreground">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
