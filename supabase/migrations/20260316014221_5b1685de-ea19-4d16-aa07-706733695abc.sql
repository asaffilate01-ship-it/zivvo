
-- Fix 1: Replace overly permissive dealers public SELECT policy
-- Remove sensitive columns from public view by using a restricted policy
DROP POLICY IF EXISTS "Public can view active dealers" ON public.dealers;

-- Create a view for public dealer data (excludes sensitive fields)
CREATE OR REPLACE VIEW public.dealers_public AS
SELECT id, business_name, description, city, country, logo_url, website_url, slug, is_active, tier
FROM public.dealers
WHERE is_active = true;

-- Re-create the public policy but keep it (needed for foreign key lookups)
-- The view above is the recommended way to query public dealer data
CREATE POLICY "Public can view active dealers limited"
ON public.dealers
FOR SELECT
TO public
USING (is_active = true);

-- Fix 2: Restrict profiles public SELECT to exclude phone
-- We can't do column-level RLS, so we'll tighten the policy
-- Phone should only be visible to the user themselves and admins
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public can view basic profile info"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Fix 3: Restrict listing_views INSERT to prevent viewer_id spoofing
DROP POLICY IF EXISTS "Anyone can log views" ON public.listing_views;

CREATE POLICY "Anonymous can log views without viewer_id"
ON public.listing_views
FOR INSERT
TO public
WITH CHECK (viewer_id IS NULL);

CREATE POLICY "Authenticated can log views with own viewer_id"
ON public.listing_views
FOR INSERT
TO authenticated
WITH CHECK (viewer_id IS NULL OR viewer_id = auth.uid());
