-- 1. Saved searches: track last notified time
ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS last_notified_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_saved_searches_notify ON public.saved_searches(notify) WHERE notify = true;

-- 2. Listings: price drop timestamp + index
ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS price_dropped_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_price_dropped_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price AND NEW.price < OLD.price THEN
    NEW.price_dropped_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_price_dropped_at ON public.car_listings;
CREATE TRIGGER trg_set_price_dropped_at
  BEFORE UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_price_dropped_at();

CREATE INDEX IF NOT EXISTS idx_car_listings_price_dropped ON public.car_listings(price_dropped_at DESC) WHERE price_dropped_at IS NOT NULL;

-- 3. Enquiry notifications to sellers
CREATE OR REPLACE FUNCTION public.notify_seller_on_enquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  listing_title text;
BEGIN
  SELECT title INTO listing_title FROM public.car_listings WHERE id = NEW.listing_id;
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.seller_id,
    'enquiry',
    'New enquiry received',
    COALESCE(NEW.sender_name, 'A buyer') || ' enquired about ' || COALESCE(listing_title, 'your listing'),
    '/inbox'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_seller_on_enquiry ON public.enquiries;
CREATE TRIGGER trg_notify_seller_on_enquiry
  AFTER INSERT ON public.enquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_seller_on_enquiry();

-- 4. Helper RPC: insert a notification (used by matcher edge function via service role)
-- Service role bypasses RLS, no extra grants needed.