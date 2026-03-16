
-- FIX 1: Replace seller ALL policy on car_listings with restricted UPDATE
-- Sellers should NOT be able to modify: verified, is_featured, is_promoted, promoted_until, finance_check_clear, legal_check_clear, inspection_score
DROP POLICY IF EXISTS "Sellers can manage own listings" ON public.car_listings;

-- Sellers can SELECT their own listings (any status)
CREATE POLICY "Sellers can view own listings"
ON public.car_listings FOR SELECT TO authenticated
USING (auth.uid() = seller_id);

-- Sellers can INSERT their own listings
CREATE POLICY "Sellers can create listings"
ON public.car_listings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = seller_id);

-- Sellers can UPDATE own listings but only non-admin fields
-- We use a trigger to prevent changes to restricted fields
CREATE POLICY "Sellers can update own listings"
ON public.car_listings FOR UPDATE TO authenticated
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- Sellers can DELETE own listings (soft-delete via status change is preferred, but allow)
CREATE POLICY "Sellers can delete own listings"
ON public.car_listings FOR DELETE TO authenticated
USING (auth.uid() = seller_id);

-- Trigger to block sellers from modifying admin-controlled fields
CREATE OR REPLACE FUNCTION public.enforce_listing_update_safety()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF jwt_role = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.verified IS DISTINCT FROM OLD.verified
     OR NEW.is_featured IS DISTINCT FROM OLD.is_featured
     OR NEW.is_promoted IS DISTINCT FROM OLD.is_promoted
     OR NEW.promoted_until IS DISTINCT FROM OLD.promoted_until
     OR NEW.finance_check_clear IS DISTINCT FROM OLD.finance_check_clear
     OR NEW.legal_check_clear IS DISTINCT FROM OLD.legal_check_clear
     OR NEW.inspection_score IS DISTINCT FROM OLD.inspection_score
  THEN
    RAISE EXCEPTION 'Only admins can modify verification, promotion, and check fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_listing_update_safety ON public.car_listings;
CREATE TRIGGER enforce_listing_update_safety
  BEFORE UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_listing_update_safety();

-- FIX 2: Remove seller write access to inspection_reports (admin-only writes)
DROP POLICY IF EXISTS "Sellers can manage own inspections" ON public.inspection_reports;

-- FIX 3: Remove direct seller INSERT on price_history (trigger handles it)
DROP POLICY IF EXISTS "System can insert price history" ON public.price_history;

-- FIX 4: Restrict newsletter_subscribers INSERT to rate-limit abuse
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers FOR INSERT TO public
WITH CHECK (length(email) <= 320);
