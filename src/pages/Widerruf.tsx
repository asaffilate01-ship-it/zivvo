import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useTranslation } from "react-i18next";

const Widerruf = () => {
  const { t } = useTranslation("widerruf");
  const formBody = t("formBody", { returnObjects: true }) as string[];

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
            <h2 className="font-display text-lg font-semibold text-foreground">{t("scopeTitle")}</h2>
            <p className="mt-2">{t("scopeBody")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s1Title")}</h2>
            <p className="mt-2">{t("s1Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s2Title")}</h2>
            <p className="mt-2">{t("s2Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s3Title")}</h2>
            <p className="mt-2">{t("s3Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s4Title")}</h2>
            <p className="mt-2">{t("s4Body")}</p>
          </section>

          <section className="rounded-lg border border-border bg-muted/30 p-4">
            <h2 className="font-display text-lg font-semibold text-foreground">{t("formTitle")}</h2>
            <p className="mt-2">{t("formIntro")}</p>
            <p className="mt-2">{t("formTo")}</p>
            <ul className="mt-3 space-y-2">
              {formBody.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Widerruf;
