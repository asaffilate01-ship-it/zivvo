import { useEffect, useState } from "react";

export interface UserLocation {
  lat: number;
  lng: number;
  source: "gps" | "ip";
  accuracy?: number;
}

const STORAGE_KEY = "zivvo:user-location";
const STORAGE_TTL_MS = 30 * 60 * 1000; // 30 min

const readCache = (): UserLocation | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.location || !parsed?.savedAt) return null;
    if (Date.now() - parsed.savedAt > STORAGE_TTL_MS) return null;
    return parsed.location;
  } catch {
    return null;
  }
};

const writeCache = (loc: UserLocation) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ location: loc, savedAt: Date.now() }));
  } catch { /* ignore */ }
};

const fetchIpLocation = async (): Promise<UserLocation | null> => {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.latitude !== "number" || typeof data.longitude !== "number") return null;
    return { lat: data.latitude, lng: data.longitude, source: "ip" };
  } catch {
    return null;
  }
};

/**
 * Tries browser geolocation (GPS) first; falls back to IP-based lookup.
 * `auto` means resolve on mount. `manual` requires calling `request()`.
 */
export const useUserLocation = (mode: "auto" | "manual" = "auto") => {
  const [location, setLocation] = useState<UserLocation | null>(() => readCache());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const resolve = async () => {
    setLoading(true);
    setError(null);

    const finishWithIp = async () => {
      const ipLoc = await fetchIpLocation();
      if (ipLoc) {
        setLocation(ipLoc);
        writeCache(ipLoc);
      } else {
        setError("Could not determine your location");
      }
      setLoading(false);
    };

    if (!navigator.geolocation) {
      await finishWithIp();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: UserLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "gps",
          accuracy: pos.coords.accuracy,
        };
        setLocation(loc);
        writeCache(loc);
        setLoading(false);
      },
      async (err) => {
        if (err.code === err.PERMISSION_DENIED) setPermissionDenied(true);
        await finishWithIp();
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 5 * 60 * 1000 }
    );
  };

  useEffect(() => {
    if (mode === "auto" && !location) resolve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return { location, loading, error, permissionDenied, request: resolve };
};

/** Haversine — distance in km between two coords */
export const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
