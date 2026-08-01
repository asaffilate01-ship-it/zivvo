
-- Fix: Change view to SECURITY INVOKER (default for new views, but let's be explicit)
ALTER VIEW public.car_listings_public SET (security_invoker = on);
