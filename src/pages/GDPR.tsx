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
        <p className="mt-4 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
          {t("disclaimer")}
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
              {t("s4Body").split("privacy@zivvo.de").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <a href="mailto:privacy@zivvo.de" className="text-primary underline">privacy@zivvo.de</a>
                  )}
                </span>
              ))}
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
            <p className="mt-2">{t("s9Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s10Title")}</h2>
            <p className="mt-2">
              {t("s10Body")}{" "}
              <a href="mailto:dpo@zivvo.de" className="text-primary underline">dpo@zivvo.de</a>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GDPR;
