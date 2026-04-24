import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import LiveMap, { type LiveMapMarker } from "@/components/LiveMap";

// City fallback for legacy listings without lat/lng
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

const getFallbackCoords = (location: string): [number, number] | null => {
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

interface BrowseMapViewProps {
  listings: any[];
  country: string;
}

const BrowseMapView = ({ listings, country }: BrowseMapViewProps) => {
  const { config } = useCountry();
  const center = defaultCenter[country] || { lat: 51.5, lng: -0.1 };
  const zoom = country === "US" ? 4 : country === "PK" ? 5 : 6;

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
