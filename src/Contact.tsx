import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, Clock, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Fragment } from "react";
import { legalConfig, legalVersionDate } from "@/lib/legalConfig";

const renderBold = (line: string) => line.split(/(\*\*.*?\*\*)/g).map((part, index) =>
  part.startsWith("**") && part.endsWith("**")
    ? <strong key={index}>{part.slice(2, -2)}</strong>
    : <Fragment key={index}>{part}</Fragment>,
);

const ComplaintsPolicy = () => {
  const { t } = useTranslation("complaints");
  const s2List = t("s2List", { returnObjects: true }) as string[];
  const s3List = t("s3List", { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t("metaTitle")} description={t("metaDescription")} />
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("lastUpdated")}{" "}
          {legalVersionDate.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <p className="mt-4 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
          {t("disclaimer")}
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Card><CardContent className="p-4"><Clock className="h-5 w-5 text-primary" /><p className="mt-2 text-xs text-muted-foreground">{t("acknowledgedWithin")}</p><p className="font-display font-semibold">{t("acknowledgedValue")}</p></CardContent></Card>
          <Card><CardContent className="p-4"><FileText className="h-5 w-5 text-primary" /><p className="mt-2 text-xs text-muted-foreground">{t("resolutionTarget")}</p><p className="font-display font-semibold">{t("resolutionValue")}</p></CardContent></Card>
          <Card><CardContent className="p-4"><Mail className="h-5 w-5 text-primary" /><p className="mt-2 text-xs text-muted-foreground">{t("emailUs")}</p><p className="font-display text-sm font-semibold">{legalConfig.email}</p></CardContent></Card>
        </div>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s1Title")}</h2>
            <p className="mt-2">{t("s1Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s2Title")}</h2>
            <p className="mt-2">{t("s2Intro")}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>{t("s2Email")}</strong> <a href={`mailto:${legalConfig.email}`} className="text-primary underline">{legalConfig.email}</a></li>
              <li><strong>{t("s2Phone")}</strong> {legalConfig.phone}</li>
              <li><strong>{t("s2Post")}</strong> {legalConfig.companyName} {legalConfig.legalForm}, {legalConfig.street}, {legalConfig.postcode} {legalConfig.city}</li>
              <li><strong>{t("s2Online")}</strong> {t("s2OnlineValue")} <a href="/contact" className="text-primary underline">{t("s2ContactPage")}</a> {t("s2page")}</li>
            </ul>
            <p className="mt-3">{t("s2Please")}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {s2List.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s3Title")}</h2>
            <ol className="mt-2 list-decimal space-y-2 pl-5">
              {s3List.map((item, i) => <li key={i}>{renderBold(item)}</li>)}
            </ol>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s4Title")}</h2>
            <p className="mt-2">
              {t("s4Intro")}
            </p>

            <div className="mt-4">
              <h3 className="font-display text-sm font-semibold text-foreground">{t("s4TeilnahmeTitle")}</h3>
              <p className="mt-1">{t("s4TeilnahmeBody")}</p>
            </div>

          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s5Title")}</h2>
            <p className="mt-2">{t("s5Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s6Title")}</h2>
            <p className="mt-2">{t("s6Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s7Title")}</h2>
            <p className="mt-2">{t("s7Body")}</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ComplaintsPolicy;
