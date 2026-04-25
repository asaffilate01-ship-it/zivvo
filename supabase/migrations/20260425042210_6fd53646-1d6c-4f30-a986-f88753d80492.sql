
-- 1. Vehicle costs (HMRC stock book + profit tracking)
CREATE TABLE public.vehicle_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL,
  dealer_id UUID NOT NULL,
  category TEXT NOT NULL, -- 'purchase' | 'recon' | 'transport' | 'valeting' | 'advertising' | 'parts' | 'labour' | 'other'
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  vat_amount NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  invoice_ref TEXT,
  cost_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vehicle_costs_listing ON public.vehicle_costs(listing_id);
CREATE INDEX idx_vehicle_costs_dealer ON public.vehicle_costs(dealer_id);
ALTER TABLE public.vehicle_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all vehicle costs" ON public.vehicle_costs
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Dealer owners manage own costs" ON public.vehicle_costs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM dealers d WHERE d.id = vehicle_costs.dealer_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM dealers d WHERE d.id = vehicle_costs.dealer_id AND d.user_id = auth.uid()));

CREATE TRIGGER trg_vehicle_costs_updated_at BEFORE UPDATE ON public.vehicle_costs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Stock book entries (HMRC required record of purchases & sales)
CREATE TABLE public.stock_book_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL,
  listing_id UUID,
  entry_type TEXT NOT NULL, -- 'purchase' | 'sale'
  registration TEXT,
  make TEXT,
  model TEXT,
  vin TEXT,
  mileage INTEGER,
  party_name TEXT, -- seller (for purchase) or buyer (for sale)
  party_address TEXT,
  party_email TEXT,
  party_phone TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_book_dealer ON public.stock_book_entries(dealer_id);
CREATE INDEX idx_stock_book_date ON public.stock_book_entries(entry_date);
ALTER TABLE public.stock_book_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all stock book" ON public.stock_book_entries
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Dealer owners manage own stock book" ON public.stock_book_entries
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM dealers d WHERE d.id = stock_book_entries.dealer_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM dealers d WHERE d.id = stock_book_entries.dealer_id AND d.user_id = auth.uid()));

CREATE TRIGGER trg_stock_book_updated_at BEFORE UPDATE ON public.stock_book_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Dealer staff (multi-user accounts under one dealer)
CREATE TYPE public.dealer_staff_role AS ENUM ('manager', 'sales', 'admin_assistant');

CREATE TABLE public.dealer_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL,
  user_id UUID, -- null until invitation accepted
  email TEXT NOT NULL,
  full_name TEXT,
  role dealer_staff_role NOT NULL DEFAULT 'sales',
  invite_token TEXT UNIQUE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dealer_id, email)
);
CREATE INDEX idx_dealer_staff_user ON public.dealer_staff(user_id);
CREATE INDEX idx_dealer_staff_dealer ON public.dealer_staff(dealer_id);
ALTER TABLE public.dealer_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all dealer staff" ON public.dealer_staff
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Dealer owners manage own staff" ON public.dealer_staff
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM dealers d WHERE d.id = dealer_staff.dealer_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM dealers d WHERE d.id = dealer_staff.dealer_id AND d.user_id = auth.uid()));

CREATE POLICY "Staff view own membership" ON public.dealer_staff
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER trg_dealer_staff_updated_at BEFORE UPDATE ON public.dealer_staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function: is the current user a staff member of a given dealer?
CREATE OR REPLACE FUNCTION public.is_dealer_staff(_dealer_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dealer_staff
    WHERE dealer_id = _dealer_id
      AND user_id = _user_id
      AND is_active = true
      AND accepted_at IS NOT NULL
  );
$$;

-- 4. Reservation deposits (refundable holds buyers pay on dealer landing pages)
CREATE TABLE public.reservation_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL,
  listing_id UUID NOT NULL,
  buyer_id UUID,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'gbp',
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | refunded | applied_to_sale | cancelled
  expires_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reservation_deposits_dealer ON public.reservation_deposits(dealer_id);
CREATE INDEX idx_reservation_deposits_listing ON public.reservation_deposits(listing_id);
CREATE INDEX idx_reservation_deposits_buyer ON public.reservation_deposits(buyer_id);
ALTER TABLE public.reservation_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all reservations" ON public.reservation_deposits
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Dealer owners view own reservations" ON public.reservation_deposits
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM dealers d WHERE d.id = reservation_deposits.dealer_id AND d.user_id = auth.uid()));

CREATE POLICY "Dealer owners update own reservations" ON public.reservation_deposits
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM dealers d WHERE d.id = reservation_deposits.dealer_id AND d.user_id = auth.uid()));

CREATE POLICY "Buyers view own reservations" ON public.reservation_deposits
  FOR SELECT TO authenticated USING (auth.uid() = buyer_id);

CREATE POLICY "Anyone can create a reservation" ON public.reservation_deposits
  FOR INSERT TO authenticated, anon WITH CHECK (status = 'pending');

CREATE TRIGGER trg_reservation_deposits_updated_at BEFORE UPDATE ON public.reservation_deposits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Profit summary view per listing (purchase price + costs vs sale price)
CREATE OR REPLACE VIEW public.dealer_vehicle_profit AS
SELECT
  cl.id AS listing_id,
  cl.dealer_id,
  cl.title,
  cl.make,
  cl.model,
  cl.year,
  cl.price AS asking_price,
  cl.status,
  COALESCE((SELECT SUM(amount) FROM public.vehicle_costs vc WHERE vc.listing_id = cl.id AND vc.category = 'purchase'), 0) AS purchase_cost,
  COALESCE((SELECT SUM(amount) FROM public.vehicle_costs vc WHERE vc.listing_id = cl.id AND vc.category != 'purchase'), 0) AS additional_costs,
  COALESCE((SELECT SUM(amount) FROM public.vehicle_costs vc WHERE vc.listing_id = cl.id), 0) AS total_costs,
  COALESCE((SELECT SUM(vat_amount) FROM public.vehicle_costs vc WHERE vc.listing_id = cl.id), 0) AS total_vat,
  COALESCE((SELECT amount FROM public.stock_book_entries sb WHERE sb.listing_id = cl.id AND sb.entry_type = 'sale' ORDER BY entry_date DESC LIMIT 1), NULL) AS sale_price,
  cl.created_at
FROM public.car_listings cl
WHERE cl.dealer_id IS NOT NULL;
