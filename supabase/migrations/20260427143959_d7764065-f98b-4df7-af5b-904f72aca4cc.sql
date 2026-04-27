
-- First-party analytics: page views and conversion events
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  user_id uuid,
  session_id text,
  country text,
  device text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON public.page_views (path);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON public.page_views (session_id);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone (logged in or not) can record a page view, but only with limited columns
CREATE POLICY "Anyone can record a page view"
  ON public.page_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(path) <= 500
    AND (referrer IS NULL OR length(referrer) <= 500)
    AND (session_id IS NULL OR length(session_id) <= 64)
    AND (country IS NULL OR length(country) <= 8)
    AND (device IS NULL OR length(device) <= 32)
    AND (utm_source IS NULL OR length(utm_source) <= 100)
    AND (utm_medium IS NULL OR length(utm_medium) <= 100)
    AND (utm_campaign IS NULL OR length(utm_campaign) <= 100)
  );

-- Only admins can read raw analytics
CREATE POLICY "Admins can read page views"
  ON public.page_views
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Conversion events (signup, listing_created, enquiry_sent, dealer_subscribed, etc.)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  user_id uuid,
  session_id text,
  path text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events (event_name);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record an event"
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(event_name) <= 100
    AND (path IS NULL OR length(path) <= 500)
    AND (session_id IS NULL OR length(session_id) <= 64)
  );

CREATE POLICY "Admins can read analytics events"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
