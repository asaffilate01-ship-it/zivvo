
-- 1. DEALER SAFETY TRIGGER: prevent dealers from modifying protected fields
CREATE OR REPLACE FUNCTION public.enforce_dealer_update_safety()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF jwt_role = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.tier IS DISTINCT FROM OLD.tier
     OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
     OR NEW.max_listings IS DISTINCT FROM OLD.max_listings
     OR NEW.kyc_verified IS DISTINCT FROM OLD.kyc_verified
     OR NEW.kyc_approved_at IS DISTINCT FROM OLD.kyc_approved_at
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.is_active IS DISTINCT FROM OLD.is_active
  THEN
    RAISE EXCEPTION 'Only admins can modify subscription, KYC, and tier fields on dealer records';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_dealer_update_safety
BEFORE UPDATE ON public.dealers
FOR EACH ROW
EXECUTE FUNCTION public.enforce_dealer_update_safety();

-- 2. LISTING INSERT SAFETY: prevent sellers from setting protected fields on INSERT
CREATE OR REPLACE FUNCTION public.enforce_listing_insert_safety()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF jwt_role = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Force safe defaults on insert for non-admin users
  NEW.verified := false;
  NEW.is_featured := false;
  NEW.is_promoted := false;
  NEW.promoted_until := NULL;
  NEW.finance_check_clear := NULL;
  NEW.legal_check_clear := NULL;
  NEW.inspection_score := NULL;
  NEW.hpi_check_data := NULL;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_listing_insert_safety
BEFORE INSERT ON public.car_listings
FOR EACH ROW
EXECUTE FUNCTION public.enforce_listing_insert_safety();
