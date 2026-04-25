
-- 1. car_listings: add source + external reference
ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_ref TEXT,
  ADD COLUMN IF NOT EXISTS source_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_car_listings_source ON public.car_listings(source);
CREATE INDEX IF NOT EXISTS idx_car_listings_external_ref ON public.car_listings(dealer_id, external_ref);

-- 2. dealer_integrations: per-dealer DMS credentials
CREATE TABLE IF NOT EXISTS public.dealer_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL,
  provider TEXT NOT NULL, -- 'virtualyard', 'click_dealer', 'autoit', 'codeweavers', etc.
  api_key TEXT, -- credential supplied by dealer
  api_secret TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sync_pull BOOLEAN NOT NULL DEFAULT true,
  sync_push BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_error TEXT,
  vehicles_imported INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dealer_id, provider)
);

ALTER TABLE public.dealer_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers manage own integrations"
  ON public.dealer_integrations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = dealer_integrations.dealer_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = dealer_integrations.dealer_id AND d.user_id = auth.uid()));

CREATE POLICY "Admins manage all integrations"
  ON public.dealer_integrations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_dealer_integrations_updated_at
  BEFORE UPDATE ON public.dealer_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. dms_sync_logs: history of every sync run
CREATE TABLE IF NOT EXISTS public.dms_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL,
  provider TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'pull' | 'push'
  status TEXT NOT NULL DEFAULT 'success', -- 'success' | 'error' | 'partial'
  items_processed INTEGER NOT NULL DEFAULT 0,
  items_created INTEGER NOT NULL DEFAULT 0,
  items_updated INTEGER NOT NULL DEFAULT 0,
  items_failed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dms_sync_logs_dealer ON public.dms_sync_logs(dealer_id, created_at DESC);

ALTER TABLE public.dms_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers view own sync logs"
  ON public.dms_sync_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = dms_sync_logs.dealer_id AND d.user_id = auth.uid()));

CREATE POLICY "Admins manage all sync logs"
  ON public.dms_sync_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. dealer_ingest_keys: Zivvo-issued keys for inbound feeds
CREATE TABLE IF NOT EXISTS public.dealer_ingest_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 of the key (we never store plaintext)
  key_prefix TEXT NOT NULL, -- first 8 chars for identification
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dealer_ingest_keys_dealer ON public.dealer_ingest_keys(dealer_id);

ALTER TABLE public.dealer_ingest_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers manage own ingest keys"
  ON public.dealer_ingest_keys FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = dealer_ingest_keys.dealer_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = dealer_ingest_keys.dealer_id AND d.user_id = auth.uid()));

CREATE POLICY "Admins manage all ingest keys"
  ON public.dealer_ingest_keys FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
