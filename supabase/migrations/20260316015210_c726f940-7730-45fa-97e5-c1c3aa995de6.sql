
-- Fix: Restrict base table public access and create proper views

-- 1. DEALERS: Remove public SELECT on base table
DROP POLICY IF EXISTS "Public can view active dealers limited" ON public.dealers;

-- Create a dealer landing view that includes contact info but NOT Stripe data
CREATE OR REPLACE VIEW public.dealer_landing_public
WITH (security_invoker = true)
AS SELECT 
  id, business_name, description, city, country, logo_url, website_url, 
  slug, tier, is_active, business_phone, business_email, address, postcode, 
  landing_page_config, kyc_verified
FROM public.dealers
WHERE is_active = true;

-- Public can only read active dealers (needed for security_invoker views to work)
-- But we'll use a function-based approach instead
-- Actually the simplest fix: public SELECT is needed for the views to work with security_invoker
-- So instead let's use security_invoker=false (security definer) but only for safe columns

-- Drop the security_invoker views and recreate properly
DROP VIEW IF EXISTS public.dealer_landing_public;
DROP VIEW IF EXISTS public.dealers_public;
DROP VIEW IF EXISTS public.profiles_public;

-- Dealers public view (minimal info, no contact details)
CREATE VIEW public.dealers_public AS
SELECT id, business_name, city, country, description, logo_url, 
       website_url, slug, tier, is_active
FROM public.dealers
WHERE is_active = true;

-- Dealer landing view (includes contact info for landing pages, excludes Stripe)
CREATE VIEW public.dealer_landing_public AS
SELECT id, business_name, description, city, country, logo_url, website_url,
       slug, tier, is_active, business_phone, business_email, address, postcode,
       landing_page_config, kyc_verified
FROM public.dealers
WHERE is_active = true;

-- Profiles public view (excludes phone)
CREATE VIEW public.profiles_public AS
SELECT user_id, full_name, avatar_url
FROM public.profiles;

-- Now restrict base table: no public SELECT at all
-- The views above don't use security_invoker so they bypass RLS
CREATE POLICY "No public direct access to dealers"
  ON public.dealers FOR SELECT
  TO public
  USING (false);

-- 2. PROFILES: Remove public SELECT
DROP POLICY IF EXISTS "Public can view profiles limited" ON public.profiles;

-- Restrict: authenticated can only see own profile directly
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No public direct access
CREATE POLICY "No public direct access to profiles"
  ON public.profiles FOR SELECT
  TO public
  USING (false);
