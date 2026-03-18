
-- Auction watchers table
CREATE TABLE public.auction_watchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(auction_id, user_id)
);

ALTER TABLE public.auction_watchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can watch auctions" ON public.auction_watchers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unwatch auctions" ON public.auction_watchers
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own watches" ON public.auction_watchers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all watchers" ON public.auction_watchers
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to update watchers_count on auctions
CREATE OR REPLACE FUNCTION public.update_auction_watchers_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.auctions SET watchers_count = watchers_count + 1 WHERE id = NEW.auction_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.auctions SET watchers_count = GREATEST(watchers_count - 1, 0) WHERE id = OLD.auction_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_watchers_count
AFTER INSERT OR DELETE ON public.auction_watchers
FOR EACH ROW EXECUTE FUNCTION public.update_auction_watchers_count();

-- Auto-bid trigger: process proxy bids when a new bid is placed
CREATE OR REPLACE FUNCTION public.process_auto_bids()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auto_bidder RECORD;
  next_amount numeric;
  min_inc numeric;
  current numeric;
BEGIN
  -- Get the current highest bid amount after the trigger bid
  SELECT a.current_bid INTO current FROM public.auctions a WHERE a.id = NEW.auction_id;
  
  -- Find auto-bidders who can outbid (excluding the person who just bid)
  FOR auto_bidder IN
    SELECT DISTINCT ON (bidder_id) bidder_id, max_auto_bid
    FROM public.auction_bids
    WHERE auction_id = NEW.auction_id
      AND max_auto_bid IS NOT NULL
      AND max_auto_bid > current
      AND bidder_id != NEW.bidder_id
      AND is_auto_bid = false
    ORDER BY bidder_id, max_auto_bid DESC
  LOOP
    -- Calculate minimum increment
    IF current < 1000 THEN min_inc := 50;
    ELSIF current < 5000 THEN min_inc := 100;
    ELSIF current < 20000 THEN min_inc := 250;
    ELSIF current < 50000 THEN min_inc := 500;
    ELSE min_inc := 1000;
    END IF;
    
    next_amount := current + min_inc;
    
    IF next_amount <= auto_bidder.max_auto_bid THEN
      INSERT INTO public.auction_bids (auction_id, bidder_id, amount, is_auto_bid, max_auto_bid, deposit_verified)
      VALUES (NEW.auction_id, auto_bidder.bidder_id, next_amount, true, auto_bidder.max_auto_bid, true);
      
      -- Only process one auto-bid per trigger
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_process_auto_bids
AFTER INSERT ON public.auction_bids
FOR EACH ROW
WHEN (NEW.is_auto_bid = false)
EXECUTE FUNCTION public.process_auto_bids();

-- Enable realtime for auction_watchers
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_watchers;
