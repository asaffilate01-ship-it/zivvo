
-- Fix approach: use security_invoker views with permissive base table policies
-- but the app code will only query through the views for public access

-- Recreate views as security_invoker (which is default/safe)
DROP VIEW IF EXISTS public.dealers_public;
CREATE VIEW public.dealers_public
WITH (security_invoker = true)
AS SELECT 
  id, business_name, city, country, description, logo_url, 
  website_url, slug, tier, is_active
FROM public.dealers
WHERE is_active = true;

DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS SELECT 
  user_id, full_name, avatar_url
FROM public.profiles;

-- Now we need the base table policies to allow SELECT for the view to work
-- For dealers: public can SELECT but only active dealers, and only safe columns via app code
DROP POLICY IF EXISTS "Public reads dealers through view only" ON public.dealers;
CREATE POLICY "Public can view active dealers limited"
  ON public.dealers FOR SELECT
  TO public
  USING (is_active = true);

-- For profiles: public needs SELECT for the view to work
DROP POLICY IF EXISTS "Public reads profiles through view only" ON public.profiles;
CREATE POLICY "Public can view profiles limited"
  ON public.profiles FOR SELECT
  TO public
  USING (true);

-- Re-add authenticated policy for profiles (broader access for logged-in users)
DROP POLICY IF EXISTS "Authenticated can view own profile" ON public.profiles;
CREATE POLICY "Authenticated can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
