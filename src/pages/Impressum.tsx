import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useTranslation } from "react-i18next";
import { legalConfig, legalIdentityConfigured, legalVersionDate } from "@/lib/legalConfig";

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
          {legalVersionDate.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        {!legalIdentityConfigured && (
          <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Nicht veröffentlichen: Die rechtlichen Unternehmensangaben für diese Umgebung fehlen.
          </p>
        )}

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s1Title")}</h2>
            <p className="mt-2">{legalConfig.companyName} {legalConfig.legalForm}</p>
            <p>{legalConfig.street}</p>
            <p>{legalConfig.postcode} {legalConfig.city}</p>
            <p>{t("country")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s2Title")}</h2>
            <p className="mt-2">{t("geschaeftsfuehrer")} {legalConfig.managingDirector}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s3Title")}</h2>
            <p className="mt-2">{t("phoneLabel")} <a className="text-primary underline" href={`tel:${legalConfig.phone}`}>{legalConfig.phone}</a></p>
            <p>{t("emailLabel")} <a className="text-primary underline" href={`mailto:${legalConfig.email}`}>{legalConfig.email}</a></p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s4Title")}</h2>
            <p className="mt-2">{t("registerCourt")} {legalConfig.registerCourt}</p>
            <p>{t("registerNumber")} {legalConfig.registerNumber}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s5Title")}</h2>
            <p className="mt-2">{t("vatBody")}</p>
            <p>{legalConfig.vatId}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">Verantwortlich für journalistisch-redaktionelle Inhalte gemäß § 18 Abs. 2 MStV</h2>
            <p className="mt-2">{legalConfig.contentResponsible}</p>
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
