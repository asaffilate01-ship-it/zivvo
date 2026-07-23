
ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS co2_emissions integer,
  ADD COLUMN IF NOT EXISTS fuel_consumption_combined numeric,
  ADD COLUMN IF NOT EXISTS emission_class text,
  ADD COLUMN IF NOT EXISTS environmental_badge text,
  ADD COLUMN IF NOT EXISTS hu_expiry date,
  ADD COLUMN IF NOT EXISTS first_registration date,
  ADD COLUMN IF NOT EXISTS hsn text,
  ADD COLUMN IF NOT EXISTS tsn text,
  ADD COLUMN IF NOT EXISTS previous_owners integer,
  ADD COLUMN IF NOT EXISTS warranty_months integer,
  ADD COLUMN IF NOT EXISTS accident_free boolean,
  ADD COLUMN IF NOT EXISTS non_smoker boolean;
