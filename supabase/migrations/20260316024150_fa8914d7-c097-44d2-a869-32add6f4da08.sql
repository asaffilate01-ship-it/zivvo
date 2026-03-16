-- Security hardening for public data exposure

-- 1) Lock down direct public/authenticated reads on sensitive base tables
DROP POLICY IF EXISTS "Public can view active dealers" ON public.dealers;
DROP POLICY IF EXISTS "Authenticated can view active dealers" ON public.dealers;

CREATE POLICY "Dealers can view own record"
  ON public.dealers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;

-- Optional tightening: profile writes should be authenticated only
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2) Recreate public views with strictly safe columns only
DROP VIEW IF EXISTS public.dealer_landing_public;
CREATE VIEW public.dealer_landing_public AS
SELECT
  id,
  business_name,
  description,
  city,
  country,
  logo_url,
  website_url,
  slug,
  is_active,
  tier,
  landing_page_config,
  kyc_verified
FROM public.dealers
WHERE is_active = true;

GRANT SELECT ON public.dealer_landing_public TO anon, authenticated;

DROP VIEW IF EXISTS public.dealers_public;
CREATE VIEW public.dealers_public AS
SELECT
  id,
  business_name,
  city,
  country,
  description,
  logo_url,
  website_url,
  slug,
  is_active,
  tier
FROM public.dealers
WHERE is_active = true;

GRANT SELECT ON public.dealers_public TO anon, authenticated;

DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
SELECT user_id, full_name, avatar_url
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;