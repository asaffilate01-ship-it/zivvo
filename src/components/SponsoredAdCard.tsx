import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

/**
 * Sponsored ad slot — sized to match a CarCard in the results grid.
 * Renders Google AdSense (or Media.net) if a slot ID env var is configured;
 * otherwise falls back to a neutral house-ad placeholder so layout is stable.
 *
 * Configure via Vite env:
 *   VITE_ADSENSE_CLIENT   e.g. "ca-pub-XXXXXXXXXXXXXXXX"
 *   VITE_ADSENSE_SLOT     e.g. "1234567890"
 */
const SponsoredAdCard = () => {
  const { t } = useTranslation();
  const insRef = useRef<HTMLModElement | null>(null);
  const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
  const slot = import.meta.env.VITE_ADSENSE_SLOT as string | undefined;
  const enabled = Boolean(client && slot);

  useEffect(() => {
    if (!enabled) return;
    // Inject AdSense loader once
    const id = "adsbygoogle-js";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.async = true;
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    try {
      // @ts-expect-error adsbygoogle is injected by external script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore
    }
  }, [enabled, client]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-border bg-card/60 backdrop-blur-sm">
      <Badge
        variant="outline"
        className="absolute right-2 top-2 z-10 text-[10px] uppercase tracking-wide"
      >
        {t("browse.sponsored", "Sponsored")}
      </Badge>
      {enabled ? (
        <ins
          ref={insRef as any}
          className="adsbygoogle block"
          style={{ display: "block", minHeight: 320 }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 p-6 text-center">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("browse.adSlotLabel", "Advertisement")}
          </div>
          <p className="text-sm text-muted-foreground">
            {t(
              "browse.adSlotDescription",
              "Your ad here — reach thousands of active car buyers.",
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default SponsoredAdCard;
