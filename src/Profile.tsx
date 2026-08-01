import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useTranslation } from "react-i18next";
import { Fragment } from "react";
import { legalVersionDate, withLegalIdentity } from "@/lib/legalConfig";

const renderBold = (line: string) => withLegalIdentity(line).split(/(\*\*.*?\*\*)/g).map((part, index) =>
  part.startsWith("**") && part.endsWith("**")
    ? <strong key={index}>{part.slice(2, -2)}</strong>
    : <Fragment key={index}>{part}</Fragment>,
);

const PrivacyPolicy = () => {
  const { t } = useTranslation("privacyPolicy");
  const s2List = t("s2List", { returnObjects: true }) as string[];
  const s3List = t("s3List", { returnObjects: true }) as string[];
  const s4List = t("s4List", { returnObjects: true }) as string[];
  const s5List = t("s5List", { returnObjects: true }) as string[];
  const s7List = t("s7List", { returnObjects: true }) as string[];

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
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {s4List.map((item, i) => <li key={i}>{renderBold(item)}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s5Title")}</h2>
            <p className="mt-2">{t("s5Intro")}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {s5List.map((item, i) => <li key={i}>{renderBold(item)}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s6Title")}</h2>
            <p className="mt-2">{t("s6Body")}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">{t("s7Title")}</h2>
            <p className="mt-2">{t("s7Intro")}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {s7List.map((item, i) => <li key={i}>{renderBold(item)}</li>)}
            </ul>
            <p className="mt-2">{withLegalIdentity(t("s7Footer"))}</p>
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
            <p className="mt-2">{withLegalIdentity(t("s10Body"))}</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
