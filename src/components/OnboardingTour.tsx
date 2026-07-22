import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Search, Heart, Shield, Calculator } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const OnboardingTour = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  const steps = [
    { icon: Search, title: t("onboarding.step1Title"), description: t("onboarding.step1Desc") },
    { icon: Shield, title: t("onboarding.step2Title"), description: t("onboarding.step2Desc") },
    { icon: Heart, title: t("onboarding.step3Title"), description: t("onboarding.step3Desc") },
    { icon: Calculator, title: t("onboarding.step4Title"), description: t("onboarding.step4Desc") },
  ];

  useEffect(() => {
    if (!localStorage.getItem("onboarding-complete")) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    setVisible(false);
    localStorage.setItem("onboarding-complete", "1");
  };

  const handleNext = () => {
    if (step >= steps.length - 1) handleComplete();
    else setStep(step + 1);
  };

  if (!visible) return null;

  const current = steps[step];

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
        onClick={handleComplete}
      >
        <motion.div
          key={step}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-elevated"
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-7 w-7" onClick={handleComplete}>
            <X className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
              <current.icon className="h-7 w-7 text-primary-foreground" />
            </div>
            <h3 className="font-display text-xl font-bold text-card-foreground">{current.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{current.description}</p>
          </div>

          <div className="mt-5 flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"}`}
              />
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleComplete}>
              {t("onboarding.skip")}
            </Button>
            <Button size="sm" className="gradient-primary flex-1 border-0 gap-1" onClick={handleNext}>
              {step >= steps.length - 1 ? t("onboarding.start") : t("onboarding.next")}
              {step < steps.length - 1 && <ArrowRight className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;
