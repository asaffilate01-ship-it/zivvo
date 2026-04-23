import { motion } from "framer-motion";
import { Shield, BadgeCheck, Headphones, RotateCcw, CreditCard, Lock } from "lucide-react";
import Icon3D from "@/components/Icon3D";

const reasons = [
  {
    icon: BadgeCheck,
    variant: "primary" as const,
    title: "Verified Sellers",
    desc: "Every dealer passes KYC verification. Private sellers are identity-checked.",
  },
  {
    icon: Shield,
    variant: "success" as const,
    title: "Finance & Theft Checks",
    desc: "All vehicles are screened for outstanding finance, theft, and write-off history.",
  },
  {
    icon: CreditCard,
    variant: "info" as const,
    title: "Secure Payments",
    desc: "Stripe-powered transactions with buyer protection on every purchase.",
  },
  {
    icon: Headphones,
    variant: "accent" as const,
    title: "Dedicated Support",
    desc: "Our team is available 7 days a week to help with any questions or issues.",
  },
  {
    icon: RotateCcw,
    variant: "warning" as const,
    title: "Full History Reports",
    desc: "Access MOT history, mileage checks, and previous owner details instantly.",
  },
  {
    icon: Lock,
    variant: "primary" as const,
    title: "Data Privacy",
    desc: "Your personal data is encrypted and never shared with third parties.",
  },
];

const WhyBuyFromUs = () => (
  <section className="relative overflow-hidden border-y border-border bg-muted/30 py-16">
    <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-60" aria-hidden="true" />
    <div className="container relative mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
          Why Buy From <span className="text-gradient-primary">AutoSouq</span>?
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
          We're building the most trusted car marketplace in the world
        </p>
      </motion.div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reasons.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            viewport={{ once: true }}
            className="group flex gap-4 rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm hover-lift"
          >
            <Icon3D icon={r.icon} variant={r.variant} size="lg" />
            <div>
              <h3 className="font-display text-sm font-semibold text-card-foreground">{r.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyBuyFromUs;
