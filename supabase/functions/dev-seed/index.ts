import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_USERS = [
  { email: "buyer@autosouq.test", password: "Test1234!", full_name: "Test Buyer", roles: ["buyer"] },
  { email: "seller@autosouq.test", password: "Test1234!", full_name: "Test Seller", roles: ["buyer", "seller"] },
  { email: "dealer@autosouq.test", password: "Test1234!", full_name: "Test Dealer", roles: ["buyer", "seller", "dealer"] },
  { email: "agent@autosouq.test", password: "Test1234!", full_name: "Test Agent", roles: ["buyer", "agent"] },
  { email: "admin@autosouq.test", password: "Test1234!", full_name: "Test Admin", roles: ["buyer", "admin"] },
];

const SAMPLE_LISTINGS = [
  { title: "2023 BMW 3 Series M Sport", make: "BMW", model: "3 Series", year: 2023, price: 34995, mileage: 12000, fuel_type: "Petrol", transmission: "Automatic", body_type: "Saloon", color: "Alpine White", location: "London", country: "GB", engine_size: "2.0L", doors: 4, description: "Stunning BMW 3 Series M Sport in Alpine White. Full BMW service history, one owner from new. Features include M Sport body kit, 19\" alloy wheels, heated leather seats, and BMW Live Cockpit Professional.", features: ["M Sport Package", "Heated Seats", "Parking Sensors", "Navigation", "LED Headlights"], registration: "AB23 BMW" },
  { title: "2022 Mercedes-Benz C-Class AMG Line", make: "Mercedes-Benz", model: "C-Class", year: 2022, price: 31500, mileage: 18500, fuel_type: "Diesel", transmission: "Automatic", body_type: "Saloon", color: "Obsidian Black", location: "Manchester", country: "GB", engine_size: "2.0L", doors: 4, description: "Elegant Mercedes C-Class AMG Line with premium plus package. Full dealer service history.", features: ["AMG Line", "Premium Plus Pack", "Burmester Sound", "360 Camera", "Ambient Lighting"], registration: "CD22 MRC" },
  { title: "2021 Audi A4 S Line", make: "Audi", model: "A4", year: 2021, price: 27995, mileage: 25000, fuel_type: "Petrol", transmission: "Automatic", body_type: "Saloon", color: "Mythos Black", location: "Birmingham", country: "GB", engine_size: "2.0L", doors: 4, description: "Audi A4 S Line with Technology Pack. Virtual cockpit, MMI navigation plus, and S Line sports suspension.", features: ["S Line", "Virtual Cockpit", "Technology Pack", "Matrix LED", "Cruise Control"], registration: "EF21 AUD" },
  { title: "2023 Tesla Model 3 Long Range", make: "Tesla", model: "Model 3", year: 2023, price: 38995, mileage: 8000, fuel_type: "Electric", transmission: "Automatic", body_type: "Saloon", color: "Pearl White", location: "Bristol", country: "GB", engine_size: "Electric", doors: 4, description: "Tesla Model 3 Long Range with Autopilot. 358 mile range, supercharger access included.", features: ["Autopilot", "Premium Interior", "Glass Roof", "Sentry Mode", "Supercharger Access"], registration: "GH23 TSL" },
  { title: "2022 Range Rover Sport HSE", make: "Range Rover", model: "Sport", year: 2022, price: 62500, mileage: 15000, fuel_type: "Diesel", transmission: "Automatic", body_type: "SUV", color: "Santorini Black", location: "Edinburgh", country: "GB", engine_size: "3.0L", doors: 5, description: "Range Rover Sport HSE with panoramic roof and Meridian sound system. Immaculate condition.", features: ["Panoramic Roof", "Meridian Sound", "Air Suspension", "Terrain Response", "Heated Steering Wheel"], registration: "IJ22 RRS" },
  { title: "2023 Ford Mustang GT", make: "Ford", model: "Mustang", year: 2023, price: 42000, mileage: 5000, fuel_type: "Petrol", transmission: "Manual", body_type: "Coupe", color: "Race Red", location: "Leeds", country: "GB", engine_size: "5.0L V8", doors: 2, description: "Ford Mustang GT 5.0 V8 in Race Red. Iconic American muscle with right-hand drive. MagneRide damping and performance pack.", features: ["5.0L V8", "Performance Pack", "MagneRide", "Recaro Seats", "Active Exhaust"], registration: "KL23 GTR" },
  { title: "2021 Volkswagen Golf GTI", make: "Volkswagen", model: "Golf", year: 2021, price: 28500, mileage: 22000, fuel_type: "Petrol", transmission: "Automatic", body_type: "Hatchback", color: "Kings Red", location: "Glasgow", country: "GB", engine_size: "2.0L", doors: 5, description: "VW Golf GTI Mk8 with DSG gearbox. Digital cockpit pro, DCC adaptive chassis control.", features: ["DSG Gearbox", "Digital Cockpit Pro", "DCC", "Vienna Leather", "Keyless Entry"], registration: "MN21 GTI" },
  { title: "2022 Toyota Supra GR", make: "Toyota", model: "Supra", year: 2022, price: 46995, mileage: 9000, fuel_type: "Petrol", transmission: "Automatic", body_type: "Coupe", color: "Prominence Red", location: "Cardiff", country: "GB", engine_size: "3.0L", doors: 2, description: "Toyota GR Supra 3.0 Pro with head-up display and JBL premium sound. Low mileage enthusiast car.", features: ["3.0L Turbo", "Head-Up Display", "JBL Sound", "Adaptive Suspension", "Launch Control"], registration: "OP22 GRS" },
  { title: "2023 Porsche Cayenne", make: "Porsche", model: "Cayenne", year: 2023, price: 72000, mileage: 7500, fuel_type: "Petrol", transmission: "Automatic", body_type: "SUV", color: "Carrara White", location: "London", country: "GB", engine_size: "3.0L V6", doors: 5, description: "Porsche Cayenne with Sport Chrono package, PASM, and panoramic roof. Full Porsche warranty remaining.", features: ["Sport Chrono", "PASM", "Panoramic Roof", "BOSE Sound", "Lane Keep Assist"], registration: "QR23 POR" },
  { title: "2020 Mini Cooper S", make: "Mini", model: "Cooper S", year: 2020, price: 19995, mileage: 30000, fuel_type: "Petrol", transmission: "Automatic", body_type: "Hatchback", color: "British Racing Green", location: "Liverpool", country: "GB", engine_size: "2.0L", doors: 3, description: "Mini Cooper S in classic British Racing Green with white roof. Chili Pack and navigation plus included.", features: ["Chili Pack", "Navigation Plus", "Harman Kardon", "LED Headlights", "Sport Seats"], registration: "ST20 MIN" },
  // US listings
  { title: "2023 Ford F-150 Lariat", make: "Ford", model: "F-150", year: 2023, price: 52000, mileage: 10000, fuel_type: "Gasoline", transmission: "Automatic", body_type: "Truck", color: "Oxford White", location: "Houston", country: "US", engine_size: "3.5L V6", doors: 4, description: "Ford F-150 Lariat with EcoBoost V6 and towing package. Leather interior, B&O premium audio.", features: ["EcoBoost", "Tow Package", "B&O Audio", "Leather Interior", "360 Camera"] },
  { title: "2022 Chevrolet Corvette Stingray", make: "Chevrolet", model: "Corvette", year: 2022, price: 68000, mileage: 8000, fuel_type: "Gasoline", transmission: "Automatic", body_type: "Coupe", color: "Torch Red", location: "Miami", country: "US", engine_size: "6.2L V8", doors: 2, description: "Mid-engine C8 Corvette Stingray 3LT with Z51 performance package. Magnetic ride control.", features: ["Z51 Package", "3LT Trim", "Magnetic Ride", "Head-Up Display", "Performance Exhaust"] },
  { title: "2023 Tesla Model Y Performance", make: "Tesla", model: "Model Y", year: 2023, price: 54990, mileage: 5000, fuel_type: "Electric", transmission: "Automatic", body_type: "SUV", color: "Midnight Silver", location: "San Francisco", country: "US", engine_size: "Electric", doors: 5, description: "Tesla Model Y Performance with Full Self-Driving capability. Dual motor AWD, 303 mile range.", features: ["Full Self-Driving", "Premium Interior", "Glass Roof", "Track Mode", "21\" Wheels"] },
  // UAE listings
  { title: "2023 Toyota Land Cruiser VXR", make: "Toyota", model: "Land Cruiser", year: 2023, price: 320000, mileage: 12000, fuel_type: "Petrol", transmission: "Automatic", body_type: "SUV", color: "Pearl White", location: "Dubai", country: "AE", engine_size: "3.5L V6 Twin Turbo", doors: 5, description: "Toyota Land Cruiser 300 VXR with full option package. JBL premium sound, multi-terrain select.", features: ["VXR Package", "JBL Sound", "Multi-Terrain Select", "Crawl Control", "Kinetic Dynamic Suspension"] },
  { title: "2022 Lamborghini Urus", make: "Lamborghini", model: "Urus", year: 2022, price: 890000, mileage: 8000, fuel_type: "Petrol", transmission: "Automatic", body_type: "SUV", color: "Giallo Auge", location: "Abu Dhabi", country: "AE", engine_size: "4.0L V8 Twin Turbo", doors: 5, description: "Lamborghini Urus in stunning Giallo Auge. Full carbon fiber package, Bang & Olufsen 3D sound.", features: ["Carbon Package", "B&O 3D Sound", "Night Vision", "Air Suspension", "Akrapovic Exhaust"] },
  // Pakistan listings
  { title: "2023 Toyota Corolla Grande", make: "Toyota", model: "Corolla", year: 2023, price: 6500000, mileage: 15000, fuel_type: "Petrol", transmission: "Automatic", body_type: "Sedan", color: "Super White", location: "Lahore", country: "PK", engine_size: "1.8L", doors: 4, description: "Toyota Corolla Grande with CVT transmission. TSS safety suite, 9-inch touchscreen, leather seats.", features: ["TSS Safety", "9\" Touchscreen", "Leather Seats", "Cruise Control", "Push Start"] },
  { title: "2022 Honda Civic RS Turbo", make: "Honda", model: "Civic", year: 2022, price: 7800000, mileage: 20000, fuel_type: "Petrol", transmission: "Automatic", body_type: "Sedan", color: "Rallye Red", location: "Islamabad", country: "PK", engine_size: "1.5L Turbo", doors: 4, description: "Honda Civic RS Turbo with Honda Sensing suite. Turbocharged performance with excellent fuel economy.", features: ["Honda Sensing", "Turbo Engine", "Sunroof", "Wireless Charging", "LED Headlights"] },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: { email: string; status: string }[] = [];
    const userIds: Record<string, string> = {};

    for (const user of TEST_USERS) {
      const { data: existing } = await admin.auth.admin.listUsers();
      const found = existing?.users?.find((u: any) => u.email === user.email);

      if (found) {
        userIds[user.email] = found.id;
        results.push({ email: user.email, status: "already_exists" });
        continue;
      }

      const { data: created, error } = await admin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: { full_name: user.full_name },
        email_confirm: true,
      });

      if (error) {
        results.push({ email: user.email, status: `error: ${error.message}` });
        continue;
      }

      userIds[user.email] = created.user.id;

      for (const role of user.roles) {
        if (role === "buyer") continue;
        await admin.from("user_roles").insert({ user_id: created.user.id, role });
      }

      if (user.roles.includes("dealer") && created.user) {
        await admin.from("dealers").insert({
          user_id: created.user.id,
          business_name: "AutoSouq Motors",
          slug: "autosouq-motors",
          tier: "professional",
          subscription_status: "active",
          max_listings: 50,
          kyc_verified: true,
          country: "GB",
          city: "London",
          business_email: user.email,
          description: "Premium pre-owned vehicles with full inspection reports and nationwide delivery.",
        });
      }

      results.push({ email: user.email, status: "created" });
    }

    // Seed listings
    const sellerId = userIds["seller@autosouq.test"];
    const dealerEmail = "dealer@autosouq.test";
    const dealerId = userIds[dealerEmail];

    let listingsCreated = 0;
    const createdListingIds: string[] = [];

    if (sellerId) {
      // Check if listings already exist
      const { count } = await admin.from("car_listings").select("*", { count: "exact", head: true });

      if ((count ?? 0) < 5) {
        // Get dealer record id
        let dealerRecordId: string | null = null;
        if (dealerId) {
          const { data: dealerRow } = await admin.from("dealers").select("id").eq("user_id", dealerId).single();
          dealerRecordId = dealerRow?.id ?? null;
        }

        for (const listing of SAMPLE_LISTINGS) {
          const isDealer = listing.country === "GB" && dealerRecordId && listingsCreated % 2 === 0;
          const { data: inserted, error: listingError } = await admin.from("car_listings").insert({
            ...listing,
            seller_id: isDealer ? dealerId : sellerId,
            dealer_id: isDealer ? dealerRecordId : null,
            status: "active",
            verified: true,
            views_count: Math.floor(Math.random() * 500) + 50,
            enquiries_count: Math.floor(Math.random() * 20),
          }).select("id").single();

          if (!listingError && inserted) {
            createdListingIds.push(inserted.id);
            listingsCreated++;
          }
        }

        // Create a sample auction from one of the GB listings
        if (createdListingIds.length > 0 && sellerId) {
          const auctionListingId = createdListingIds[5] || createdListingIds[0]; // Mustang or first
          const startsAt = new Date();
          const endsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

          await admin.from("auctions").insert({
            listing_id: auctionListingId,
            seller_id: sellerId,
            format: "timed",
            status: "live",
            starting_price: 35000,
            reserve_price: 40000,
            current_bid: 37500,
            bid_count: 5,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            original_end_time: endsAt.toISOString(),
            hpi_clear: true,
            seller_verified: true,
            delivery_available: true,
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      users: results,
      listings_created: listingsCreated,
      total_listings: SAMPLE_LISTINGS.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
