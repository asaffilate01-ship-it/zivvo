import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Accessibility, FileCheck2, ShieldCheck } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import zivvoLogoEn from "@/assets/zivvo-logo.png";
import zivvoLogoDe from "@/assets/zivvo-logo-de.png";
import { legalCompanyLine } from "@/lib/legalConfig";

const Footer = () => {
  const { t, i18n } = useTranslation();
  const zivvoLogo = i18n.language?.startsWith("de") ? zivvoLogoDe : zivvoLogoEn;

  const footerSections = [
    {
      title: t("footer.sections.marketplace"),
      links: [
        { label: t("footer.links.browseCars"), to: "/browse" },
        { label: t("footer.links.sellYourCar"), to: "/sell" },
        { label: t("footer.links.savedCars"), to: "/saved" },
        { label: t("footer.links.compareCars"), to: "/compare" },
        { label: t("footer.links.blogGuides"), to: "/blog" },
      ],
    },
    {
      title: t("footer.sections.business"),
      links: [
        { label: t("footer.links.dealerPlans"), to: "/dealers" },
        { label: t("footer.links.tradeStock"), to: "/trade-stock" },
        { label: t("footer.links.financing"), to: "/finance" },
        { label: "Leasing", to: "/leasing" },
        { label: t("footer.links.dealerDashboard"), to: "/dashboard" },
      ],
    },
    {
      title: t("footer.sections.company"),
      links: [
        { label: t("footer.links.helpCentre"), to: "/help" },
        { label: t("footer.links.contactUs"), to: "/contact" },
        { label: t("footer.links.complaints"), to: "/complaints" },
        { label: t("footer.links.accessibility"), to: "/accessibility" },
      ],
    },
    {
      title: t("footer.sections.legal"),
      links: [
        { label: t("footer.links.privacyPolicy"), to: "/privacy" },
        { label: t("footer.links.terms"), to: "/terms" },
        { label: t("footer.links.cookiePolicy"), to: "/cookies" },
        { label: t("footer.links.gdpr"), to: "/gdpr" },
        { label: t("footer.links.impressum"), to: "/impressum" },
        { label: t("footer.links.widerruf"), to: "/widerruf" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-6">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5" aria-label="Zivvo">
              <img src={zivvoLogo} alt={`Zivvo — ${t("brand.tagline")}`} loading="lazy" decoding="async" className="h-10 w-auto dark:invert dark:brightness-0 dark:contrast-200" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
            <p className="mt-3 whitespace-pre-line text-xs text-muted-foreground">
              {legalCompanyLine(i18n.language)}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <Link to="/privacy" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("footer.links.privacyPolicy")}
              </Link>
              <Link to="/accessibility" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                <Accessibility className="h-3.5 w-3.5" />
                {t("footer.links.accessibility")}
              </Link>
              <Link to="/complaints" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                <FileCheck2 className="h-3.5 w-3.5" />
                {t("footer.links.complaints")}
              </Link>
            </div>
          </div>


          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-display text-sm font-semibold text-foreground">{section.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>

          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="full" />
            <div className="flex gap-6">
              <Link to="/privacy" className="text-xs text-muted-foreground transition-colors hover:text-primary">
                {t("footer.links.privacy")}
              </Link>
              <Link to="/terms" className="text-xs text-muted-foreground transition-colors hover:text-primary">
                {t("footer.links.terms")}
              </Link>
              <Link to="/cookies" className="text-xs text-muted-foreground transition-colors hover:text-primary">
                {t("footer.links.cookies")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
