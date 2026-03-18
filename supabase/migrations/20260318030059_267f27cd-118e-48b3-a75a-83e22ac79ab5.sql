
-- Auction status enum
CREATE TYPE public.auction_status AS ENUM ('draft', 'pending_inspection', 'approved', 'live', 'ended', 'sold', 'reserve_not_met', 'cancelled');

-- Auction format enum
CREATE TYPE public.auction_format AS ENUM ('timed', 'live_event');

-- Escrow status enum
CREATE TYPE public.escrow_status AS ENUM ('pending_deposit', 'deposit_held', 'full_payment_held', 'released_to_seller', 'refunded', 'disputed');

-- Contract status enum
CREATE TYPE public.contract_status AS ENUM ('draft', 'pending_buyer', 'pending_seller', 'signed', 'completed', 'cancelled');

-- Main auctions table
CREATE TABLE public.auctions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  format auction_format NOT NULL DEFAULT 'timed',
  status auction_status NOT NULL DEFAULT 'draft',
  
  -- Pricing
  starting_price NUMERIC NOT NULL DEFAULT 0,
  reserve_price NUMERIC, -- secret, only visible to seller + admin
  current_bid NUMERIC DEFAULT 0,
  winning_bid_id UUID,
  buyer_premium_pct NUMERIC NOT NULL DEFAULT 3.0,
  seller_fee_pct NUMERIC NOT NULL DEFAULT 1.5,
  
  -- Timing
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  original_end_time TIMESTAMP WITH TIME ZONE,
  anti_snipe_extension_mins INTEGER NOT NULL DEFAULT 2,
  
  -- Live event
  live_event_name TEXT,
  live_event_date TIMESTAMP WITH TIME ZONE,
  lot_number INTEGER,
  
  -- Inspection & condition
  inspection_rating INTEGER CHECK (inspection_rating >= 1 AND inspection_rating <= 5),
  condition_report JSONB DEFAULT '{}'::jsonb,
  -- condition_report: { keys_count, spare_key, service_history, accident_history, warranty_info, assets_included, tyres_condition, paint_condition, interior_condition, mechanical_notes }
  
  hpi_clear BOOLEAN DEFAULT false,
  ownership_verified BOOLEAN DEFAULT false,
  seller_verified BOOLEAN DEFAULT false,
  
  -- Logistics
  delivery_available BOOLEAN DEFAULT true,
  delivery_cost_estimate NUMERIC,
  collection_address TEXT,
  
  -- Counts
  bid_count INTEGER DEFAULT 0,
  watchers_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bids table
CREATE TABLE public.auction_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  is_winning BOOLEAN DEFAULT false,
  is_auto_bid BOOLEAN DEFAULT false,
  max_auto_bid NUMERIC,
  deposit_verified BOOLEAN DEFAULT false,
  finance_preapproved BOOLEAN DEFAULT false,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deposits / pre-auth tracking
CREATE TABLE public.auction_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL DEFAULT 'card_preauth', -- card_preauth, finance_deposit
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, authorized, captured, released, failed
  authorized_at TIMESTAMP WITH TIME ZONE,
  captured_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Escrow
CREATE TABLE public.auction_escrow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  total_amount NUMERIC NOT NULL,
  buyer_premium NUMERIC NOT NULL DEFAULT 0,
  seller_fee NUMERIC NOT NULL DEFAULT 0,
  platform_revenue NUMERIC NOT NULL DEFAULT 0,
  status escrow_status NOT NULL DEFAULT 'pending_deposit',
  
  -- Release conditions
  v5c_received BOOLEAN DEFAULT false,
  keys_handed_over BOOLEAN DEFAULT false,
  contract_signed BOOLEAN DEFAULT false,
  
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- E-sign contracts
CREATE TABLE public.auction_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  escrow_id UUID REFERENCES public.auction_escrow(id),
  
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  
  contract_html TEXT,
  
  buyer_signed BOOLEAN DEFAULT false,
  buyer_signed_at TIMESTAMP WITH TIME ZONE,
  buyer_ip TEXT,
  
  seller_signed BOOLEAN DEFAULT false,
  seller_signed_at TIMESTAMP WITH TIME ZONE,
  seller_ip TEXT,
  
  status contract_status NOT NULL DEFAULT 'draft',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comprehensive audit log
CREATE TABLE public.auction_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID REFERENCES public.auctions(id) ON DELETE SET NULL,
  actor_id UUID,
  actor_role TEXT, -- buyer, seller, admin, system
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_auctions_status ON public.auctions(status);
CREATE INDEX idx_auctions_ends_at ON public.auctions(ends_at);
CREATE INDEX idx_auctions_seller ON public.auctions(seller_id);
CREATE INDEX idx_auction_bids_auction ON public.auction_bids(auction_id);
CREATE INDEX idx_auction_bids_bidder ON public.auction_bids(bidder_id);
CREATE INDEX idx_auction_audit_log_auction ON public.auction_audit_log(auction_id);
CREATE INDEX idx_auction_audit_log_actor ON public.auction_audit_log(actor_id);

