-- Add payment_deadline to auction_escrow for 72-hour tracking
ALTER TABLE public.auction_escrow ADD COLUMN IF NOT EXISTS payment_deadline timestamp with time zone;

-- Add finance pre-approval fields to auction_deposits
ALTER TABLE public.auction_deposits ADD COLUMN IF NOT EXISTS finance_provider text;
ALTER TABLE public.auction_deposits ADD COLUMN IF NOT EXISTS finance_reference text;
ALTER TABLE public.auction_deposits ADD COLUMN IF NOT EXISTS finance_amount numeric;

-- Create outbid notification trigger
CREATE OR REPLACE FUNCTION public.notify_outbid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  prev_winner RECORD;
  auction_listing RECORD;
BEGIN
  SELECT ab.bidder_id, ab.amount INTO prev_winner
  FROM public.auction_bids ab
  WHERE ab.auction_id = NEW.auction_id
    AND ab.id != NEW.id
    AND ab.is_winning = true
  LIMIT 1;

  IF prev_winner IS NOT NULL AND prev_winner.bidder_id != NEW.bidder_id THEN
    SELECT cl.make, cl.model, cl.year INTO auction_listing
    FROM public.auctions a
    JOIN public.car_listings cl ON cl.id = a.listing_id
    WHERE a.id = NEW.auction_id;

    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      prev_winner.bidder_id,
      'auction',
      'You''ve been outbid! 🔔',
      'Someone bid ' || NEW.amount::text || ' on ' || auction_listing.year || ' ' || auction_listing.make || ' ' || auction_listing.model || '. Your bid was ' || prev_winner.amount::text,
      '/auction/' || NEW.auction_id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_outbid ON public.auction_bids;
CREATE TRIGGER trigger_notify_outbid
  AFTER INSERT ON public.auction_bids
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_outbid();