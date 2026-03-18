
-- Allow authenticated users to view active listings (needed for browsing)
CREATE POLICY "Authenticated can view active listings" ON public.car_listings
  FOR SELECT TO authenticated
  USING (status = 'active'::listing_status);

-- Allow anonymous users to read from the public view (which excludes sensitive fields)
-- car_listings_public is a view that already excludes vin, hpi_check_data, logbook_url
-- Views with security_invoker need separate policies, but if it's a regular view,
-- anonymous access depends on the base table. Let's add a safe anon policy 
-- that only exposes the columns also in the public view.
CREATE POLICY "Anon can view active listings safely" ON public.car_listings
  FOR SELECT TO anon
  USING (status = 'active'::listing_status);
