import { motion } from "framer-motion";
import { Shield, BadgeCheck, Headphones, RotateCcw, CreditCard, Lock } from "lucide-react";

const reasons = [
  {
    icon: BadgeCheck,
    title: "Verified Sellers",
    desc: "Every dealer passes KYC verification. Private sellers are identity-checked.",
  },
  {
    icon: Shield,
    title: "Finance & Theft Checks",
    desc: "All vehicles are screened for outstanding finance, theft, and write-off history.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    desc: "Stripe-powered transactions with buyer protection on every purchase.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    desc: "Our team is available 7 days a week to help with any questions or issues.",
  },
  {
    icon: RotateCcw,
    title: "Full History Reports",
    desc: "Access MOT history, mileage checks, and previous owner details instantly.",
  },
  {
    icon: Lock,
    title: "Data Privacy",
    desc: "Your personal data is encrypted and never shared with third parties.",
  },
];

const WhyBuyFromUs = () => (
  <section className="border-y border-border bg-muted/30 py-16">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
          Why Buy From <span className="text-primary">AutoVault</span>?
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
            className="flex gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-card"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <r.icon className="h-5 w-5 text-primary" />
            </div>
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
