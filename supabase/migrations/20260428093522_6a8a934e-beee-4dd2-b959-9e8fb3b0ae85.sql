-- Inspection bookings status enum
DO $$ BEGIN
  CREATE TYPE public.inspection_status AS ENUM (
    'pending_payment', 'paid', 'scheduled', 'in_progress', 'completed', 'cancelled', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.inspection_type AS ENUM ('standard_200', 'premium_300');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.inspection_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  inspector_id uuid,
  status public.inspection_status NOT NULL DEFAULT 'pending_payment',
  inspection_type public.inspection_type NOT NULL DEFAULT 'standard_200',
  price numeric(10,2) NOT NULL DEFAULT 249.00,
  currency text NOT NULL DEFAULT 'GBP',
  stripe_session_id text,
  stripe_payment_intent_id text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  score integer,
  total_points integer NOT NULL DEFAULT 200,
  report_url text,
  report_summary jsonb,
  inspector_notes text,
  buyer_phone text,
  buyer_address text,
  buyer_notes text,
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspection_bookings_listing ON public.inspection_bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_inspection_bookings_buyer ON public.inspection_bookings(buyer_id);
CREATE INDEX IF NOT EXISTS idx_inspection_bookings_seller ON public.inspection_bookings(seller_id);
CREATE INDEX IF NOT EXISTS idx_inspection_bookings_status ON public.inspection_bookings(status);

ALTER TABLE public.inspection_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers view own bookings" ON public.inspection_bookings
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers view bookings for their listings" ON public.inspection_bookings
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Admins view all bookings" ON public.inspection_bookings
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Buyers create bookings" ON public.inspection_bookings
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers update own pending bookings" ON public.inspection_bookings
  FOR UPDATE USING (auth.uid() = buyer_id AND status IN ('pending_payment', 'paid'));

CREATE POLICY "Admins update all bookings" ON public.inspection_bookings
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_inspection_bookings_updated_at
  BEFORE UPDATE ON public.inspection_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add inspection_report_url to car_listings (inspection_score already exists)
ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS inspection_report_url text,
  ADD COLUMN IF NOT EXISTS inspection_completed_at timestamptz;
