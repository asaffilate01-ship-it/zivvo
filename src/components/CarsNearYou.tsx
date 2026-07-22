import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, MapPin, Loader2, Navigation, AlertCircle } from "lucide-react";
import CarCard from "@/components/CarCard";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/contexts/CountryContext";


// City coordinates for distance calculation
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
  "Phoenix": [33.4484, -112.0740], "Denver": [39.7392, -104.9903], "San Antonio": [29.4241, -98.4936],
  "Lahore": [31.5204, 74.3587], "Karachi": [24.8607, 67.0011], "Islamabad": [33.6844, 73.0479],
  "Rawalpindi": [33.5651, 73.0169], "Faisalabad": [31.4504, 73.1350], "Peshawar": [34.0151, 71.5249],
  "Multan": [30.1575, 71.5249], "Quetta": [30.1798, 66.9750], "Sialkot": [32.4945, 74.5229],
};

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getCityCoords = (location: string): [number, number] | null => {
  if (!location) return null;
  for (const [city, coords] of Object.entries(cityCoords)) {
    if (location.toLowerCase().includes(city.toLowerCase())) return coords;
  }
  return null;
};

const radiusOptions = [
  { value: "5", label: "5 miles" },
  { value: "10", label: "10 miles" },
  { value: "25", label: "25 miles" },
  { value: "50", label: "50 miles" },
  { value: "100", label: "100 miles" },
  { value: "national", label: "Nationwide" },
];

const reverseGeocodeGoogle = async (lat: number, lng: number): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke("reverse-geocode", {
      body: { lat, lng },
    });
    if (error) throw error;
    return data?.city || "your area";
  } catch {
    return "your area";
  }
};

const CarsNearYou = () => {
  const { country, config } = useCountry();
  const { t } = useTranslation();
  const [cars, setCars] = useState<any[]>([]);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [geoStatus, setGeoStatus] = useState<"prompt" | "loading" | "granted" | "denied">("loading");
  const [radius, setRadius] = useState("25");


  // Try to get GPS location
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords([latitude, longitude]);
        setGeoStatus("granted");
        const city = await reverseGeocodeGoogle(latitude, longitude);
        setLocationName(city);
      },
      () => {
        setGeoStatus("denied");
        const fallbackCities: Record<string, string> = {
          GB: "London", US: "New York", PK: "Lahore", AE: "Dubai",
        };
        setLocationName(fallbackCities[country] || "your area");
        const fallbackCoords: Record<string, [number, number]> = {
          GB: [51.5074, -0.1278], US: [40.7128, -74.0060], PK: [31.5204, 74.3587], AE: [25.2048, 55.2708],
        };
        setUserCoords(fallbackCoords[country] || null);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, [country]);

  // Fetch and filter cars by distance
  const fetchNearby = useCallback(async () => {
    if (!userCoords) return;
    setLoading(true);

    const { data } = await supabase
      .from("car_listings")
      .select("*")
      .eq("status", "active")
      .eq("country", country)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!data) {
      setCars([]);
      setLoading(false);
      return;
    }

    if (radius === "national") {
      setCars(data.slice(0, 8));
    } else {
      const maxDist = parseInt(radius);
      const distUnit = config.distanceUnit;
      const multiplier = distUnit === "km" ? 1.60934 : 1;

      const withDistance = data
        .map((car) => {
          const coords = getCityCoords(car.location || "");
          if (!coords) return null;
          const dist = haversineDistance(userCoords[0], userCoords[1], coords[0], coords[1]);
          const displayDist = distUnit === "km" ? dist * 1.60934 : dist;
          return { ...car, _distance: dist, _displayDistance: Math.round(displayDist) };
        })
        .filter(Boolean)
        .filter((car: any) => car._distance <= maxDist * multiplier)
        .sort((a: any, b: any) => a._distance - b._distance)
        .slice(0, 8);

      setCars(withDistance);
    }
    setLoading(false);
  }, [userCoords, country, radius, config.distanceUnit]);

  useEffect(() => {
    if (userCoords) fetchNearby();
  }, [fetchNearby, userCoords]);

  const requestLocation = () => {
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setUserCoords([position.coords.latitude, position.coords.longitude]);
        setGeoStatus("granted");
        const city = await reverseGeocodeGoogle(position.coords.latitude, position.coords.longitude);
        setLocationName(city);
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!loading && cars.length === 0 && geoStatus !== "prompt") return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 text-xs">
              <MapPin className="mr-1 h-3 w-3" /> {t("home.near.badge")}
            </Badge>
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              {locationName
                ? t("home.near.title", { location: locationName })
                : t("home.near.titleFallback")}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {geoStatus === "granted"
                ? radius === "national"
                  ? t("home.near.showingNationwide")
                  : t("home.near.showingWithin", { radius, unit: config.distanceUnit })
                : t("home.near.browsePrompt")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={radius} onValueChange={setRadius}>
              <SelectTrigger className="h-9 w-[140px] text-sm">
                <SelectValue placeholder={t("home.near.distance")} />
              </SelectTrigger>
              <SelectContent>
                {radiusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.value === "national" ? t("home.near.nationwide") : `${opt.value} ${config.distanceUnit}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {geoStatus === "denied" && (
              <Button variant="outline" size="sm" onClick={requestLocation} className="gap-1 text-xs">
                <Navigation className="h-3 w-3" /> {t("home.near.enableGps")}
              </Button>
            )}

            <Link to="/browse">
              <Button variant="ghost" size="sm" className="text-primary">
                {t("home.near.viewAll")} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {geoStatus === "denied" && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{t("home.near.locationDenied", { location: locationName || "" })} <button onClick={requestLocation} className="font-medium text-primary hover:underline">{t("home.near.tryAgain")}</button></span>
          </div>
        )}
      </motion.div>

      <div className="mt-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : cars.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-12 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">{t("home.near.empty", { radius, unit: config.distanceUnit })}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setRadius("national")}>
              {t("home.near.searchNationwide")}
            </Button>
          </div>

        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cars.map((car, i) => (
              <div key={car.id} className="relative">
                <CarCard car={car} index={i} />
                {car._displayDistance != null && (
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
                    <MapPin className="h-3 w-3" /> {car._displayDistance} {config.distanceUnit}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CarsNearYou;
