/// <reference types="google.maps" />
import { supabase } from "@/integrations/supabase/client";

let googleMapsPromise: Promise<void> | null = null;

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

/**
 * Loads the Google Maps JS SDK exactly once across the app.
 * Uses the Lovable-managed Google Maps browser key (referrer-restricted, safe to embed).
 */
export const loadGoogleMaps = async (): Promise<void> => {
  if ((window as any).google?.maps) return;
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    if (!BROWSER_KEY) {
      reject(new Error("Google Maps browser key not configured"));
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>("script[data-google-maps='1']");
    if (existing) {
      const check = () => ((window as any).google?.maps ? resolve() : setTimeout(check, 50));
      check();
      return;
    }

    (window as any).__initGoogleMaps = () => resolve();

    const params = new URLSearchParams({
      key: BROWSER_KEY,
      loading: "async",
      callback: "__initGoogleMaps",
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "1";
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

export interface GeocodeResult {
  lat: number;
  lng: number;
  formatted?: string;
}

/** Geocode an address string via the `geocode` edge function (routed through Lovable's Maps gateway). */
export const geocodeAddress = async (
  address: string,
  country?: string
): Promise<GeocodeResult | null> => {
  if (!address?.trim()) return null;
  try {
    const { data, error } = await supabase.functions.invoke("geocode", {
      body: { address, country },
    });
    if (error || !data?.found) return null;
    return { lat: data.lat, lng: data.lng, formatted: data.formatted };
  } catch {
    return null;
  }
};
