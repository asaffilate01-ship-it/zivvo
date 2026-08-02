import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useTranslation } from "react-i18next";

const Impressum = () => {
  const { t } = useTranslation("impressum");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t("metaTitle")} description={t("metaDescription")} />
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("lastUpdated")}{" "}
          {new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <p className="mt-4 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
          {t("disclaimer")}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s1Title")}</h2>
            <p className="mt-2">{t("companyName")}</p>
            <p>{t("legalForm")}</p>
            <p>{t("street")}</p>
            <p>{t("cityLine")}</p>
            <p>{t("country")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s2Title")}</h2>
            <p className="mt-2">{t("geschaeftsfuehrer")} {t("geschaeftsfuehrerValue")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s3Title")}</h2>
            <p className="mt-2">{t("phoneLabel")} {t("phoneValue")}</p>
            <p>{t("emailLabel")} {t("emailValue")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s4Title")}</h2>
            <p className="mt-2">{t("registerCourt")} {t("registerCourtValue")}</p>
            <p>{t("registerNumber")} {t("registerNumberValue")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s5Title")}</h2>
            <p className="mt-2">{t("vatBody")}</p>
            <p>{t("vatValue")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s6Title")}</h2>
            <p className="mt-2">{t("s6Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s7Title")}</h2>
            <p className="mt-2">{t("s7Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s8Title")}</h2>
            <p className="mt-2">
              {t("s8Body")}{" "}
              <a href="https://consumer-redress.ec.europa.eu/dispute-resolution-bodies" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                {t("s8LinkText")}
              </a>
            </p>
            <p className="mt-2">{t("s8Body2")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s9Title")}</h2>
            <p className="mt-2">{t("s9Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s10Title")}</h2>
            <p className="mt-2">{t("s10Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s11Title")}</h2>
            <p className="mt-2">{t("s11Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s12Title")}</h2>
            <p className="mt-2">{t("s12Body")}</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Impressum;
