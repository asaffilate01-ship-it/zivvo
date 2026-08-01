import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import LiveMap, { type LiveMapMarker } from "@/components/LiveMap";

// City fallback for legacy listings without lat/lng
const cityCoords: Record<string, [number, number]> = {
  Berlin: [52.52, 13.405], Hamburg: [53.5511, 9.9937], München: [48.1351, 11.582], Köln: [50.9375, 6.9603],
  Frankfurt: [50.1109, 8.6821], Stuttgart: [48.7758, 9.1829], Düsseldorf: [51.2277, 6.7735], Leipzig: [51.3397, 12.3731],
  Dortmund: [51.5136, 7.4653], Bremen: [53.0793, 8.8017], Dresden: [51.0504, 13.7373], Hannover: [52.3759, 9.732],
};

const getFallbackCoords = (location: string): [number, number] | null => {
  if (!location) return null;
  for (const [city, coords] of Object.entries(cityCoords)) {
    if (location.toLowerCase().includes(city.toLowerCase())) return coords;
  }
  return null;
};

const defaultCenter: Record<string, { lat: number; lng: number }> = {
  DE: { lat: 51.1657, lng: 10.4515 },
};

interface BrowseMapViewProps {
  listings: any[];
  country: string;
}

const BrowseMapView = ({ listings, country }: BrowseMapViewProps) => {
  const { config } = useCountry();
  const center = defaultCenter[country] || defaultCenter.DE;
  const zoom = 6;

  const escape = (s: string) => s.replace(/[<>"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c)
  );

  const markers: LiveMapMarker[] = listings.flatMap((car) => {
    let lat: number | null = null;
    let lng: number | null = null;
    if (typeof car.latitude === "number" && typeof car.longitude === "number") {
      lat = car.latitude;
      lng = car.longitude;
    } else {
      const fb = getFallbackCoords(car.location || "");
      if (fb) {
        // Tiny jitter so multiple cars in same city don't fully overlap
        const jitter = () => (Math.random() - 0.5) * 0.02;
        lat = fb[0] + jitter();
        lng = fb[1] + jitter();
      }
    }
    if (lat === null || lng === null) return [];

    const imgHtml = car.images?.[0]
      ? `<img src="${escape(car.images[0])}" alt="${escape(car.title || "")}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />`
      : "";
    return [{
      id: car.id,
      lat,
      lng,
      title: car.title,
      infoHtml: `
        <div style="min-width:180px;font-family:system-ui,sans-serif;">
          ${imgHtml}
          <p style="font-size:13px;font-weight:600;margin:0 0 4px;">${escape(car.title || "")}</p>
          <p style="font-size:13px;font-weight:700;color:#2563eb;margin:0 0 2px;">${escape(formatPrice(car.price, config))}</p>
          <p style="font-size:11px;color:#666;margin:0 0 6px;">${escape(car.location || "")}</p>
          <a href="/car/${escape(car.id)}" style="font-size:11px;color:#2563eb;text-decoration:none;">View Details →</a>
        </div>
      `,
    }];
  });

  return (
    <LiveMap
      markers={markers}
      fallbackCenter={center}
      fallbackZoom={zoom}
      height="500px"
      showUserLocation
      fitToMarkers={markers.length > 0}
    />
  );
};

export default BrowseMapView;
