export type CountryCode = "GB" | "US" | "PK" | "AE";

export interface IndividualPlan {
  price: number;
  priceId: string;
  label: string;
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
  dealerPlans: { name: string; price: number; priceId: string; maxListings: number; features: string[] }[];
  terminology: {
    registration: string;
    mileage: string;
    postcode: string;
    petrol: string;
  };
}

const sharedFuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid"];
const sharedTransmissions = ["Automatic", "Manual"];

export const countryConfigs: Record<CountryCode, CountryConfig> = {
  GB: {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    currency: { symbol: "£", code: "GBP", locale: "en-GB" },
    distanceUnit: "miles",
    driveSide: "left",
    makes: [
      "Audi", "BMW", "Citroën", "Ford", "Honda", "Hyundai", "Jaguar",
      "Kia", "Land Rover", "Lexus", "Mazda", "Mercedes-Benz", "Mini",
      "Nissan", "Peugeot", "Porsche", "Range Rover", "Renault", "Seat",
      "Skoda", "Tesla", "Toyota", "Vauxhall", "Volkswagen", "Volvo",
    ],
    bodyTypes: ["Saloon", "SUV", "Coupe", "Hatchback", "Estate", "Convertible", "Van", "Pickup"],
    fuelTypes: sharedFuelTypes,
    transmissions: sharedTransmissions,
    popularCities: ["London", "Birmingham", "Manchester", "Leeds", "Glasgow", "Liverpool", "Bristol", "Edinburgh", "Sheffield", "Cardiff"],
    individualPlan: { price: 20, priceId: "price_1TCRtdFFogsDQVs4GhLpqqvE", label: "per listing" },
    dealerPlans: [
      { name: "Small", price: 49, priceId: "price_1TCRtfFFogsDQVs4rUPrlgEd", maxListings: 5, features: ["Up to 5 active listings", "Basic analytics dashboard", "Marketplace presence", "Email support", "Standard placement", "Verified dealer badge"] },
      { name: "Medium", price: 99, priceId: "price_1TCRtgFFogsDQVs4cuCUnruI", maxListings: 15, features: ["Up to 15 active listings", "Full analytics & reports", "Custom dealer landing page", "Featured placements", "Priority support", "Finance check integration", "Performance score badge", "Call tracking & recording", "Portal syndication (AutoTrader, eBay & more)"] },
      { name: "Large", price: 199, priceId: "price_1TCRthFFogsDQVs4UDkpmlPR", maxListings: 9999, features: ["Unlimited active listings", "White-label landing page", "API access & bulk import", "Dedicated account manager", "Advanced analytics & market insights", "Multi-location support", "Virtual viewings", "Call tracking & recording", "Priority featured placements", "Multi-portal syndication (6 portals)"] },
    ],
    terminology: { registration: "Registration", mileage: "Mileage", postcode: "Postcode", petrol: "Petrol" },
  },

  US: {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    currency: { symbol: "$", code: "USD", locale: "en-US" },
    distanceUnit: "miles",
    driveSide: "right",
    makes: [
      "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler",
      "Dodge", "Ford", "GMC", "Honda", "Hyundai", "Infiniti", "Jeep",
      "Kia", "Lexus", "Lincoln", "Mazda", "Mercedes-Benz", "Nissan",
      "Ram", "Subaru", "Tesla", "Toyota", "Volkswagen",
    ],
    bodyTypes: ["Sedan", "SUV", "Coupe", "Hatchback", "Truck", "Convertible", "Van", "Minivan", "Crossover"],
    fuelTypes: ["Gasoline", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid", "Flex Fuel"],
    transmissions: ["Automatic", "Manual", "CVT"],
    popularCities: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "San Antonio", "Dallas", "Miami", "Atlanta", "Denver"],
    individualPlan: { price: 25, priceId: "price_us_individual", label: "per listing" },
    dealerPlans: [
      { name: "Starter", price: 59, priceId: "price_us_starter", maxListings: 15, features: ["Up to 15 active listings", "Basic analytics dashboard", "Marketplace presence", "Email support", "Standard listing placement"] },
      { name: "Professional", price: 129, priceId: "price_us_professional", maxListings: 50, features: ["Up to 50 active listings", "Full analytics & reports", "Custom dealer landing page", "Featured listing placements", "Priority support", "CARFAX integration", "Portal syndication (AutoTrader, eBay & more)"] },
      { name: "Enterprise", price: 249, priceId: "price_us_enterprise", maxListings: 9999, features: ["Unlimited active listings", "White-label landing page", "API access & bulk import", "Dedicated account manager", "Advanced analytics", "Multi-location support", "Multi-portal syndication (6 portals)"] },
    ],
    terminology: { registration: "License Plate", mileage: "Mileage", postcode: "ZIP Code", petrol: "Gasoline" },
  },

  PK: {
    code: "PK",
    name: "Pakistan",
    flag: "🇵🇰",
    currency: { symbol: "Rs", code: "PKR", locale: "en-PK" },
    distanceUnit: "km",
    driveSide: "left",
    makes: [
      "Toyota", "Honda", "Suzuki", "Hyundai", "Kia", "Daihatsu",
      "Changan", "MG", "Haval", "DFSK", "Proton", "FAW", "United",
      "BMW", "Mercedes-Benz", "Audi", "Mitsubishi", "Nissan",
    ],
    bodyTypes: ["Sedan", "SUV", "Hatchback", "Crossover", "Van", "Pickup", "Coupe"],
    fuelTypes: ["Petrol", "Diesel", "CNG", "Hybrid", "Electric", "LPG"],
    transmissions: ["Automatic", "Manual"],
    popularCities: ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala"],
    individualPlan: { price: 2000, priceId: "price_pk_individual", label: "per listing" },
    dealerPlans: [
      { name: "Starter", price: 9999, priceId: "price_pk_starter", maxListings: 15, features: ["Up to 15 active listings", "Basic analytics dashboard", "Marketplace presence", "WhatsApp support", "Standard listing placement"] },
      { name: "Professional", price: 19999, priceId: "price_pk_professional", maxListings: 50, features: ["Up to 50 active listings", "Full analytics & reports", "Custom dealer page", "Featured listing placements", "Priority support", "Portal syndication (AutoTrader, eBay & more)"] },
      { name: "Enterprise", price: 39999, priceId: "price_pk_enterprise", maxListings: 9999, features: ["Unlimited active listings", "White-label dealer page", "Bulk import", "Dedicated account manager", "Advanced analytics", "Multi-city support", "Multi-portal syndication (6 portals)"] },
    ],
    terminology: { registration: "Registration Number", mileage: "Kilometre Reading", postcode: "Postal Code", petrol: "Petrol" },
  },

  AE: {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    currency: { symbol: "AED ", code: "AED", locale: "en-AE" },
    distanceUnit: "km",
    driveSide: "right",
    makes: [
      "Toyota", "Nissan", "Lexus", "BMW", "Mercedes-Benz", "Audi",
      "Porsche", "Land Rover", "Range Rover", "Bentley", "Rolls-Royce",
      "Ferrari", "Lamborghini", "Maserati", "Ford", "Chevrolet",
      "GMC", "Infiniti", "Hyundai", "Kia", "Mitsubishi", "Honda",
    ],
    bodyTypes: ["Sedan", "SUV", "Coupe", "Hatchback", "Convertible", "Pickup", "Van", "Crossover"],
    fuelTypes: ["Petrol", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid"],
    transmissions: ["Automatic", "Manual"],
    popularCities: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Al Ain"],
    individualPlan: { price: 75, priceId: "price_ae_individual", label: "per listing" },
    dealerPlans: [
      { name: "Starter", price: 199, priceId: "price_ae_starter", maxListings: 15, features: ["Up to 15 active listings", "Basic analytics dashboard", "Marketplace presence", "WhatsApp support", "Standard listing placement"] },
      { name: "Professional", price: 399, priceId: "price_ae_professional", maxListings: 50, features: ["Up to 50 active listings", "Full analytics & reports", "Custom dealer page", "Featured listing placements", "Priority support", "Vehicle history integration", "Portal syndication (AutoTrader, eBay & more)"] },
      { name: "Enterprise", price: 799, priceId: "price_ae_enterprise", maxListings: 9999, features: ["Unlimited active listings", "White-label dealer page", "API access & bulk import", "Dedicated account manager", "Advanced analytics", "Multi-emirate support", "Multi-portal syndication (6 portals)"] },
    ],
    terminology: { registration: "Plate Number", mileage: "Kilometre Reading", postcode: "P.O. Box", petrol: "Petrol" },
  },
};

export const formatPrice = (price: number, config: CountryConfig): string => {
  return `${config.currency.symbol}${price.toLocaleString(config.currency.locale)}`;
};

export const formatDistance = (value: number, config: CountryConfig): string => {
  return `${value.toLocaleString()} ${config.distanceUnit === "miles" ? "mi" : "km"}`;
};

export const getCountryFromCode = (code: string): CountryCode => {
  const map: Record<string, CountryCode> = {
    GB: "GB", UK: "GB",
    US: "US", USA: "US",
    PK: "PK", PAK: "PK",
    AE: "AE", UAE: "AE",
  };
  return map[code.toUpperCase()] || "GB";
};

export const allCountries: CountryCode[] = ["GB", "US", "PK", "AE"];
