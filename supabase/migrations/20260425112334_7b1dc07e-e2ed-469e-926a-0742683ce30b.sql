
-- 1. VAT-qualifying flag on listings
ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS vat_qualifying boolean NOT NULL DEFAULT false;

-- 2. Test drive bookings
CREATE TABLE IF NOT EXISTS public.test_drive_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  dealer_id uuid,
  buyer_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  preferred_date date,
  preferred_time text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.test_drive_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit test drive booking"
  ON public.test_drive_bookings FOR INSERT TO public
  WITH CHECK (
    length(name) BETWEEN 1 AND 200
    AND length(email) BETWEEN 3 AND 320
    AND (phone IS NULL OR length(phone) <= 40)
    AND (message IS NULL OR length(message) <= 2000)
    AND status = 'pending'
  );

CREATE POLICY "Dealers view own bookings"
  ON public.test_drive_bookings FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.dealers d
            WHERE d.id = test_drive_bookings.dealer_id AND d.user_id = auth.uid())
    OR auth.uid() = buyer_id
  );

CREATE POLICY "Dealers update own bookings"
  ON public.test_drive_bookings FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.dealers d
            WHERE d.id = test_drive_bookings.dealer_id AND d.user_id = auth.uid())
  );

CREATE POLICY "Admins manage all bookings"
  ON public.test_drive_bookings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_test_drive_bookings_updated
  BEFORE UPDATE ON public.test_drive_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_dealer ON public.test_drive_bookings(dealer_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_listing ON public.test_drive_bookings(listing_id);

-- 3. Vehicle finder requests
CREATE TABLE IF NOT EXISTS public.vehicle_finder_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL,
  buyer_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  make text,
  model text,
  year_from integer,
  year_to integer,
  budget_max numeric,
  fuel_type text,
  transmission text,
  body_type text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_finder_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit finder request"
  ON public.vehicle_finder_requests FOR INSERT TO public
  WITH CHECK (
    length(name) BETWEEN 1 AND 200
    AND length(email) BETWEEN 3 AND 320
    AND (phone IS NULL OR length(phone) <= 40)
    AND (notes IS NULL OR length(notes) <= 2000)
    AND status = 'pending'
  );

CREATE POLICY "Dealers view own finder requests"
  ON public.vehicle_finder_requests FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.dealers d
            WHERE d.id = vehicle_finder_requests.dealer_id AND d.user_id = auth.uid())
    OR auth.uid() = buyer_id
  );

CREATE POLICY "Dealers update own finder requests"
  ON public.vehicle_finder_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.dealers d
            WHERE d.id = vehicle_finder_requests.dealer_id AND d.user_id = auth.uid())
  );

CREATE POLICY "Admins manage all finder requests"
  ON public.vehicle_finder_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_vehicle_finder_updated
  BEFORE UPDATE ON public.vehicle_finder_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_vehicle_finder_dealer ON public.vehicle_finder_requests(dealer_id);

-- 4. Transport quotes
CREATE TABLE IF NOT EXISTS public.transport_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  dealer_id uuid,
  buyer_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  delivery_postcode text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  quoted_price numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transport_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit transport quote"
  ON public.transport_quotes FOR INSERT TO public
  WITH CHECK (
    length(name) BETWEEN 1 AND 200
    AND length(email) BETWEEN 3 AND 320
    AND (phone IS NULL OR length(phone) <= 40)
    AND length(delivery_postcode) BETWEEN 2 AND 20
    AND (notes IS NULL OR length(notes) <= 2000)
    AND status = 'pending'
  );

CREATE POLICY "Dealers view own transport quotes"
  ON public.transport_quotes FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.dealers d
            WHERE d.id = transport_quotes.dealer_id AND d.user_id = auth.uid())
    OR auth.uid() = buyer_id
  );

CREATE POLICY "Dealers update own transport quotes"
  ON public.transport_quotes FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.dealers d
            WHERE d.id = transport_quotes.dealer_id AND d.user_id = auth.uid())
  );

CREATE POLICY "Admins manage all transport quotes"
  ON public.transport_quotes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_transport_quotes_updated
  BEFORE UPDATE ON public.transport_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_transport_quotes_dealer ON public.transport_quotes(dealer_id);
CREATE INDEX IF NOT EXISTS idx_transport_quotes_listing ON public.transport_quotes(listing_id);
