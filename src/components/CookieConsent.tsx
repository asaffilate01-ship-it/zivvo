import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { Shield, X, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

// TTDSG-compliant consent. Non-essential scripts (analytics, marketing) MUST NOT
// load before the user opts in. We expose a global `window.__zivvoConsent` that
// script loaders can gate on, and dispatch `zivvo:consent-change` on updates.

const CONSENT_KEY = "zivvo_cookie_consent_v2";

export type ConsentState = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

declare global {
  interface Window {
    __zivvoConsent?: ConsentState;
  }
}

const applyConsent = (c: ConsentState) => {
  window.__zivvoConsent = c;
  localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
  window.dispatchEvent(new CustomEvent("zivvo:consent-change", { detail: c }));
};

export const getConsent = (): ConsentState | null => {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as ConsentState) : null;
  } catch {
    return null;
  }
};

const CookieConsent = () => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = getConsent();
    if (existing) {
      window.__zivvoConsent = existing;
      return;
    }
    const timer = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const save = (a: boolean, m: boolean) => {
    applyConsent({
      essential: true,
      analytics: a,
      marketing: m,
      timestamp: new Date().toISOString(),
    });
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          role="dialog"
          aria-label={t("cookie.title")}
          className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-card p-4 shadow-elevated md:bottom-4 md:left-4 md:right-auto md:max-w-md md:rounded-xl md:border"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-card-foreground">{t("cookie.title")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("cookie.body")}{" "}
                <Link to="/privacy" className="text-primary underline">{t("cookie.privacy")}</Link>
                {" · "}
                <Link to="/cookies" className="text-primary underline">{t("cookie.settings", "Cookie-Einstellungen")}</Link>
              </p>

              {customize && (
                <div className="mt-3 space-y-2 rounded-lg border border-border/60 bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">{t("cookie.essential", "Essenziell")}</p>
                      <p className="text-[10px] text-muted-foreground">{t("cookie.essentialDesc", "Immer aktiv")}</p>
                    </div>
                    <Switch checked disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">{t("cookie.analytics", "Analyse")}</p>
                      <p className="text-[10px] text-muted-foreground">{t("cookie.analyticsDesc", "Anonyme Nutzungsstatistik")}</p>
                    </div>
                    <Switch checked={analytics} onCheckedChange={setAnalytics} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">{t("cookie.marketing", "Marketing")}</p>
                      <p className="text-[10px] text-muted-foreground">{t("cookie.marketingDesc", "Personalisierte Werbung")}</p>
                    </div>
                    <Switch checked={marketing} onCheckedChange={setMarketing} />
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => save(true, true)} className="gradient-primary border-0 text-xs">
                  {t("cookie.acceptAll")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => save(false, false)} className="text-xs">
                  {t("cookie.essential")}
                </Button>
                {customize ? (
                  <Button size="sm" variant="secondary" onClick={() => save(analytics, marketing)} className="text-xs">
                    {t("cookie.saveChoice", "Auswahl speichern")}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCustomize(true)}
                    className="text-xs"
                  >
                    <Settings2 className="mr-1 h-3 w-3" />
                    {t("cookie.customize", "Anpassen")}
                  </Button>
                )}
              </div>
            </div>
            <button onClick={() => save(false, false)} aria-label="close" className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
