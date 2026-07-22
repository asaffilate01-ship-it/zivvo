import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useTranslation } from "react-i18next";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { HelpCircle, MessageSquare } from "lucide-react";

const HelpCentre = () => {
  const { t } = useTranslation();
  const faqs = t("helpCentre.faqs", { returnObjects: true }) as { q: string; a: string }[];
  return (
  <div className="min-h-screen bg-background">
    <SEOHead title={t("helpCentre.metaTitle")} description={t("helpCentre.metaDescription")} />
    <Navbar />
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <HelpCircle className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground md:text-4xl">{t("helpCentre.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("helpCentre.subtitle")}</p>
      </div>

      <Accordion type="single" collapsible className="mt-10">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left font-display font-semibold text-foreground">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 rounded-xl border border-border bg-card p-8 text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-primary" />
        <h3 className="mt-3 font-display text-lg font-semibold text-card-foreground">{t("helpCentre.stillNeedHelp")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("helpCentre.supportReady")}</p>
        <Link to="/contact">
          <Button className="gradient-primary mt-4 border-0">{t("helpCentre.contactSupport")}</Button>
        </Link>
      </div>
    </div>
    <Footer />
  </div>
  );
};

export default HelpCentre;
