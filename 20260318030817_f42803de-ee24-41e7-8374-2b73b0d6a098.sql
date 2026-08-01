
-- SECURITY FIX 1: Restrict public SELECT on dealers to only safe columns
-- Remove the overly permissive public policy
DROP POLICY IF EXISTS "Public can view active dealers by slug" ON public.dealers;

-- Create a restricted public policy that only allows reading via the dealers_public view
-- The dealers_public view already exists with security_invoker=on and only exposes safe columns
-- We need the base table to allow SELECT for the view to work, but restrict direct access
-- Solution: allow public SELECT but only for rows where is_active = true
-- The sensitive data exposure is handled by directing all public queries through the view

-- Actually, since the view uses security_invoker, we need the base table policy to allow SELECT
-- The correct fix is to make the policy more restrictive or use a security definer function
-- Best approach: replace the public policy with one that denies direct access,
-- and recreate the view as security_definer so it can still read

DROP VIEW IF EXISTS public.dealers_public;
CREATE VIEW public.dealers_public
WITH (security_invoker = false)
AS SELECT 
  id, business_name, city, country, description, logo_url, 
  website_url, slug, tier, is_active
FROM public.dealers
WHERE is_active = true;

-- Now restrict the public SELECT policy to deny direct table access
-- But authenticated users still need access for their own dealer record
-- Keep the authenticated policy for active dealers but add column-level restriction via app code

-- For public role: no direct table access (use the view instead)
CREATE POLICY "Public reads dealers through view only"
  ON public.dealers FOR SELECT
  TO public
  USING (false);

-- SECURITY FIX 2: Restrict profiles table
-- Remove overly permissive policies
DROP POLICY IF EXISTS "Public can view profiles via view only" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;

-- Public: no direct access (use profiles_public view)
CREATE POLICY "Public reads profiles through view only"
  ON public.profiles FOR SELECT
  TO public
  USING (false);

-- Authenticated: can view own profile fully, others only via view
CREATE POLICY "Authenticated can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Recreate profiles_public view as security_definer so it bypasses RLS
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = false)
AS SELECT 
  user_id, full_name, avatar_url
FROM public.profiles;
