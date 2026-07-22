import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useTranslation } from "react-i18next";

const Accessibility = () => {
  const { t } = useTranslation("accessibility");
  const whatWeDo = t("whatWeDo", { returnObjects: true }) as string[];

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
            <h2 className="font-display text-lg font-semibold text-foreground">{t("commitmentTitle")}</h2>
            <p className="mt-2" dangerouslySetInnerHTML={{ __html: t("commitmentBody", { wcag: `<strong>${t("wcagStandard")}</strong>` }) }} />
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("whatWeDoTitle")}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {whatWeDo.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("limitationsTitle")}</h2>
            <p className="mt-2">{t("limitationsBody")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("reportingTitle")}</h2>
            <p className="mt-2">
              {t("reportingBody", { email: "accessibility@zivvo.co.uk" }).split("accessibility@zivvo.co.uk").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <a href="mailto:accessibility@zivvo.co.uk" className="text-primary underline">accessibility@zivvo.co.uk</a>
                  )}
                </span>
              ))}
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("enforcementTitle")}</h2>
            <p className="mt-2">
              {t("enforcementBody")}{" "}
              <a href="https://www.equalityadvisoryservice.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                equalityadvisoryservice.com
              </a>
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Accessibility;
