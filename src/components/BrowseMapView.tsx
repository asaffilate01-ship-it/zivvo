import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Simple geocoding from city names to approximate coordinates
const cityCoords: Record<string, [number, number]> = {
  // UK
  "London": [51.5074, -0.1278], "Manchester": [53.4808, -2.2426], "Birmingham": [52.4862, -1.8904],
  "Leeds": [53.8008, -1.5491], "Glasgow": [55.8642, -4.2518], "Edinburgh": [55.9533, -3.1883],
  "Liverpool": [53.4084, -2.9916], "Bristol": [51.4545, -2.5879], "Sheffield": [53.3811, -1.4701],
  "Newcastle": [54.9783, -1.6178], "Nottingham": [52.9548, -1.1581], "Cardiff": [51.4816, -3.1791],
  // UAE
  "Dubai": [25.2048, 55.2708], "Abu Dhabi": [24.4539, 54.3773], "Sharjah": [25.3463, 55.4209],
  "Ajman": [25.4052, 55.5136], "Al Ain": [24.1917, 55.7606],
  // US
  "New York": [40.7128, -74.0060], "Los Angeles": [34.0522, -118.2437], "Chicago": [41.8781, -87.6298],
  "Houston": [29.7604, -95.3698], "Miami": [25.7617, -80.1918], "San Francisco": [37.7749, -122.4194],
  "Dallas": [32.7767, -96.7970], "Atlanta": [33.749, -84.388], "Boston": [42.3601, -71.0589],
  // PK
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

const defaultCenter: Record<string, [number, number]> = {
  GB: [53.5, -1.5],
  AE: [25.0, 55.2],
  US: [39.8, -98.5],
  PK: [30.3, 69.3],
};

interface BrowseMapViewProps {
  listings: any[];
  country: string;
}

const BrowseMapView = ({ listings, country }: BrowseMapViewProps) => {
  const { config } = useCountry();
  const center = defaultCenter[country] || [51.5, -0.1];
  const zoom = country === "US" ? 4 : country === "PK" ? 5 : 6;

  const markersData = listings
    .map((car) => {
      const coords = getCoords(car.location || "");
      if (!coords) return null;
      // Add slight random offset to prevent exact overlap
      const jitter = () => (Math.random() - 0.5) * 0.02;
      return { ...car, lat: coords[0] + jitter(), lng: coords[1] + jitter() };
    })
    .filter(Boolean) as any[];

  return (
    <div className="h-[500px] w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markersData.map((car) => (
          <Marker key={car.id} position={[car.lat, car.lng]}>
            <Popup>
              <div className="min-w-[180px]">
                {car.images?.[0] && (
                  <img src={car.images[0]} alt={car.title} className="mb-2 h-20 w-full rounded object-cover" />
                )}
                <p className="text-sm font-semibold">{car.title}</p>
                <p className="text-sm font-bold text-primary">{formatPrice(car.price, config)}</p>
                <p className="text-xs text-muted-foreground">{car.location}</p>
                <Link to={`/car/${car.id}`} className="mt-1 block text-xs text-primary hover:underline">
                  View Details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default BrowseMapView;
