
-- Add country column to car_listings for geofenced isolation
ALTER TABLE public.car_listings ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'GB';

-- Add country column to dealers  
ALTER TABLE public.dealers ADD COLUMN IF NOT EXISTS country text DEFAULT 'GB';

-- Index for fast country filtering
CREATE INDEX IF NOT EXISTS idx_car_listings_country ON public.car_listings(country);
CREATE INDEX IF NOT EXISTS idx_car_listings_country_status ON public.car_listings(country, status);
CREATE INDEX IF NOT EXISTS idx_dealers_country ON public.dealers(country);
