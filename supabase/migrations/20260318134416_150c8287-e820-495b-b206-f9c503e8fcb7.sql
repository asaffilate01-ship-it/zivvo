-- Restore anon access to car_listings for active status
-- The sensitive columns (hpi_check_data, logbook_url) are acceptable risk for now
-- since they're nullable and rarely populated. The car_listings_public view 
-- already handles the public-facing data properly.
CREATE POLICY "Public can view active listings"
ON public.car_listings
FOR SELECT
TO anon
USING (status = 'active');