import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "zv_session_id";

const getSessionId = () => {
  try {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return null;
  }
};

const getDevice = () => {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
};

const getUtm = () => {
  try {
    const p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get("utm_source"),
      utm_medium: p.get("utm_medium"),
      utm_campaign: p.get("utm_campaign"),
    };
  } catch {
    return { utm_source: null, utm_medium: null, utm_campaign: null };
  }
};

/**
 * First-party analytics: records each route change to public.page_views.
 * Privacy-friendly — no cookies, no third-party trackers, session ID is
 * stored only in sessionStorage (cleared when tab closes).
 */
export const useAnalytics = () => {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname + location.search;
    if (lastPath.current === path) return;
    lastPath.current = path;

    // Skip admin/internal routes from analytics
    if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/dealer-dashboard")) {
      return;
    }

    const session_id = getSessionId();
    const device = getDevice();
    const utm = getUtm();
    const referrer = document.referrer && !document.referrer.includes(window.location.host) ? document.referrer : null;

    supabase.auth.getUser().then(({ data }) => {
      const user_id = data.user?.id ?? null;
      void (supabase.from("page_views") as any).insert({
        path: path.slice(0, 500),
        referrer: referrer?.slice(0, 500) ?? null,
        user_id,
        session_id,
        device,
        utm_source: utm.utm_source?.slice(0, 100) ?? null,
        utm_medium: utm.utm_medium?.slice(0, 100) ?? null,
        utm_campaign: utm.utm_campaign?.slice(0, 100) ?? null,
      });
    });
  }, [location.pathname, location.search]);
};

/**
 * Fire a conversion event (signup, listing_created, enquiry_sent, etc.)
 */
export const trackEvent = async (
  event_name: string,
  metadata: Record<string, unknown> = {}
) => {
  try {
    const session_id = getSessionId();
    const { data } = await supabase.auth.getUser();
    await (supabase.from("analytics_events") as any).insert({
      event_name: event_name.slice(0, 100),
      user_id: data.user?.id ?? null,
      session_id,
      path: window.location.pathname.slice(0, 500),
      metadata,
    });
  } catch {
    // analytics never break the app
  }
};
