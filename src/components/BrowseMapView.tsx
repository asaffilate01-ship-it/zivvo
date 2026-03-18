/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const cityCoords: Record<string, [number, number]> = {
  "London": [51.5074, -0.1278], "Manchester": [53.4808, -2.2426], "Birmingham": [52.4862, -1.8904],
  "Leeds": [53.8008, -1.5491], "Glasgow": [55.8642, -4.2518], "Edinburgh": [55.9533, -3.1883],
  "Liverpool": [53.4084, -2.9916], "Bristol": [51.4545, -2.5879], "Sheffield": [53.3811, -1.4701],
  "Newcastle": [54.9783, -1.6178], "Nottingham": [52.9548, -1.1581], "Cardiff": [51.4816, -3.1791],
  "Dubai": [25.2048, 55.2708], "Abu Dhabi": [24.4539, 54.3773], "Sharjah": [25.3463, 55.4209],
  "Ajman": [25.4052, 55.5136], "Al Ain": [24.1917, 55.7606],
  "New York": [40.7128, -74.0060], "Los Angeles": [34.0522, -118.2437], "Chicago": [41.8781, -87.6298],
  "Houston": [29.7604, -95.3698], "Miami": [25.7617, -80.1918], "San Francisco": [37.7749, -122.4194],
  "Dallas": [32.7767, -96.7970], "Atlanta": [33.749, -84.388], "Boston": [42.3601, -71.0589],
  "Lahore": [31.5204, 74.3587], "Karachi": [24.8607, 67.0011], "Islamabad": [33.6844, 73.0479],
  "Rawalpindi": [33.5651, 73.0169], "Faisalabad": [31.4504, 73.1350], "Peshawar": [34.0151, 71.5249],
};

const getCoords = (location: string): [number, number] | null => {
  if (!location) return null;
  for (const [city, coords] of Object.entries(cityCoords)) {
    if (location.toLowerCase().includes(city.toLowerCase())) return coords;
  }
  return null;
};

const defaultCenter: Record<string, { lat: number; lng: number }> = {
  GB: { lat: 53.5, lng: -1.5 },
  AE: { lat: 25.0, lng: 55.2 },
  US: { lat: 39.8, lng: -98.5 },
  PK: { lat: 30.3, lng: 69.3 },
};

let googleMapsPromise: Promise<void> | null = null;
let cachedApiKey: string | null = null;

const fetchAndLoadGoogleMaps = async (): Promise<void> => {
  if ((window as any).google?.maps) return;
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = (async () => {
    // Fetch the key from edge function
    if (!cachedApiKey) {
      const { data, error } = await supabase.functions.invoke("maps-key");
      if (error || !data?.key) throw new Error("Could not fetch Maps API key");
      cachedApiKey = data.key;
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${cachedApiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Maps"));
      document.head.appendChild(script);
    });
  })();

  return googleMapsPromise;
};

interface BrowseMapViewProps {
  listings: any[];
  country: string;
}

const BrowseMapView = ({ listings, country }: BrowseMapViewProps) => {
  const { config } = useCountry();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const center = defaultCenter[country] || { lat: 51.5, lng: -0.1 };
  const zoom = country === "US" ? 4 : country === "PK" ? 5 : 6;

  useEffect(() => {
    fetchAndLoadGoogleMaps()
      .then(() => setMapLoaded(true))
      .catch(() => setMapError(true));
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;
    const g = (window as any).google;
    mapInstanceRef.current = new g.maps.Map(mapRef.current, {
      center,
      zoom,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
    });
  }, [mapLoaded]);

  useEffect(() => {
    const g = (window as any).google;
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded || !g) return;

    markersRef.current.forEach((m: any) => m.setMap(null));
    markersRef.current = [];

    const infoWindow = new g.maps.InfoWindow();

    listings.forEach((car) => {
      const coords = getCoords(car.location || "");
      if (!coords) return;

      const jitter = () => (Math.random() - 0.5) * 0.02;
      const position = { lat: coords[0] + jitter(), lng: coords[1] + jitter() };

      const marker = new g.maps.Marker({ map, position, title: car.title });

      marker.addListener("click", () => {
        const imgHtml = car.images?.[0]
          ? `<img src="${car.images[0]}" alt="${car.title}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />`
          : "";
        infoWindow.setContent(`
          <div style="min-width:180px;font-family:system-ui,sans-serif;">
            ${imgHtml}
            <p style="font-size:13px;font-weight:600;margin:0 0 4px;">${car.title}</p>
            <p style="font-size:13px;font-weight:700;color:#2563eb;margin:0 0 2px;">${formatPrice(car.price, config)}</p>
            <p style="font-size:11px;color:#666;margin:0 0 6px;">${car.location || ""}</p>
            <a href="/car/${car.id}" style="font-size:11px;color:#2563eb;text-decoration:none;">View Details →</a>
          </div>
        `);
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });
  }, [listings, mapLoaded, config]);

  if (mapError) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center rounded-xl border border-border bg-muted/30">
        <p className="text-sm text-muted-foreground">Map unavailable. Please check your Google Maps API key.</p>
      </div>
    );
  }

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-xl border border-border">
      {!mapLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/50">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
};

export default BrowseMapView;
