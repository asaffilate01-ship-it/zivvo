// Germany-focused config. We keep the CountryConfig shape so the rest of the
// app (which imports { useCountry, formatPrice, formatDistance }) continues to
// work — but there is now a single active market: DE / EUR.

export type CountryCode = "DE";

export interface IndividualPlan {
  price: number;
  priceId: string;
  label: string;
  /** number of free listings per calendar month before charges apply */
  freePerMonth: number;
  /** max photos per listing on this plan */
  maxPhotos: number;
}

export interface DealerPlan {
  name: string;
  price: number;
  priceId: string;
  maxListings: number;
  maxPhotos: number;
  maxVideos: number;
  trialMonths: number;
  features: string[];
}

export interface CountryConfig {
  code: CountryCode;
  name: string;
  flag: string;
  currency: { symbol: string; code: string; locale: string };
  distanceUnit: "miles" | "km";
  driveSide: "left" | "right";
  makes: string[];
  bodyTypes: string[];
  fuelTypes: string[];
  transmissions: string[];
  popularCities: string[];
  individualPlan: IndividualPlan;
  dealerPlans: DealerPlan[];
  terminology: {
    registration: string;
    mileage: string;
    postcode: string;
    petrol: string;
  };
}

export const countryConfigs: Record<CountryCode, CountryConfig> = {
  DE: {
    code: "DE",
    name: "Deutschland",
    flag: "🇩🇪",
    currency: { symbol: "€", code: "EUR", locale: "de-DE" },
    distanceUnit: "km",
    driveSide: "right",
    // All brands commonly sold / registered in Germany — not only German OEMs.
    makes: [
      // German
      "Audi", "BMW", "Mercedes-Benz", "Volkswagen", "Porsche", "Opel", "Mini", "Smart",
      "Maybach", "Alpina",
      // European
      "Skoda", "Seat", "Cupra", "Peugeot", "Renault", "Citroën", "DS", "Fiat",
      "Alfa Romeo", "Lancia", "Abarth", "Maserati", "Ferrari", "Lamborghini",
      "Volvo", "Polestar", "Dacia", "Bentley", "Rolls-Royce", "Aston Martin",
      "McLaren", "Jaguar", "Land Rover", "MG",
      // Asian
      "Toyota", "Lexus", "Honda", "Nissan", "Infiniti", "Mazda", "Mitsubishi",
      "Subaru", "Suzuki", "Hyundai", "Kia", "Genesis", "SsangYong", "Isuzu",
      "BYD", "Nio", "Great Wall", "GWM Ora", "Aiways", "Maxus",
      // American
      "Ford", "Tesla", "Chevrolet", "Cadillac", "Chrysler", "Dodge", "Jeep",
      "Ram", "GMC", "Lincoln",
    ],
    bodyTypes: [
      "Limousine", "Kombi", "SUV", "Kleinwagen", "Coupé",
      "Cabrio", "Van", "Transporter", "Pickup", "Geländewagen",
    ],
    fuelTypes: [
      "Benzin", "Diesel", "Elektro", "Hybrid", "Plug-in-Hybrid",
      "Erdgas (CNG)", "Autogas (LPG)", "Wasserstoff",
    ],
    transmissions: ["Automatik", "Schaltgetriebe", "Halbautomatik"],
    popularCities: [
      "Berlin", "Hamburg", "München", "Köln", "Frankfurt am Main",
      "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Essen",
      "Bremen", "Dresden", "Hannover", "Nürnberg", "Duisburg",
    ],
    // Private seller: up to 2 free listings per calendar month (10 photos each).
    individualPlan: {
      price: 0,
      priceId: "",
      label: "kostenlos",
      freePerMonth: 2,
      maxPhotos: 10,
    },
    // Dealer: single €49.99/mo plan — up to 30 cars, 15 photos + 2 videos each,
    // 2 months free trial. Cheaper than mobile.de / AutoScout24.
    dealerPlans: [
      {
        name: "Händler",
        price: 49.99,
        priceId: "price_de_dealer_pro",
        maxListings: 30,
        maxPhotos: 15,
        maxVideos: 2,
        trialMonths: 2,
        features: [
          "Bis zu 30 aktive Inserate",
          "15 Fotos pro Fahrzeug",
          "2 Videos pro Fahrzeug",
          "2 Monate kostenlose Testphase",
          "Vollständige Analytik & Berichte",
          "Eigene Händler-Landingpage",
          "Hervorgehobene Platzierungen",
          "Priorisierter Support",
          "Portal-Synchronisation (mobile.de, AutoScout24, Kleinanzeigen)",
          "Finanzierungs-Integration",
          "Verifiziertes Händler-Abzeichen",
        ],
      },
    ],
    terminology: {
      registration: "Kennzeichen",
      mileage: "Kilometerstand",
      postcode: "PLZ",
      petrol: "Benzin",
    },
  },
};

export const formatPrice = (price: number, config: CountryConfig): string => {
  return new Intl.NumberFormat(config.currency.locale, {
    style: "currency",
    currency: config.currency.code,
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
};

export const formatDistance = (value: number, config: CountryConfig): string => {
  return `${value.toLocaleString(config.currency.locale)} ${config.distanceUnit === "miles" ? "mi" : "km"}`;
};

export const getCountryFromCode = (_code: string): CountryCode => "DE";

export const allCountries: CountryCode[] = ["DE"];
