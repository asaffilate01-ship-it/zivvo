-- Fix 1: Restrict inspection_reports public access to active listings only
DROP POLICY IF EXISTS "Public can view inspection reports" ON public.inspection_reports;
CREATE POLICY "Public can view inspection reports for active listings"
ON public.inspection_reports
FOR SELECT
TO public
USING (EXISTS (
  SELECT 1 FROM public.car_listings
  WHERE car_listings.id = inspection_reports.listing_id
    AND car_listings.status = 'active'
));

-- Fix 2: Restrict price_history public access to active listings only
DROP POLICY IF EXISTS "Public can view price history" ON public.price_history;
CREATE POLICY "Public can view price history for active listings"
ON public.price_history
FOR SELECT
TO public
USING (EXISTS (
  SELECT 1 FROM public.car_listings
  WHERE car_listings.id = price_history.listing_id
    AND car_listings.status = 'active'
));

-- Fix 3: Function to get distinct models for a given make (for dynamic dropdown)
CREATE OR REPLACE FUNCTION public.get_models_for_make(_make text, _country text DEFAULT 'GB')
RETURNS TABLE(model text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT DISTINCT cl.model
  FROM public.car_listings cl
  WHERE cl.make = _make
    AND cl.status = 'active'
    AND cl.country = _country
  ORDER BY cl.model;
$$;