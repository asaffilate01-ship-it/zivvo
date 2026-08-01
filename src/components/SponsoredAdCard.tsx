import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { getConsent } from "@/components/CookieConsent";
import { supabase } from "@/integrations/supabase/client";

export interface ManualAd { imageUrl?: string; href?: string; alt?: string; }
interface SponsoredAdCardProps { manualAd?: ManualAd; }

const SponsoredAdCard = ({ manualAd }: SponsoredAdCardProps) => {
  const { t } = useTranslation();
  const insRef = useRef<HTMLModElement | null>(null);
  const [campaign, setCampaign] = useState<ManualAd | null>(manualAd || null);
  const [marketingAllowed, setMarketingAllowed] = useState(Boolean(manualAd));
  const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
  const slot = import.meta.env.VITE_ADSENSE_SLOT as string | undefined;

  useEffect(() => {
    if (manualAd) { setCampaign(manualAd); setMarketingAllowed(true); return; }
    let cancelled = false;
    const evaluate = async () => {
      const allowed = Boolean(getConsent()?.marketing);
      setMarketingAllowed(allowed);
      if (!allowed) { setCampaign(null); return; }
      const { data } = await supabase.from("ad_campaigns_public" as any).select("name,creative_url,destination_path").limit(1).maybeSingle();
      if (!cancelled) setCampaign(data ? { imageUrl: (data as any).creative_url, href: (data as any).destination_path, alt: (data as any).name } : null);
    };
    void evaluate();
    window.addEventListener("zivvo:consent-change", evaluate);
    return () => { cancelled = true; window.removeEventListener("zivvo:consent-change", evaluate); };
  }, [manualAd]);

  const adsenseEnabled = marketingAllowed && !campaign && Boolean(client && slot);
  useEffect(() => {
    if (!adsenseEnabled) return;
    const id = "adsbygoogle-js";
    if (!document.getElementById(id)) {
      const script = document.createElement("script"); script.id = id; script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      script.crossOrigin = "anonymous"; document.head.appendChild(script);
    }
    try { (window as any).adsbygoogle = (window as any).adsbygoogle || []; (window as any).adsbygoogle.push({}); } catch { /* no-op */ }
  }, [adsenseEnabled, client]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-border bg-card/60 backdrop-blur-sm">
      <Badge variant="outline" className="absolute right-2 top-2 z-10 text-[10px] uppercase tracking-wide">{t("browse.sponsored", "Anzeige")}</Badge>
      {campaign?.imageUrl ? (
        campaign.href ? <a href={campaign.href} className="block h-full min-h-[320px]" rel="sponsored"><img src={campaign.imageUrl} alt={campaign.alt || "Anzeige"} className="h-full w-full object-cover" loading="lazy" /></a>
          : <img src={campaign.imageUrl} alt={campaign.alt || "Anzeige"} className="h-full min-h-[320px] w-full object-cover" loading="lazy" />
      ) : adsenseEnabled ? (
        <ins ref={insRef as any} className="adsbygoogle block" style={{ display: "block", minHeight: 320 }} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
      ) : (
        <button type="button" onClick={() => window.dispatchEvent(new Event("zivvo:open-consent"))} className="flex h-full min-h-[320px] w-full flex-col items-center justify-center gap-2 p-6 text-center">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("browse.adSlotLabel", "Werbefläche")}</span>
          <span className="text-sm text-muted-foreground">{marketingAllowed ? t("browse.adSlotDescription", "Hier könnte Ihre Anzeige erscheinen.") : "Marketing-Inhalte sind deaktiviert. Einstellungen ändern"}</span>
        </button>
      )}
    </div>
  );
};

export default SponsoredAdCard;
