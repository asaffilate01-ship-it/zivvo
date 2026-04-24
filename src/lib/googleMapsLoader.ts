/// <reference types="google.maps" />
import { supabase } from "@/integrations/supabase/client";

let googleMapsPromise: Promise<void> | null = null;
let cachedApiKey: string | null = null;

/**
 * Loads the Google Maps JS SDK exactly once across the app.
 * The API key is fetched from the `maps-key` edge function.
 */
export const loadGoogleMaps = async (): Promise<void> => {
  if ((window as any).google?.maps) return;
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = (async () => {
    if (!cachedApiKey) {
      const { data, error } = await supabase.functions.invoke("maps-key");
      if (error || !data?.key) throw new Error("Could not fetch Maps API key");
      cachedApiKey = data.key as string;
    }
    return new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>("script[data-google-maps='1']");
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
        if ((window as any).google?.maps) resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${cachedApiKey}`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = "1";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Maps"));
      document.head.appendChild(script);
    });
  })();

  return googleMapsPromise;
};

export interface GeocodeResult {
  lat: number;
  lng: number;
  formatted?: string;
}

/** Geocode an address string via the `geocode` edge function. */
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
