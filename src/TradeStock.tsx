import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useTranslation } from "react-i18next";
import { legalVersionDate, withLegalIdentity } from "@/lib/legalConfig";

const TermsOfService = () => {
  const { t } = useTranslation("terms");
  const s2List = t("s2List", { returnObjects: true }) as string[];
  const s3List = t("s3List", { returnObjects: true }) as string[];
  const s5List = t("s5List", { returnObjects: true }) as string[];
  const s6List = t("s6List", { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t("metaTitle")} description={t("metaDescription")} />
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("lastUpdated")} {legalVersionDate.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s1Title")}</h2>
            <p className="mt-2">{withLegalIdentity(t("s1Body"))}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s2Title")}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {s2List.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s3Title")}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {s3List.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s4Title")}</h2>
            <p className="mt-2">{t("s4Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s5Title")}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {s5List.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s6Title")}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {s6List.map((item, i) => <li key={i}>{withLegalIdentity(item)}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s7Title")}</h2>
            <p className="mt-2">{t("s7Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s8Title")}</h2>
            <p className="mt-2">{withLegalIdentity(t("s8Body"))}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s9Title")}</h2>
            <p className="mt-2">{t("s9Body")}</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfService;
