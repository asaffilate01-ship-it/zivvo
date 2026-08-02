import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (target: string | HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();
const SCRIPT_ID = "zivvo-turnstile-script";

export const captchaEnabled = Boolean(SITE_KEY);

const loadTurnstile = () => new Promise<void>((resolve, reject) => {
  if (window.turnstile) { resolve(); return; }
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    existing.addEventListener("load", () => resolve(), { once: true });
    existing.addEventListener("error", () => reject(new Error("Turnstile could not load")), { once: true });
    return;
  }
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async = true;
  script.defer = true;
  script.onload = () => resolve();
  script.onerror = () => reject(new Error("Turnstile could not load"));
  document.head.appendChild(script);
});

const Turnstile = ({ onTokenChange, action }: { onTokenChange: (token: string | null) => void; action: string }) => {
  const reactId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;
    let active = true;
    void loadTurnstile().then(() => {
      if (!active || !window.turnstile || !containerRef.current) return;
      widgetRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        action,
        theme: "auto",
        language: "auto",
        callback: (token: string) => onTokenChange(token),
        "expired-callback": () => onTokenChange(null),
        "error-callback": () => onTokenChange(null),
      });
    }).catch(() => onTokenChange(null));
    return () => {
      active = false;
      if (widgetRef.current && window.turnstile) window.turnstile.remove(widgetRef.current);
    };
  }, [action, onTokenChange, reactId]);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} id={`turnstile-${reactId}`} className="min-h-[65px]" aria-label="Sicherheitsprüfung" />;
};

export default Turnstile;
