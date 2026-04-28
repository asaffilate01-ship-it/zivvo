-- Add inspector to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'inspector';

-- Inspector profiles
CREATE TABLE IF NOT EXISTS public.inspector_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text,
  email text,
  qualifications text,
  years_experience integer DEFAULT 0,
  profile_photo_url text,
  bio text,
  -- Coverage
  coverage_postcodes text[] DEFAULT '{}',
  base_latitude double precision,
  base_longitude double precision,
  base_address text,
  max_travel_miles integer DEFAULT 30,
  -- Status
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  total_inspections integer DEFAULT 0,
  avg_score_given numeric(5,2),
  rating numeric(3,2) DEFAULT 5.0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspector_profiles_user ON public.inspector_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_inspector_profiles_active ON public.inspector_profiles(is_active, is_verified);

ALTER TABLE public.inspector_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inspectors view own profile"
  ON public.inspector_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Inspectors update own profile"
  ON public.inspector_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND is_verified = (SELECT is_verified FROM public.inspector_profiles WHERE id = inspector_profiles.id));

CREATE POLICY "Admins manage inspector profiles"
  ON public.inspector_profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public view active verified inspectors"
  ON public.inspector_profiles FOR SELECT
  USING (is_active = true AND is_verified = true);

CREATE TRIGGER update_inspector_profiles_updated_at
  BEFORE UPDATE ON public.inspector_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Scorecards
CREATE TABLE IF NOT EXISTS public.inspection_scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.inspection_bookings(id) ON DELETE CASCADE,
  inspector_id uuid NOT NULL,
  checklist jsonb NOT NULL DEFAULT '{}',
  overall_notes text,
  recommendation text,
  score integer DEFAULT 0,
  total_points integer DEFAULT 200,
  grade text,
  pdf_url text,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scorecards_booking ON public.inspection_scorecards(booking_id);
CREATE INDEX IF NOT EXISTS idx_scorecards_inspector ON public.inspection_scorecards(inspector_id);

ALTER TABLE public.inspection_scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inspectors manage own scorecards"
  ON public.inspection_scorecards FOR ALL
  USING (auth.uid() = inspector_id)
  WITH CHECK (auth.uid() = inspector_id);

CREATE POLICY "Admins manage all scorecards"
  ON public.inspection_scorecards FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Buyers view scorecards for their bookings"
  ON public.inspection_scorecards FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.inspection_bookings ib
    WHERE ib.id = inspection_scorecards.booking_id
      AND (ib.buyer_id = auth.uid() OR ib.seller_id = auth.uid())
  ));

CREATE TRIGGER update_inspection_scorecards_updated_at
  BEFORE UPDATE ON public.inspection_scorecards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inspector access to assigned bookings
CREATE POLICY "Inspectors view assigned bookings"
  ON public.inspection_bookings FOR SELECT
  USING (auth.uid() = inspector_id);

CREATE POLICY "Inspectors update assigned bookings"
  ON public.inspection_bookings FOR UPDATE
  USING (auth.uid() = inspector_id);

-- Storage bucket for inspection photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Inspectors upload inspection photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'inspection-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Inspectors view own inspection photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'inspection-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins manage all inspection photos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'inspection-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Buyers view inspection photos for their bookings"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'inspection-photos'
    AND EXISTS (
      SELECT 1 FROM public.inspection_scorecards sc
      JOIN public.inspection_bookings ib ON ib.id = sc.booking_id
      WHERE (ib.buyer_id = auth.uid() OR ib.seller_id = auth.uid())
        AND name LIKE sc.inspector_id::text || '/%'
    )
  );