import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useTranslation } from "react-i18next";
import { publicContactConfig } from "@/lib/legalConfig";

const CookiePolicy = () => {
  const { t } = useTranslation("cookiePolicy");
  const s4List = t("s4List", { returnObjects: true }) as string[];

  const renderBold = (line: string) => (
    <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
  );

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

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s1Title")}</h2>
            <p className="mt-2">{t("s1Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s2Title")}</h2>
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-foreground">{t("tableCategory")}</th>
                    <th className="px-3 py-2 text-foreground">{t("tablePurpose")}</th>
                    <th className="px-3 py-2 text-foreground">{t("tableLifetime")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2 font-semibold text-foreground">{t("rowNecessary")}</td>
                    <td className="px-3 py-2">{t("rowNecessaryPurpose")}</td>
                    <td className="px-3 py-2">{t("rowNecessaryLifetime")}</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2 font-semibold text-foreground">{t("rowFunctional")}</td>
                    <td className="px-3 py-2">{t("rowFunctionalPurpose")}</td>
                    <td className="px-3 py-2">{t("rowFunctionalLifetime")}</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2 font-semibold text-foreground">{t("rowAnalytics")}</td>
                    <td className="px-3 py-2">{t("rowAnalyticsPurpose")}</td>
                    <td className="px-3 py-2">{t("rowAnalyticsLifetime")}</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2 font-semibold text-foreground">{t("rowMarketing")}</td>
                    <td className="px-3 py-2">{t("rowMarketingPurpose")}</td>
                    <td className="px-3 py-2">{t("rowMarketingLifetime")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s3Title")}</h2>
            <p className="mt-2">{t("s3Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s4Title")}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {s4List.map((item, i) => <li key={i}>{renderBold(item)}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s5Title")}</h2>
            <p className="mt-2">
              {t("s5Body")}{" "}
              <a href={`mailto:${publicContactConfig.privacyEmail}`} className="text-primary underline">
                {publicContactConfig.privacyEmail}
              </a>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
