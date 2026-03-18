
-- Delivery tracking table for auctions and trade stock
CREATE TABLE public.delivery_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('auction', 'arbitrage')),
  reference_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'collected', 'in_transit', 'delivered', 'cancelled')),
  pickup_address TEXT,
  delivery_address TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  collected_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  courier_name TEXT,
  courier_reference TEXT,
  delivery_cost NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins manage all deliveries" ON public.delivery_tracking FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parties can view own deliveries" ON public.delivery_tracking FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Parties can create deliveries" ON public.delivery_tracking FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Parties can update own deliveries" ON public.delivery_tracking FOR UPDATE TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Updated_at trigger
CREATE TRIGGER update_delivery_tracking_updated_at BEFORE UPDATE ON public.delivery_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for delivery tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;
