
-- Fix security definer view by dropping it and using SECURITY INVOKER instead
DROP VIEW IF EXISTS public.dealers_public;

CREATE VIEW public.dealers_public 
WITH (security_invoker = true) AS
SELECT id, business_name, description, city, country, logo_url, website_url, slug, is_active, tier
FROM public.dealers
WHERE is_active = true;
