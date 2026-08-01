
-- Arbitrage deal status
CREATE TYPE public.arbitrage_status AS ENUM (
  'sourced',           -- Platform identified the car
  'offer_sent',        -- Offer sent to seller
  'seller_accepted',   -- Seller accepted our buy price
  'seller_rejected',   -- Seller rejected
  'acquired',          -- Platform acquired the car (funds held)
  'listed_to_dealers', -- Offered to dealer network at markup
  'dealer_accepted',   -- A dealer accepted and paid
  'seller_paid',       -- Seller paid out
  'completed',         -- Deal fully closed
  'cancelled'          -- Deal fell through
);

-- Main arbitrage deals table
CREATE TABLE public.arbitrage_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  
  -- Parties
  seller_id UUID NOT NULL,
  buyer_dealer_id UUID REFERENCES public.dealers(id),
  sourced_by UUID, -- admin/agent who sourced the deal
  
  -- Pricing
  seller_price NUMERIC NOT NULL,        -- what we offer the seller
  platform_markup NUMERIC NOT NULL DEFAULT 0, -- our profit margin
  dealer_price NUMERIC NOT NULL,        -- seller_price + markup = what dealer pays us
  markup_pct NUMERIC,                   -- for display
  
  -- Status
  status arbitrage_status NOT NULL DEFAULT 'sourced',
  
  -- Seller side
  seller_offer_sent_at TIMESTAMP WITH TIME ZONE,
  seller_accepted_at TIMESTAMP WITH TIME ZONE,
  seller_paid_at TIMESTAMP WITH TIME ZONE,
  seller_payment_ref TEXT,
  
  -- Dealer side
  dealer_offer_sent_at TIMESTAMP WITH TIME ZONE,
  dealer_accepted_at TIMESTAMP WITH TIME ZONE,
  dealer_paid_at TIMESTAMP WITH TIME ZONE,
  dealer_payment_ref TEXT,
  
  -- Logistics
  collection_arranged BOOLEAN DEFAULT false,
  delivery_arranged BOOLEAN DEFAULT false,
  delivery_cost NUMERIC DEFAULT 0,
  
  -- Notes
  admin_notes TEXT,
  rejection_reason TEXT,
  
  country TEXT NOT NULL DEFAULT 'GB',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Arbitrage audit log
CREATE TABLE public.arbitrage_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.arbitrage_deals(id) ON DELETE CASCADE,
  actor_id UUID,
  actor_role TEXT, -- admin, seller, dealer, system
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_arbitrage_deals_status ON public.arbitrage_deals(status);
CREATE INDEX idx_arbitrage_deals_seller ON public.arbitrage_deals(seller_id);
CREATE INDEX idx_arbitrage_deals_dealer ON public.arbitrage_deals(buyer_dealer_id);
CREATE INDEX idx_arbitrage_audit_deal ON public.arbitrage_audit_log(deal_id);

-- Enable RLS
ALTER TABLE public.arbitrage_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbitrage_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can do everything
CREATE POLICY "Admins manage all arbitrage deals" ON public.arbitrage_deals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Sellers can view deals on their listings
CREATE POLICY "Sellers view own arbitrage deals" ON public.arbitrage_deals FOR SELECT TO authenticated
  USING (auth.uid() = seller_id);

-- Sellers can update (accept/reject) their deals
CREATE POLICY "Sellers can respond to offers" ON public.arbitrage_deals FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id AND status IN ('offer_sent'))
  WITH CHECK (auth.uid() = seller_id);

-- Dealers can view deals offered to them
CREATE POLICY "Dealers view offered deals" ON public.arbitrage_deals FOR SELECT TO authenticated
  USING (
    status IN ('listed_to_dealers', 'dealer_accepted', 'completed')
    AND (
      buyer_dealer_id IS NULL  -- available to all dealers when listed
      OR EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = buyer_dealer_id AND d.user_id = auth.uid())
    )
  );

-- Dealers can accept deals
CREATE POLICY "Dealers can accept deals" ON public.arbitrage_deals FOR UPDATE TO authenticated
  USING (
    status = 'listed_to_dealers'
    AND EXISTS (SELECT 1 FROM public.dealers d WHERE d.user_id = auth.uid() AND d.is_active = true)
  );

-- Audit log RLS
CREATE POLICY "Admins view all arbitrage audit" ON public.arbitrage_audit_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Parties view own arbitrage audit" ON public.arbitrage_audit_log FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.arbitrage_deals ad
    WHERE ad.id = deal_id AND (ad.seller_id = auth.uid() OR EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = ad.buyer_dealer_id AND d.user_id = auth.uid()))
  ));

CREATE POLICY "Users insert own arbitrage audit" ON public.arbitrage_audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id OR public.has_role(auth.uid(), 'admin'));

-- Trigger for status change audit
CREATE OR REPLACE FUNCTION public.audit_arbitrage_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.arbitrage_audit_log (deal_id, actor_id, actor_role, action, details)
    VALUES (NEW.id, auth.uid(), 'system', 'status_changed', jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_arbitrage_status_change
  BEFORE UPDATE ON public.arbitrage_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_arbitrage_status_change();