-- Enable RLS on all tables
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_escrow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_audit_log ENABLE ROW LEVEL SECURITY;

-- AUCTIONS RLS
CREATE POLICY "Public can view live/ended auctions" ON public.auctions FOR SELECT TO public
  USING (status IN ('live', 'ended', 'sold', 'reserve_not_met'));

CREATE POLICY "Sellers can view own auctions" ON public.auctions FOR SELECT TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can create auctions" ON public.auctions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own draft auctions" ON public.auctions FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id AND status IN ('draft', 'pending_inspection'))
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all auctions" ON public.auctions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- BIDS RLS
CREATE POLICY "Anyone can view bids on live auctions" ON public.auction_bids FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.auctions a WHERE a.id = auction_id AND a.status IN ('live', 'ended', 'sold', 'reserve_not_met')));

CREATE POLICY "Verified users can place bids" ON public.auction_bids FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = bidder_id);

CREATE POLICY "Admins can manage all bids" ON public.auction_bids FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- DEPOSITS RLS
CREATE POLICY "Users can view own deposits" ON public.auction_deposits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deposits" ON public.auction_deposits FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all deposits" ON public.auction_deposits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ESCROW RLS
CREATE POLICY "Parties can view own escrow" ON public.auction_escrow FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Admins can manage all escrow" ON public.auction_escrow FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- CONTRACTS RLS
CREATE POLICY "Parties can view own contracts" ON public.auction_contracts FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Parties can update own contracts" ON public.auction_contracts FOR UPDATE TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Admins can manage all contracts" ON public.auction_contracts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- AUDIT LOG RLS
CREATE POLICY "Users can view own audit entries" ON public.auction_audit_log FOR SELECT TO authenticated
  USING (auth.uid() = actor_id OR EXISTS (
    SELECT 1 FROM public.auctions a WHERE a.id = auction_id AND (a.seller_id = auth.uid())
  ));

CREATE POLICY "System and admins can insert audit entries" ON public.auction_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all audit entries" ON public.auction_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for bids
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auctions;

-- Trigger to update auction current_bid and bid_count
CREATE OR REPLACE FUNCTION public.update_auction_on_bid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update auction current bid
  UPDATE public.auctions SET
    current_bid = NEW.amount,
    bid_count = bid_count + 1,
    winning_bid_id = NEW.id,
    updated_at = now()
  WHERE id = NEW.auction_id AND NEW.amount > current_bid;
  
  -- Mark previous winning bids as not winning
  UPDATE public.auction_bids SET is_winning = false
  WHERE auction_id = NEW.auction_id AND id != NEW.id AND is_winning = true;
  
  -- Mark this bid as winning if it's the highest
  IF (SELECT current_bid FROM public.auctions WHERE id = NEW.auction_id) = NEW.amount THEN
    NEW.is_winning := true;
  END IF;
  
  -- Anti-sniping: extend end time if bid placed in last 2 minutes
  UPDATE public.auctions SET
    ends_at = ends_at + (anti_snipe_extension_mins || ' minutes')::interval
  WHERE id = NEW.auction_id
    AND format = 'timed'
    AND status = 'live'
    AND ends_at - now() < (anti_snipe_extension_mins || ' minutes')::interval;
  
  -- Audit log
  INSERT INTO public.auction_audit_log (auction_id, actor_id, actor_role, action, details)
  VALUES (NEW.auction_id, NEW.bidder_id, 'buyer', 'bid_placed', jsonb_build_object('amount', NEW.amount, 'bid_id', NEW.id));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auction_bid_insert
  BEFORE INSERT ON public.auction_bids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_auction_on_bid();

-- Trigger for auction status changes audit
CREATE OR REPLACE FUNCTION public.audit_auction_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.auction_audit_log (auction_id, actor_id, actor_role, action, details)
    VALUES (NEW.id, auth.uid(), 'system', 'status_changed', jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auction_status_change
  AFTER UPDATE ON public.auctions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_auction_status_change();

-- Trigger for contract signing audit
CREATE OR REPLACE FUNCTION public.audit_contract_signing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.buyer_signed IS DISTINCT FROM NEW.buyer_signed AND NEW.buyer_signed = true THEN
    INSERT INTO public.auction_audit_log (auction_id, actor_id, actor_role, action, details)
    VALUES (NEW.auction_id, NEW.buyer_id, 'buyer', 'contract_signed', jsonb_build_object('contract_id', NEW.id));
  END IF;
  IF OLD.seller_signed IS DISTINCT FROM NEW.seller_signed AND NEW.seller_signed = true THEN
    INSERT INTO public.auction_audit_log (auction_id, actor_id, actor_role, action, details)
    VALUES (NEW.auction_id, NEW.seller_id, 'seller', 'contract_signed', jsonb_build_object('contract_id', NEW.id));
  END IF;
  -- Auto-complete when both sign
  IF NEW.buyer_signed = true AND NEW.seller_signed = true AND NEW.status != 'signed' THEN
    NEW.status := 'signed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_contract_update
  BEFORE UPDATE ON public.auction_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_contract_signing();
