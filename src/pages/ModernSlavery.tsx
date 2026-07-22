import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useTranslation } from "react-i18next";

const ModernSlavery = () => {
  const { t } = useTranslation("modernSlavery");
  const s3List = t("s3List", { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t("metaTitle")} description={t("metaDescription")} />
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("subtitle")}{" "}
          {new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
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
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {s3List.map((item, i) => {
                if (item.includes("{{email}}")) {
                  const parts = item.split("{{email}}");
                  return (
                    <li key={i}>
                      {parts[0]}
                      <a href="mailto:ethics@zivvo.co.uk" className="text-primary underline">ethics@zivvo.co.uk</a>
                      {parts[1]}
                    </li>
                  );
                }
                return <li key={i}>{item}</li>;
              })}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s4Title")}</h2>
            <p className="mt-2">
              {t("s4Body").split("{{email}}")[0]}
              <a href="mailto:ethics@zivvo.co.uk" className="text-primary underline">ethics@zivvo.co.uk</a>
              {t("s4Body").split("{{email}}")[1]?.split("{{phone}}")[0]}
              <strong>{t("s4Phone")}</strong>
              {t("s4Body").split("{{phone}}")[1]}
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ModernSlavery;
