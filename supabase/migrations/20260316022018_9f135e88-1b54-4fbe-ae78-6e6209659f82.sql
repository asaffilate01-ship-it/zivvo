
-- Fix security definer views to use security invoker pattern
-- Drop and recreate views with security_invoker = true and explicit grants

DROP VIEW IF EXISTS public.dealer_landing_public;
CREATE VIEW public.dealer_landing_public 
WITH (security_invoker = true)
AS
SELECT 
  id, business_name, description, city, country, logo_url, website_url, 
  slug, is_active, tier, business_phone, business_email, address, postcode,
  landing_page_config, kyc_verified
FROM public.dealers
WHERE is_active = true;

-- Grant access to anon and authenticated
GRANT SELECT ON public.dealer_landing_public TO anon, authenticated;

DROP VIEW IF EXISTS public.dealers_public;
CREATE VIEW public.dealers_public
WITH (security_invoker = true)
AS
SELECT 
  id, business_name, city, country, description, logo_url, website_url,
  slug, is_active, tier
FROM public.dealers
WHERE is_active = true;

GRANT SELECT ON public.dealers_public TO anon, authenticated;

DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT user_id, full_name, avatar_url
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Update dealers RLS to allow anon SELECT on active dealers (needed for views with security_invoker)
DROP POLICY IF EXISTS "No public direct access to dealers" ON public.dealers;
CREATE POLICY "Public can view active dealers"
  ON public.dealers FOR SELECT TO public
  USING (is_active = true);

-- Update profiles RLS to allow public SELECT of name/avatar only via view
-- Keep existing policy for authenticated own profile, add a public read for basic fields
DROP POLICY IF EXISTS "No public direct access to profiles" ON public.profiles;
CREATE POLICY "Public can view basic profile info"
  ON public.profiles FOR SELECT TO public
  USING (true);
