
-- Fix 1: Referrals INSERT policy - validate code against referral_codes and prevent user-supplied reward_amount
DROP POLICY IF EXISTS "Authenticated can insert referrals for self" ON public.referrals;
CREATE POLICY "Authenticated can insert referrals for self"
ON public.referrals FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = referred_id
  AND referrer_id != auth.uid()
  AND reward_amount = 0
  AND EXISTS (
    SELECT 1 FROM public.referral_codes rc
    WHERE rc.code = referrals.code AND rc.user_id = referrals.referrer_id
  )
);

-- Fix 2: Bug reports INSERT - restrict to authenticated users with own user_id
DROP POLICY IF EXISTS "Anyone can submit bug reports" ON public.bug_reports;
CREATE POLICY "Authenticated can submit bug reports"
ON public.bug_reports FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Fix 3: Tighten contact_messages INSERT to public but limit field lengths and force status
DROP POLICY IF EXISTS "Anyone can submit contact message" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact message"
ON public.contact_messages FOR INSERT TO public
WITH CHECK (
  length(name) <= 200
  AND length(email) <= 320
  AND length(subject) <= 500
  AND length(message) <= 5000
  AND status = 'new'
);

-- Fix 4: Create trigger to call price drop notification edge function
CREATE OR REPLACE FUNCTION public.notify_price_drop()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price AND NEW.price < OLD.price THEN
    -- Insert a notification for each user who saved this car
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT
      sc.user_id,
      'price_drop',
      'Price Drop Alert!',
      (NEW.title || ' dropped from $' || OLD.price::text || ' to $' || NEW.price::text),
      '/car/' || NEW.id
    FROM public.saved_cars sc
    WHERE sc.listing_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_price_drop
AFTER UPDATE ON public.car_listings
FOR EACH ROW
EXECUTE FUNCTION public.notify_price_drop();
