import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";


/**
 * Sponsored ad slot — sized to match a CarCard in the results grid.
 *
 * Priority (highest wins):
 *   1. Manual ad passed via props (imageUrl+href, or raw html)
 *   2. Manual ad stored in localStorage under `zivvo_manual_ad`
 *      { imageUrl?: string; href?: string; alt?: string; html?: string }
 *   3. Google AdSense / Media.net via Vite env
 *        VITE_ADSENSE_CLIENT  e.g. "ca-pub-XXXXXXXXXXXXXXXX"
 *        VITE_ADSENSE_SLOT    e.g. "1234567890"
 *   4. Neutral house-ad placeholder
 */
export interface ManualAd {
  imageUrl?: string;
  href?: string;
  alt?: string;
  html?: string;
}

interface SponsoredAdCardProps {
  manualAd?: ManualAd;
}

const readManualAdFromStorage = (): ManualAd | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("zivvo_manual_ad");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ManualAd;
    if (parsed && (parsed.imageUrl || parsed.html)) return parsed;
    return null;
  } catch {
    return null;
  }
};

const SponsoredAdCard = ({ manualAd }: SponsoredAdCardProps) => {
  const { t } = useTranslation();
  const insRef = useRef<HTMLModElement | null>(null);
  const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
  const slot = import.meta.env.VITE_ADSENSE_SLOT as string | undefined;
  const [campaign, setCampaign] = useState<{ id: string; ad: ManualAd } | null>(null);

  // Load a live campaign managed in the admin dashboard (falls back silently)
  useEffect(() => {
    if (manualAd) return;
    let cancelled = false;
    supabase.functions
      .invoke("ad-campaigns", { method: "GET" })
      .then(({ data }) => {
        const c = (data as any)?.campaigns?.[0];
        if (cancelled || !c) return;
        setCampaign({
          id: c.id,
          ad: { imageUrl: c.image_url ?? undefined, href: c.link_url ?? undefined, html: c.html_snippet ?? undefined, alt: c.name },
        });
        supabase.functions.invoke("ad-campaigns", { body: { campaignId: c.id, event: "impression" } }).catch(() => {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [manualAd]);

  const trackClick = () => {
    if (!campaign) return;
    supabase.functions.invoke("ad-campaigns", { body: { campaignId: campaign.id, event: "click" } }).catch(() => {});
  };

  const ad = manualAd ?? campaign?.ad ?? readManualAdFromStorage();
  const hasManual = Boolean(ad && (ad.imageUrl || ad.html));
  const enabled = !hasManual && Boolean(client && slot);


  useEffect(() => {
    if (!enabled) return;
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

      {hasManual && ad ? (
        ad.html ? (
          <div
            className="min-h-[320px] w-full"
            // Manual HTML snippet from admin — treated as trusted operator input.
            dangerouslySetInnerHTML={{ __html: ad.html }}
          />
        ) : ad.href ? (
          <a
            href={ad.href}
            target="_blank"
            rel="noopener sponsored"
            onClick={trackClick}
            className="block h-full min-h-[320px]"
          >
            <img
              src={ad.imageUrl}
              alt={ad.alt ?? "Advertisement"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </a>
        ) : (
          <img
            src={ad.imageUrl}
            alt={ad.alt ?? "Advertisement"}
            className="h-full min-h-[320px] w-full object-cover"
            loading="lazy"
          />
        )
      ) : enabled ? (
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
