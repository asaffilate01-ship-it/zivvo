import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useTranslation } from "react-i18next";

const GDPR = () => {
  const { t } = useTranslation("gdpr");
  const s2List = t("s2List", { returnObjects: true }) as string[];
  const s3List = t("s3List", { returnObjects: true }) as string[];
  const s5List = t("s5List", { returnObjects: true }) as string[];

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
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {s2List.map((item, i) => <li key={i}>{renderBold(item)}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s3Title")}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {s3List.map((item, i) => <li key={i}>{renderBold(item)}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s4Title")}</h2>
            <p className="mt-2">
              {t("s4Body", { email: "privacy@zivvo.co.uk", days: t("s4Days") }).split("privacy@zivvo.co.uk").map((part, i, arr) => (
                <span key={i} dangerouslySetInnerHTML={{ __html: i < arr.length - 1 ? part : part.replace(t("s4Days"), `<strong>${t("s4Days")}</strong>`) }}>
                </span>
              )).reduce((acc: React.ReactNode[], el, i, arr) => {
                acc.push(el);
                if (i < arr.length - 1) {
                  acc.push(<a key={`link-${i}`} href="mailto:privacy@zivvo.co.uk" className="text-primary underline">privacy@zivvo.co.uk</a>);
                }
                return acc;
              }, [])}
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s5Title")}</h2>
            <p className="mt-2">{t("s5Intro")}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {s5List.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
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
            <p className="mt-2">{t("s8Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s9Title")}</h2>
            <p className="mt-2">
              {t("s9Body")}{" "}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                ico.org.uk
              </a>{" "}
              · 0303 123 1113.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s10Title")}</h2>
            <p className="mt-2">
              {t("s10Body")}{" "}
              <a href="mailto:dpo@zivvo.co.uk" className="text-primary underline">dpo@zivvo.co.uk</a>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GDPR;
