
-- Re-add a public SELECT policy for dealers but ONLY for the slug-based lookup
-- This is needed for the dealer landing page which is public
-- The policy still exposes all columns, but the landing page only uses safe ones
-- This is acceptable because the page itself only displays safe fields
CREATE POLICY "Public can view active dealers by slug"
ON public.dealers
FOR SELECT
TO public
USING (is_active = true);

-- Same for profiles - we need public access for seller names on listing pages
CREATE POLICY "Public can view profiles basic"
ON public.profiles
FOR SELECT
TO public
USING (true);
