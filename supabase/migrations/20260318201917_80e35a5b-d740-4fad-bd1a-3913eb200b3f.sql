
-- Portal syndication system for multi-portal listing distribution

-- Supported portals enum
CREATE TYPE public.portal_name AS ENUM ('autotrader', 'ebay_motors', 'pistonheads', 'gumtree', 'cazoo', 'motors_co_uk');

-- Syndication status enum
CREATE TYPE public.syndication_status AS ENUM ('pending', 'synced', 'failed', 'removed', 'updating');

-- Dealer portal configurations (API credentials per portal per dealer)
CREATE TABLE public.dealer_portal_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  portal portal_name NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  api_key TEXT,
  api_secret TEXT,
  dealer_ref TEXT, -- portal-specific dealer/advertiser ID
  feed_url TEXT, -- for CSV/XML feed portals
  config JSONB DEFAULT '{}'::jsonb, -- portal-specific settings
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dealer_id, portal)
);

ALTER TABLE public.dealer_portal_configs ENABLE ROW LEVEL SECURITY;

-- RLS: dealers manage own, admins manage all
CREATE POLICY "Dealers manage own portal configs"
  ON public.dealer_portal_configs FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM dealers d WHERE d.id = dealer_portal_configs.dealer_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM dealers d WHERE d.id = dealer_portal_configs.dealer_id AND d.user_id = auth.uid()));

CREATE POLICY "Admins manage all portal configs"
  ON public.dealer_portal_configs FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Syndication log (tracks each listing push to each portal)
CREATE TABLE public.syndication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  portal portal_name NOT NULL,
  status syndication_status NOT NULL DEFAULT 'pending',
  external_id TEXT, -- ID on the external portal
  external_url TEXT, -- link on the external portal
  error_message TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, portal)
);

ALTER TABLE public.syndication_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers view own syndication logs"
  ON public.syndication_log FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM dealers d WHERE d.id = syndication_log.dealer_id AND d.user_id = auth.uid()));

CREATE POLICY "Admins manage all syndication logs"
  ON public.syndication_log FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at
CREATE TRIGGER update_dealer_portal_configs_updated_at
  BEFORE UPDATE ON public.dealer_portal_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_syndication_log_updated_at
  BEFORE UPDATE ON public.syndication_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
