-- Sale type enum
DO $$ BEGIN
  CREATE TYPE public.sale_type AS ENUM ('own', 'consignment', 'trade');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add verification fields to car_listings
ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS sale_type public.sale_type NOT NULL DEFAULT 'own',
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS owner_address text,
  ADD COLUMN IF NOT EXISTS consignment_agreement_url text,
  ADD COLUMN IF NOT EXISTS photo_id_url text,
  ADD COLUMN IF NOT EXISTS trade_invoice_url text,
  ADD COLUMN IF NOT EXISTS finance_outstanding boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS finance_lender text,
  ADD COLUMN IF NOT EXISTS finance_settlement_amount numeric,
  ADD COLUMN IF NOT EXISTS finance_settlement_letter_url text,
  ADD COLUMN IF NOT EXISTS truth_declaration_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS truth_declaration_at timestamptz,
  ADD COLUMN IF NOT EXISTS truth_declaration_ip text,
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS verification_rejected_reason text;

-- Update the safety trigger so non-admin users can't self-approve verification fields
-- (logbook_url, photo_id_url, etc. CAN be set by seller, but admin-only fields stay locked)
CREATE OR REPLACE FUNCTION public.enforce_listing_update_safety()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
     OR NEW.verification_notes IS DISTINCT FROM OLD.verification_notes
     OR NEW.verification_rejected_reason IS DISTINCT FROM OLD.verification_rejected_reason
  THEN
    RAISE EXCEPTION 'Only admins can modify verification, promotion, and check fields';
  END IF;

  RETURN NEW;
END;
$function$;