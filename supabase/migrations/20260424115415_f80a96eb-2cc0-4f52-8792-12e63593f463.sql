ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE public.dealers
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

CREATE INDEX IF NOT EXISTS idx_car_listings_latlng
  ON public.car_listings (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dealers_latlng
  ON public.dealers (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;