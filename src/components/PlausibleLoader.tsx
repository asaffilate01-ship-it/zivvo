import { useEffect } from "react";
import { getConsent } from "@/components/CookieConsent";

// DSGVO/TTDSG-compliant Plausible loader.
// - Only loads after the user grants analytics consent
// - Cookieless by design (no PII, no cross-site tracking)
// - Re-evaluates on consent-change events
//
// Configure via env: VITE_PLAUSIBLE_DOMAIN=zivvo.de (or your live domain)
// Optional:          VITE_PLAUSIBLE_SRC=https://plausible.io/js/script.js

const SCRIPT_ID = "plausible-analytics";

const inject = () => {
  if (document.getElementById(SCRIPT_ID)) return;
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
  const src = (import.meta.env.VITE_PLAUSIBLE_SRC as string | undefined) || "https://plausible.io/js/script.js";
  if (!domain) return;
  const s = document.createElement("script");
  s.id = SCRIPT_ID;
  s.defer = true;
  s.setAttribute("data-domain", domain);
  s.src = src;
  document.head.appendChild(s);
};

const remove = () => {
  document.getElementById(SCRIPT_ID)?.remove();
};

const PlausibleLoader = () => {
  useEffect(() => {
    const evaluate = () => {
      const c = getConsent();
      if (c?.analytics) inject();
      else remove();
    };
    evaluate();
    window.addEventListener("zivvo:consent-change", evaluate);
    return () => window.removeEventListener("zivvo:consent-change", evaluate);
  }, []);
  return null;
};

export default PlausibleLoader;
