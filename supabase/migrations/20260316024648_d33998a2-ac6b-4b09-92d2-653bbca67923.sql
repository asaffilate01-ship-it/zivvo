-- Harden enquiries/messages RLS and update paths

-- 1) Replace over-permissive sender ALL policy on enquiries
DROP POLICY IF EXISTS "Senders can manage own enquiries" ON public.enquiries;

CREATE POLICY "Senders can view own enquiries"
  ON public.enquiries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Senders can delete own enquiries"
  ON public.enquiries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Senders can create enquiries for actual listing seller"
  ON public.enquiries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1
      FROM public.car_listings cl
      WHERE cl.id = enquiries.listing_id
        AND cl.seller_id = enquiries.seller_id
        AND cl.status = 'active'
    )
  );

-- 2) Tighten seller reply UPDATE policy on enquiries
DROP POLICY IF EXISTS "Sellers can reply to enquiries" ON public.enquiries;
CREATE POLICY "Sellers can reply to enquiries"
  ON public.enquiries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- 3) Enforce column-level update safety via trigger (enquiries)
CREATE OR REPLACE FUNCTION public.enforce_enquiry_update_safety()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
BEGIN
  -- Allow service role and admins full update capability
  IF jwt_role = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Non-admin users cannot mutate immutable sender/listing fields
  IF NEW.listing_id IS DISTINCT FROM OLD.listing_id
     OR NEW.seller_id IS DISTINCT FROM OLD.seller_id
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.sender_name IS DISTINCT FROM OLD.sender_name
     OR NEW.sender_email IS DISTINCT FROM OLD.sender_email
     OR NEW.sender_phone IS DISTINCT FROM OLD.sender_phone
     OR NEW.message IS DISTINCT FROM OLD.message
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Only reply/status fields can be updated on enquiries';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_enquiry_update_safety_trigger ON public.enquiries;
CREATE TRIGGER enforce_enquiry_update_safety_trigger
BEFORE UPDATE ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.enforce_enquiry_update_safety();

-- 4) Tighten messages recipient UPDATE policy
DROP POLICY IF EXISTS "Recipients can update read status" ON public.messages;
CREATE POLICY "Recipients can update read status"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- 5) Enforce message update safety via trigger (read-only updates for recipients)
CREATE OR REPLACE FUNCTION public.enforce_message_update_safety()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
BEGIN
  -- Allow service role and admins full update capability
  IF jwt_role = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Non-admin users may only update the read flag
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id
     OR NEW.listing_id IS DISTINCT FROM OLD.listing_id
     OR NEW.content IS DISTINCT FROM OLD.content
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Only read status can be updated on messages';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_message_update_safety_trigger ON public.messages;
CREATE TRIGGER enforce_message_update_safety_trigger
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.enforce_message_update_safety();