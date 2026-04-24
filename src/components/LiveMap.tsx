/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";
import { useUserLocation, distanceKm } from "@/hooks/useUserLocation";

export interface LiveMapMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  /** HTML content for the info window (sanitised by callers). */
  infoHtml?: string;
}

interface LiveMapProps {
  markers: LiveMapMarker[];
  /** Map center fallback if no user location and no markers. */
  fallbackCenter?: { lat: number; lng: number };
  fallbackZoom?: number;
  height?: string;
  /** When true, asks for user geolocation and shows a "You" pin. */
  showUserLocation?: boolean;
  /** When true, fits bounds to all markers (and user location if shown). */
  fitToMarkers?: boolean;
  /** Called when user clicks a marker. */
  onMarkerClick?: (id: string) => void;
  className?: string;
}

const LiveMap = ({
  markers,
  fallbackCenter = { lat: 53.5, lng: -1.5 },
  fallbackZoom = 6,
  height = "500px",
  showUserLocation = false,
  fitToMarkers = true,
  onMarkerClick,
  className,
}: LiveMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerObjsRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const userCircleRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const { location: userLoc, request: requestUserLoc, loading: locLoading } =
    useUserLocation(showUserLocation ? "auto" : "manual");

  // Load Google Maps once
  useEffect(() => {
    loadGoogleMaps()
      .then(() => setLoaded(true))
      .catch(() => setError(true));
  }, []);

  // Init map
  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstanceRef.current) return;
    const g = (window as any).google;
    mapInstanceRef.current = new g.maps.Map(mapRef.current, {
      center: fallbackCenter,
      zoom: fallbackZoom,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Render markers
  useEffect(() => {
    const g = (window as any).google;
    const map = mapInstanceRef.current;
    if (!map || !loaded || !g) return;

    markerObjsRef.current.forEach((m) => m.setMap(null));
    markerObjsRef.current = [];

    const infoWindow = new g.maps.InfoWindow();
    const bounds = new g.maps.LatLngBounds();
    let hasBounds = false;

    markers.forEach((m) => {
      if (typeof m.lat !== "number" || typeof m.lng !== "number") return;
      const position = { lat: m.lat, lng: m.lng };
      const marker = new g.maps.Marker({ map, position, title: m.title });
      marker.addListener("click", () => {
        if (m.infoHtml) {
          infoWindow.setContent(m.infoHtml);
          infoWindow.open(map, marker);
        }
        onMarkerClick?.(m.id);
      });
      markerObjsRef.current.push(marker);
      bounds.extend(position);
      hasBounds = true;
    });

    if (showUserLocation && userLoc) {
      const userPos = { lat: userLoc.lat, lng: userLoc.lng };
      if (userMarkerRef.current) userMarkerRef.current.setMap(null);
      if (userCircleRef.current) userCircleRef.current.setMap(null);

      userMarkerRef.current = new g.maps.Marker({
        map,
        position: userPos,
        title: "You are here",
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        zIndex: 999,
      });
      userCircleRef.current = new g.maps.Circle({
        map,
        center: userPos,
        radius: userLoc.source === "gps" ? Math.max(userLoc.accuracy || 200, 200) : 5000,
        strokeColor: "#2563eb",
        strokeOpacity: 0.4,
        strokeWeight: 1,
        fillColor: "#2563eb",
        fillOpacity: 0.08,
      });
      bounds.extend(userPos);
      hasBounds = true;
    }

    if (fitToMarkers && hasBounds) {
      map.fitBounds(bounds, 60);
      // If only one point, don't over-zoom
      const listener = g.maps.event.addListenerOnce(map, "bounds_changed", () => {
        if (map.getZoom() > 14) map.setZoom(14);
      });
      // Cleanup not strictly needed; next render replaces markers
      void listener;
    }
  }, [markers, loaded, userLoc, showUserLocation, fitToMarkers, onMarkerClick]);

  if (error) {
    return (
      <div
        className={`flex w-full items-center justify-center rounded-xl border border-border bg-muted/30 ${className ?? ""}`}
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">Map unavailable.</p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-border ${className ?? ""}`}
      style={{ height }}
    >
      {!loaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/50">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" />
      {showUserLocation && !userLoc && loaded && (
        <Button
          size="sm"
          variant="secondary"
          onClick={requestUserLoc}
          disabled={locLoading}
          className="absolute bottom-3 left-3 z-20 shadow-md"
        >
          {locLoading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Navigation className="mr-1 h-3.5 w-3.5" />}
          Use my location
        </Button>
      )}
    </div>
  );
};

export default LiveMap;
export { distanceKm };
