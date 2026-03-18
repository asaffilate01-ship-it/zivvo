
-- Vehicle fingerprint tracking for anti-abuse
CREATE TABLE public.listing_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  registration text,
  mileage_band text,
  color text,
  fingerprint_hash text NOT NULL,
  payment_id text,
  paid_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers view own fingerprints" ON public.listing_fingerprints
  FOR SELECT TO authenticated USING (auth.uid() = seller_id);

CREATE POLICY "Admins manage all fingerprints" ON public.listing_fingerprints
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Call masking / audit log
CREATE TABLE public.call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.car_listings(id) ON DELETE SET NULL,
  caller_id uuid,
  seller_id uuid NOT NULL,
  masked_number text,
  caller_number text,
  seller_number text,
  duration_seconds integer DEFAULT 0,
  status text NOT NULL DEFAULT 'initiated',
  recording_url text,
  twilio_call_sid text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all call logs" ON public.call_logs
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers view own call logs" ON public.call_logs
  FOR SELECT TO authenticated USING (auth.uid() = seller_id);

-- Dealer performance metrics
CREATE TABLE public.dealer_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE UNIQUE,
  avg_response_time_mins integer DEFAULT 0,
  avg_sale_speed_days integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  total_enquiries integer DEFAULT 0,
  response_rate_pct numeric DEFAULT 0,
  rating_score numeric DEFAULT 0,
  last_calculated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.dealer_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view dealer performance" ON public.dealer_performance
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins manage dealer performance" ON public.dealer_performance
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Individual seller listing payments
CREATE TABLE public.listing_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'gbp',
  stripe_session_id text,
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending',
  listing_duration_days integer NOT NULL DEFAULT 90,
  expires_at timestamp with time zone,
  fingerprint_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers view own payments" ON public.listing_payments
  FOR SELECT TO authenticated USING (auth.uid() = seller_id);

CREATE POLICY "Admins manage all listing payments" ON public.listing_payments
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Function to compute vehicle fingerprint hash
CREATE OR REPLACE FUNCTION public.compute_vehicle_fingerprint(
  _make text, _model text, _year integer, _reg text, _mileage integer, _color text
) RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT md5(
    lower(coalesce(_make, '')) || '|' ||
    lower(coalesce(_model, '')) || '|' ||
    coalesce(_year::text, '') || '|' ||
    lower(coalesce(_reg, '')) || '|' ||
    CASE
      WHEN _mileage IS NULL THEN ''
      WHEN _mileage < 10000 THEN '0-10k'
      WHEN _mileage < 30000 THEN '10-30k'
      WHEN _mileage < 60000 THEN '30-60k'
      WHEN _mileage < 100000 THEN '60-100k'
      ELSE '100k+'
    END || '|' ||
    lower(coalesce(_color, ''))
  );
$$;

-- Trigger: detect vehicle detail changes and invalidate listing
CREATE OR REPLACE FUNCTION public.check_vehicle_fingerprint_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  old_hash text;
  new_hash text;
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
BEGIN
  -- Skip for admins and service role
  IF jwt_role = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  old_hash := public.compute_vehicle_fingerprint(OLD.make, OLD.model, OLD.year, OLD.registration, OLD.mileage, OLD.color);
  new_hash := public.compute_vehicle_fingerprint(NEW.make, NEW.model, NEW.year, NEW.registration, NEW.mileage, NEW.color);

  IF old_hash != new_hash THEN
    -- If vehicle details changed significantly, set status back to draft
    -- requiring a new payment
    NEW.status := 'draft';
    NEW.verified := false;
    
    -- Log the change
    INSERT INTO public.listing_fingerprints (listing_id, seller_id, make, model, year, registration, mileage_band, color, fingerprint_hash)
    VALUES (NEW.id, NEW.seller_id, NEW.make, NEW.model, NEW.year, NEW.registration,
      CASE
        WHEN NEW.mileage IS NULL THEN 'unknown'
        WHEN NEW.mileage < 10000 THEN '0-10k'
        WHEN NEW.mileage < 30000 THEN '10-30k'
        WHEN NEW.mileage < 60000 THEN '30-60k'
        WHEN NEW.mileage < 100000 THEN '60-100k'
        ELSE '100k+'
      END,
      NEW.color, new_hash);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_vehicle_fingerprint
  BEFORE UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_vehicle_fingerprint_change();
