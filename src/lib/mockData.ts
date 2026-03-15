export interface CarListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  color: string;
  location: string;
  images: string[];
  sellerType: "individual" | "dealer";
  sellerName: string;
  featured: boolean;
  verified: boolean;
  financeAvailable: boolean;
  specs: {
    engine: string;
    power: string;
    doors: number;
    seats: number;
    drivetrain: string;
  };
  description: string;
  postedDate: string;
}

export const mockListings: CarListing[] = [
  {
    id: "1",
    title: "2023 BMW M4 Competition",
    make: "BMW",
    model: "M4 Competition",
    year: 2023,
    price: 78500,
    currency: "USD",
    mileage: 8200,
    fuelType: "Petrol",
    transmission: "Automatic",
    bodyType: "Coupe",
    color: "Isle of Man Green",
    location: "Dubai, UAE",
    images: [
      "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
    ],
    sellerType: "dealer",
    sellerName: "Premium Motors Dubai",
    featured: true,
    verified: true,
    financeAvailable: true,
    specs: { engine: "3.0L Twin-Turbo I6", power: "503 HP", doors: 2, seats: 4, drivetrain: "RWD" },
    description: "Immaculate BMW M4 Competition in rare Isle of Man Green. Full service history, carbon fibre package.",
    postedDate: "2024-01-15",
  },
  {
    id: "2",
    title: "2022 Mercedes-AMG GT 63 S",
    make: "Mercedes-Benz",
    model: "AMG GT 63 S",
    year: 2022,
    price: 125000,
    currency: "USD",
    mileage: 12400,
    fuelType: "Petrol",
    transmission: "Automatic",
    bodyType: "Sedan",
    color: "Obsidian Black",
    location: "Abu Dhabi, UAE",
    images: [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
    ],
    sellerType: "dealer",
    sellerName: "Luxury Auto Gallery",
    featured: true,
    verified: true,
    financeAvailable: true,
    specs: { engine: "4.0L V8 Biturbo", power: "630 HP", doors: 4, seats: 5, drivetrain: "AWD" },
    description: "Stunning AMG GT 63 S 4-Door. Performance package with track-ready suspension.",
    postedDate: "2024-01-12",
  },
  {
    id: "3",
    title: "2024 Porsche 911 Carrera S",
    make: "Porsche",
    model: "911 Carrera S",
    year: 2024,
    price: 145000,
    currency: "USD",
    mileage: 1800,
    fuelType: "Petrol",
    transmission: "Automatic",
    bodyType: "Coupe",
    color: "Guards Red",
    location: "London, UK",
    images: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80",
    ],
    sellerType: "dealer",
    sellerName: "Porsche Centre London",
    featured: true,
    verified: true,
    financeAvailable: true,
    specs: { engine: "3.0L Twin-Turbo Flat-6", power: "443 HP", doors: 2, seats: 4, drivetrain: "RWD" },
    description: "Brand new 992.2 Carrera S with Sport Chrono and PASM sport suspension.",
    postedDate: "2024-01-18",
  },
  {
    id: "4",
    title: "2021 Range Rover Sport SVR",
    make: "Land Rover",
    model: "Range Rover Sport SVR",
    year: 2021,
    price: 89000,
    currency: "USD",
    mileage: 28000,
    fuelType: "Petrol",
    transmission: "Automatic",
    bodyType: "SUV",
    color: "Santorini Black",
    location: "Manchester, UK",
    images: [
      "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80",
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80",
    ],
    sellerType: "individual",
    sellerName: "James M.",
    featured: false,
    verified: true,
    financeAvailable: false,
    specs: { engine: "5.0L Supercharged V8", power: "575 HP", doors: 5, seats: 5, drivetrain: "AWD" },
    description: "One owner SVR with full Land Rover service history. Carbon pack and panoramic roof.",
    postedDate: "2024-01-10",
  },
  {
    id: "5",
    title: "2023 Audi RS6 Avant",
    make: "Audi",
    model: "RS6 Avant",
    year: 2023,
    price: 112000,
    currency: "USD",
    mileage: 5600,
    fuelType: "Petrol",
    transmission: "Automatic",
    bodyType: "Estate",
    color: "Nardo Grey",
    location: "Dubai, UAE",
    images: [
      "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&q=80",
      "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
    ],
    sellerType: "dealer",
    sellerName: "Auto Elite Dubai",
    featured: true,
    verified: true,
    financeAvailable: true,
    specs: { engine: "4.0L V8 Biturbo", power: "621 HP", doors: 5, seats: 5, drivetrain: "AWD" },
    description: "Nardo Grey RS6 with dynamic package plus and carbon ceramics. As-new condition.",
    postedDate: "2024-01-20",
  },
  {
    id: "6",
    title: "2020 Toyota Land Cruiser VXR",
    make: "Toyota",
    model: "Land Cruiser VXR",
    year: 2020,
    price: 52000,
    currency: "USD",
    mileage: 65000,
    fuelType: "Petrol",
    transmission: "Automatic",
    bodyType: "SUV",
    color: "Pearl White",
    location: "Sharjah, UAE",
    images: [
      "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&q=80",
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80",
    ],
    sellerType: "individual",
    sellerName: "Ahmed K.",
    featured: false,
    verified: false,
    financeAvailable: false,
    specs: { engine: "5.7L V8", power: "362 HP", doors: 5, seats: 8, drivetrain: "4WD" },
    description: "Well-maintained LC200 VXR. New tyres, recently serviced. Genuine mileage.",
    postedDate: "2024-01-08",
  },
  {
    id: "7",
    title: "2024 Tesla Model S Plaid",
    make: "Tesla",
    model: "Model S Plaid",
    year: 2024,
    price: 98000,
    currency: "USD",
    mileage: 2100,
    fuelType: "Electric",
    transmission: "Automatic",
    bodyType: "Sedan",
    color: "Midnight Cherry Red",
    location: "Los Angeles, USA",
    images: [
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80",
      "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=800&q=80",
    ],
    sellerType: "dealer",
    sellerName: "EV Motors LA",
    featured: true,
    verified: true,
    financeAvailable: true,
    specs: { engine: "Tri Motor Electric", power: "1,020 HP", doors: 4, seats: 5, drivetrain: "AWD" },
    description: "Plaid with full self-driving capability. Yoke steering and new interior refresh.",
    postedDate: "2024-01-22",
  },
  {
    id: "8",
    title: "2019 Ford Mustang GT 5.0",
    make: "Ford",
    model: "Mustang GT",
    year: 2019,
    price: 38500,
    currency: "USD",
    mileage: 34000,
    fuelType: "Petrol",
    transmission: "Manual",
    bodyType: "Coupe",
    color: "Velocity Blue",
    location: "Birmingham, UK",
    images: [
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
      "https://images.unsplash.com/photo-1547744152-14d985cb937f?w=800&q=80",
    ],
    sellerType: "individual",
    sellerName: "Tom H.",
    featured: false,
    verified: true,
    financeAvailable: false,
    specs: { engine: "5.0L V8", power: "450 HP", doors: 2, seats: 4, drivetrain: "RWD" },
    description: "Manual GT with performance pack. Exhaust upgrade and lowered springs. MOT'd.",
    postedDate: "2024-01-05",
  },
];

export const makes = ["BMW", "Mercedes-Benz", "Porsche", "Audi", "Land Rover", "Toyota", "Tesla", "Ford", "Lamborghini", "Ferrari", "Rolls-Royce", "Bentley"];
export const bodyTypes = ["Sedan", "SUV", "Coupe", "Estate", "Convertible", "Hatchback", "Pickup"];
export const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid"];
export const transmissions = ["Automatic", "Manual"];
