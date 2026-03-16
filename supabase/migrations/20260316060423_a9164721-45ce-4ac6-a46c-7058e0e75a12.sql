
-- Price history table to track price changes
CREATE TABLE public.price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  old_price numeric NOT NULL,
  new_price numeric NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view price history" ON public.price_history FOR SELECT TO public USING (true);
CREATE POLICY "System can insert price history" ON public.price_history FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.car_listings WHERE id = listing_id AND seller_id = auth.uid())
);
CREATE POLICY "Admins can manage price history" ON public.price_history FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to auto-log price changes
CREATE OR REPLACE FUNCTION public.log_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO public.price_history (listing_id, old_price, new_price)
    VALUES (NEW.id, OLD.price, NEW.price);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_price_change
  BEFORE UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_price_change();

-- Inspection reports table
CREATE TABLE public.inspection_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  inspector_name text,
  score integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 200,
  report_url text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(listing_id)
);

ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view inspection reports" ON public.inspection_reports FOR SELECT TO public USING (true);
CREATE POLICY "Sellers can manage own inspections" ON public.inspection_reports FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.car_listings WHERE id = listing_id AND seller_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.car_listings WHERE id = listing_id AND seller_id = auth.uid())
);
CREATE POLICY "Admins can manage all inspections" ON public.inspection_reports FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Add promoted and video columns to car_listings
ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS is_promoted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS promoted_until timestamptz,
  ADD COLUMN IF NOT EXISTS inspection_score integer;

-- Index for promoted listings sort
CREATE INDEX IF NOT EXISTS idx_listings_promoted ON public.car_listings (is_promoted, promoted_until) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_price_history_listing ON public.price_history (listing_id, changed_at DESC);
