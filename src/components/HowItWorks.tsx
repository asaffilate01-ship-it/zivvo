import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Search, ShieldCheck, ClipboardCheck, KeyRound } from "lucide-react";
import Icon3D from "@/components/Icon3D";
import { useTranslation } from "react-i18next";

const HowItWorks = () => {
  const { t } = useTranslation();
  const steps = [
    { icon: Search, variant: "primary" as const, title: t("home.howItWorks.s1Title"), desc: t("home.howItWorks.s1Desc") },
    { icon: ShieldCheck, variant: "info" as const, title: t("home.howItWorks.s2Title"), desc: t("home.howItWorks.s2Desc") },
    { icon: ClipboardCheck, variant: "success" as const, title: t("home.howItWorks.s3Title"), desc: t("home.howItWorks.s3Desc") },
    { icon: KeyRound, variant: "warning" as const, title: t("home.howItWorks.s4Title"), desc: t("home.howItWorks.s4Desc") },
  ];

  return (
    <section className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <Badge variant="outline" className="mb-3 text-xs">{t("home.howItWorks.badge")}</Badge>
        <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
          {t("home.howItWorks.title")}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          {t("home.howItWorks.subtitle")}
        </p>
      </motion.div>

      <div className="relative mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              {t("home.howItWorks.step", { n: i + 1 })}
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
