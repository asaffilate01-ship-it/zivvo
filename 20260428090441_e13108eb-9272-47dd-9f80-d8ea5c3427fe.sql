
-- Create a public-safe view for car listings that excludes sensitive data
CREATE OR REPLACE VIEW public.car_listings_public AS
SELECT
  id, title, make, model, year, price, mileage, fuel_type, transmission,
  body_type, color, doors, engine_size, location, description, images,
  features, specs, video_url, country, status, views_count, enquiries_count,
  verified, finance_check_clear, legal_check_clear, inspection_score,
  is_promoted, promoted_until, is_featured, dealer_id, seller_id,
  registration, created_at, updated_at, search_vector
FROM public.car_listings
WHERE status = 'active';

-- Grant select on view to anon and authenticated
GRANT SELECT ON public.car_listings_public TO anon;
GRANT SELECT ON public.car_listings_public TO authenticated;

-- Revoke direct anonymous access to the car_listings table
-- We need to drop the public SELECT policy and replace it with one using the view
DROP POLICY IF EXISTS "Public can view active listings" ON public.car_listings;

-- Re-add public read but exclude logbook_url and hpi_check_data via column permissions
-- Since Postgres RLS is row-level not column-level, we use the approach of revoking 
-- column-level SELECT on sensitive columns from anon role
REVOKE SELECT (logbook_url, hpi_check_data) ON public.car_listings FROM anon;

-- Re-create the public read policy (row filter still needed)
CREATE POLICY "Public can view active listings"
ON public.car_listings
FOR SELECT
TO anon
USING (status = 'active');
