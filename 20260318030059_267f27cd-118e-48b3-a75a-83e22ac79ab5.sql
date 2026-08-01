
-- Tighten dealers: remove public SELECT entirely, keep only authenticated
-- Public queries should use the dealers_public view
DROP POLICY IF EXISTS "Public can view active dealers limited" ON public.dealers;

-- Allow public to view ONLY via specific columns by restricting to view
-- For the actual table, only authenticated users and owners can read
CREATE POLICY "Authenticated can view active dealers"
ON public.dealers
FOR SELECT
TO authenticated
USING (is_active = true);

-- Tighten profiles: split into authenticated-only for full data
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;

-- Public can view profiles (needed for seller names/avatars on listings)
-- Create a restricted view instead
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = true) AS
SELECT user_id, full_name, avatar_url
FROM public.profiles;

-- Only authenticated users can SELECT profiles
CREATE POLICY "Authenticated can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
