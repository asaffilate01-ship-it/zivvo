-- Zivvo production security boundary.
-- Apply in staging first, regenerate Supabase types, then run the smoke checklist in docs/PRODUCTION_RUNBOOK.md.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.inspection_bookings ALTER COLUMN currency SET DEFAULT 'EUR';
UPDATE public.inspection_bookings SET currency='EUR' WHERE currency='GBP' AND status='pending_payment';

-- Payment and operations ledgers ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('processing', 'succeeded', 'failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id text NOT NULL UNIQUE,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'eur' CHECK (currency = lower(currency)),
  paid_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_commissions ADD COLUMN IF NOT EXISTS source_invoice_id text;
CREATE UNIQUE INDEX IF NOT EXISTS agent_commissions_source_invoice_key
  ON public.agent_commissions(source_invoice_id) WHERE source_invoice_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.auction_finance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (char_length(provider) BETWEEN 2 AND 100),
  reference text NOT NULL CHECK (char_length(reference) BETWEEN 4 AND 120),
  requested_amount numeric(12,2) NOT NULL CHECK (requested_amount > 0),
  approved_amount numeric(12,2) CHECK (approved_amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (auction_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.auction_close_jobs (
  auction_id uuid PRIMARY KEY REFERENCES public.auctions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed')),
  attempt_count integer NOT NULL DEFAULT 0,
  last_error text,
  locked_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.function_rate_limits (
  bucket text NOT NULL,
  subject_hash text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  PRIMARY KEY (bucket, subject_hash, window_start)
);

CREATE TABLE IF NOT EXISTS public.staff_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid REFERENCES public.dealers(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('dealer_staff', 'agent', 'inspector')),
  token_hash text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL CHECK (expires_at <= created_at + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid REFERENCES public.dealers(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.car_listings(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  creative_url text,
  destination_path text NOT NULL CHECK (destination_path ~ '^/[A-Za-z0-9/_?=&.-]*$'),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.account_deletion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_hash text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  retention_reason text NOT NULL DEFAULT 'statutory_transaction_records'
);

ALTER TABLE public.dealer_integrations ADD COLUMN IF NOT EXISTS api_key_ciphertext text;
ALTER TABLE public.dealer_integrations ADD COLUMN IF NOT EXISTS api_secret_ciphertext text;
ALTER TABLE public.reservation_deposits ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE public.reservation_deposits ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.reservation_deposits ADD COLUMN IF NOT EXISTS stripe_refund_id text;
ALTER TABLE public.reservation_deposits ADD COLUMN IF NOT EXISTS refund_status text;
ALTER TABLE public.auction_bids ADD COLUMN IF NOT EXISTS request_id text;
ALTER TABLE public.auction_escrow ADD COLUMN IF NOT EXISTS payment_deadline timestamptz;
ALTER TABLE public.auction_escrow ADD COLUMN IF NOT EXISTS payout_reference text;
ALTER TABLE public.auction_contracts ADD COLUMN IF NOT EXISTS contract_snapshot jsonb;
ALTER TABLE public.auction_contracts ADD COLUMN IF NOT EXISTS sealed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS auction_bid_request_key
  ON public.auction_bids(auction_id, bidder_id, request_id) WHERE request_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS active_auction_deposit_key
  ON public.auction_deposits(auction_id, user_id) WHERE status IN ('pending', 'authorized');
CREATE UNIQUE INDEX IF NOT EXISTS active_vehicle_reservation_key
  ON public.reservation_deposits(listing_id) WHERE status IN ('pending', 'paid', 'held');
CREATE UNIQUE INDEX IF NOT EXISTS auction_escrow_auction_key ON public.auction_escrow(auction_id);
CREATE UNIQUE INDEX IF NOT EXISTS auction_contract_auction_key ON public.auction_contracts(auction_id);

-- Base-table privacy -----------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active listings" ON public.car_listings;
DROP POLICY IF EXISTS "Anyone can view bids on live auctions" ON public.auction_bids;
DROP POLICY IF EXISTS "Verified users can place bids" ON public.auction_bids;
DROP POLICY IF EXISTS "Users can create own deposits" ON public.auction_deposits;
DROP POLICY IF EXISTS "Parties can update own contracts" ON public.auction_contracts;
DROP POLICY IF EXISTS "System and admins can insert audit entries" ON public.auction_audit_log;
DROP POLICY IF EXISTS "Anyone can create a reservation" ON public.reservation_deposits;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated can create notifications" ON public.notifications;

REVOKE ALL ON public.car_listings FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.auctions FROM anon;
REVOKE ALL ON public.auction_bids FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.auction_bids FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.auction_deposits FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.auction_contracts FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.auction_escrow FROM authenticated;
REVOKE INSERT ON public.auction_audit_log FROM authenticated;
REVOKE INSERT ON public.notifications FROM authenticated, anon;
REVOKE UPDATE ON public.arbitrage_deals FROM authenticated;
REVOKE INSERT ON public.arbitrage_audit_log FROM authenticated;
REVOKE INSERT ON public.newsletter_subscribers FROM authenticated, anon;
REVOKE ALL ON public.stripe_webhook_events FROM authenticated, anon;
REVOKE ALL ON public.subscription_payments FROM authenticated, anon;
REVOKE SELECT (api_key, api_secret, api_key_ciphertext, api_secret_ciphertext) ON public.dealer_integrations FROM authenticated, anon;
REVOKE UPDATE (stripe_customer_id, stripe_subscription_id, subscription_status, tier, max_listings, kyc_verified, kyc_approved_at, approved_by) ON public.dealers FROM authenticated;
REVOKE UPDATE (seller_id, dealer_id, verified, finance_check_clear, legal_check_clear, is_featured, is_promoted, promoted_until, views_count, enquiries_count) ON public.car_listings FROM authenticated;
REVOKE UPDATE (seller_id, listing_id, status, current_bid, winning_bid_id, bid_count, watchers_count, inspection_rating, hpi_clear, ownership_verified, seller_verified, buyer_premium_pct, seller_fee_pct) ON public.auctions FROM authenticated;

-- Deliberately security-definer views: the base tables are private and only the
-- explicitly selected, non-sensitive columns below are exposed.
DROP VIEW IF EXISTS public.car_listings_public CASCADE;
CREATE VIEW public.car_listings_public WITH (security_barrier = true) AS
SELECT id, title, make, model, year, price, mileage, fuel_type, transmission,
       body_type, color, doors, engine_size, location, description, images, features,
       specs, video_url, country, status, views_count, enquiries_count, verified,
       finance_check_clear, legal_check_clear, search_vector,
       inspection_score, is_promoted, promoted_until, is_featured, dealer_id, seller_id,
       created_at, updated_at, latitude, longitude
FROM public.car_listings
WHERE status = 'active';

DROP VIEW IF EXISTS public.profiles_public CASCADE;
CREATE VIEW public.profiles_public WITH (security_barrier = true) AS
SELECT user_id, full_name, avatar_url FROM public.profiles;

CREATE OR REPLACE VIEW public.auctions_public WITH (security_barrier = true) AS
SELECT id, listing_id, seller_id, format, status, starting_price, current_bid,
       winning_bid_id, buyer_premium_pct, starts_at, ends_at, original_end_time,
       anti_snipe_extension_mins, live_event_name, live_event_date, lot_number,
       inspection_rating, condition_report, hpi_clear, ownership_verified,
       seller_verified, delivery_available, delivery_cost_estimate,
       bid_count, watchers_count, created_at, updated_at
FROM public.auctions
WHERE status IN ('live', 'ended', 'sold', 'reserve_not_met');

CREATE OR REPLACE VIEW public.auction_bids_public WITH (security_barrier = true) AS
SELECT b.id, b.auction_id, b.amount, b.is_winning, b.is_auto_bid, b.created_at,
       encode(digest(b.bidder_id::text || b.auction_id::text, 'sha256'), 'hex') AS bidder_alias,
       b.bidder_id = auth.uid() AS is_own
FROM public.auction_bids b
JOIN public.auctions a ON a.id = b.auction_id
WHERE a.status IN ('live', 'ended', 'sold', 'reserve_not_met');

CREATE OR REPLACE VIEW public.ad_campaigns_public WITH (security_barrier = true) AS
SELECT id,name,creative_url,destination_path
FROM public.ad_campaigns
WHERE is_active AND starts_at<=now() AND ends_at>now() AND creative_url IS NOT NULL;

CREATE OR REPLACE VIEW public.platform_public_stats WITH (security_barrier = true) AS
SELECT
  (SELECT count(*) FROM public.profiles)::bigint AS users,
  (SELECT count(*) FROM public.car_listings WHERE status='active')::bigint AS active_listings,
  (SELECT coalesce(sum(price),0) FROM public.car_listings WHERE status='sold')::numeric AS sold_value,
  (SELECT coalesce(round(avg(rating)::numeric,1),0) FROM public.seller_reviews)::numeric AS average_rating;

CREATE OR REPLACE VIEW public.recently_sold_public WITH (security_barrier = true) AS
SELECT id,title,price,images,updated_at,country
FROM public.car_listings
WHERE status='sold';

GRANT SELECT ON public.car_listings_public, public.profiles_public, public.auctions_public, public.auction_bids_public, public.ad_campaigns_public, public.platform_public_stats, public.recently_sold_public TO anon, authenticated;

-- Role-aware trade-stock projection. Sellers never receive the dealer margin,
-- dealer payment reference or internal notes; dealers never receive seller or
-- platform-margin data. Admins retain the operational view they need.
DROP VIEW IF EXISTS public.arbitrage_deals_visible CASCADE;
CREATE VIEW public.arbitrage_deals_visible WITH (security_barrier = true) AS
SELECT
  ad.id,
  ad.listing_id,
  CASE WHEN public.has_role(auth.uid(),'admin') OR ad.seller_id=auth.uid() THEN ad.seller_id END AS seller_id,
  CASE WHEN public.has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.dealers current_dealer
    WHERE current_dealer.id=ad.buyer_dealer_id AND current_dealer.user_id=auth.uid()
  ) THEN ad.buyer_dealer_id END AS buyer_dealer_id,
  CASE WHEN public.has_role(auth.uid(),'admin') OR ad.seller_id=auth.uid() THEN ad.seller_price END AS seller_price,
  CASE WHEN public.has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.dealers current_dealer
    WHERE current_dealer.user_id=auth.uid() AND current_dealer.is_active
      AND current_dealer.subscription_status IN ('active','trialing')
  ) THEN ad.dealer_price END AS dealer_price,
  CASE WHEN public.has_role(auth.uid(),'admin') THEN ad.platform_markup END AS platform_markup,
  CASE WHEN public.has_role(auth.uid(),'admin') THEN ad.markup_pct END AS markup_pct,
  ad.status,
  ad.seller_offer_sent_at,
  ad.seller_accepted_at,
  ad.seller_paid_at,
  CASE WHEN public.has_role(auth.uid(),'admin') OR ad.seller_id=auth.uid() THEN ad.seller_payment_ref END AS seller_payment_ref,
  ad.dealer_offer_sent_at,
  ad.dealer_accepted_at,
  CASE WHEN public.has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.dealers current_dealer
    WHERE current_dealer.id=ad.buyer_dealer_id AND current_dealer.user_id=auth.uid()
  ) THEN ad.dealer_paid_at END AS dealer_paid_at,
  CASE WHEN public.has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.dealers current_dealer
    WHERE current_dealer.id=ad.buyer_dealer_id AND current_dealer.user_id=auth.uid()
  ) THEN ad.dealer_payment_ref END AS dealer_payment_ref,
  ad.collection_arranged,
  ad.delivery_arranged,
  ad.delivery_cost,
  CASE WHEN public.has_role(auth.uid(),'admin') THEN ad.admin_notes END AS admin_notes,
  CASE WHEN public.has_role(auth.uid(),'admin') OR ad.seller_id=auth.uid() THEN ad.rejection_reason END AS rejection_reason,
  ad.country,
  ad.created_at,
  ad.updated_at,
  l.title AS listing_title,
  l.make AS listing_make,
  l.model AS listing_model,
  l.year AS listing_year,
  l.images AS listing_images,
  l.price AS listing_price,
  l.mileage AS listing_mileage,
  l.fuel_type AS listing_fuel_type,
  l.location AS listing_location,
  l.country AS listing_country
FROM public.arbitrage_deals ad
JOIN public.car_listings l ON l.id=ad.listing_id
WHERE
  public.has_role(auth.uid(),'admin')
  OR ad.seller_id=auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.dealers current_dealer
    WHERE current_dealer.user_id=auth.uid()
      AND current_dealer.is_active
      AND current_dealer.subscription_status IN ('active','trialing')
      AND ad.status IN ('listed_to_dealers','dealer_accepted','seller_paid','completed')
      AND (ad.buyer_dealer_id IS NULL OR ad.buyer_dealer_id=current_dealer.id)
  );

REVOKE SELECT ON public.arbitrage_deals FROM authenticated;
GRANT SELECT ON public.arbitrage_deals_visible TO authenticated;

CREATE POLICY "Bidders view own bids" ON public.auction_bids
  FOR SELECT TO authenticated USING (bidder_id = auth.uid());

-- New-table RLS ---------------------------------------------------------------
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_finance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_close_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.function_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own finance requests" ON public.auction_finance_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage finance requests" ON public.auction_finance_requests
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read subscription payments" ON public.subscription_payments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Dealers read own subscription payments" ON public.subscription_payments
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = dealer_id AND d.user_id = auth.uid()));
CREATE POLICY "Creators and dealers read ad campaigns" ON public.ad_campaigns
  FOR SELECT TO authenticated USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = dealer_id AND d.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.auction_finance_requests, public.subscription_payments, public.ad_campaigns TO authenticated;

-- Rate limit helper for server-side functions ---------------------------------
CREATE OR REPLACE FUNCTION public.consume_rate_limit(p_bucket text, p_subject_hash text, p_limit integer, p_window_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_window timestamptz; v_count integer;
BEGIN
  IF p_limit < 1 OR p_window_seconds < 1 OR char_length(p_subject_hash) < 16 THEN RETURN false; END IF;
  v_window := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);
  INSERT INTO public.function_rate_limits(bucket, subject_hash, window_start, request_count)
  VALUES (p_bucket, p_subject_hash, v_window, 1)
  ON CONFLICT (bucket, subject_hash, window_start)
  DO UPDATE SET request_count = public.function_rate_limits.request_count + 1
  RETURNING request_count INTO v_count;
  RETURN v_count <= p_limit;
END $$;
REVOKE ALL ON FUNCTION public.consume_rate_limit(text,text,integer,integer) FROM PUBLIC, anon, authenticated;

-- Listing quotas and state integrity ------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_listing_integrity()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_dealer public.dealers%ROWTYPE; v_count integer; v_is_admin boolean;
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  v_is_admin := public.has_role(auth.uid(), 'admin');
  IF v_is_admin THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL OR NEW.seller_id <> auth.uid() THEN RAISE EXCEPTION 'listing_owner_required'; END IF;
  IF TG_OP = 'UPDATE' AND (NEW.seller_id <> OLD.seller_id OR NEW.dealer_id IS DISTINCT FROM OLD.dealer_id) THEN RAISE EXCEPTION 'listing_ownership_immutable'; END IF;
  IF coalesce(array_length(NEW.images, 1), 0) > CASE WHEN NEW.dealer_id IS NULL THEN 10 ELSE 15 END THEN RAISE EXCEPTION 'photo_limit_exceeded'; END IF;
  IF NEW.dealer_id IS NULL THEN
    IF TG_OP = 'INSERT' THEN
      SELECT count(*) INTO v_count FROM public.car_listings WHERE seller_id = auth.uid() AND dealer_id IS NULL AND created_at >= date_trunc('month', now());
      IF v_count >= 2 THEN RAISE EXCEPTION 'private_monthly_listing_limit'; END IF;
    END IF;
  ELSE
    SELECT * INTO v_dealer FROM public.dealers WHERE id = NEW.dealer_id AND user_id = auth.uid();
    IF NOT FOUND OR NOT v_dealer.is_active OR v_dealer.subscription_status NOT IN ('active', 'trialing') THEN RAISE EXCEPTION 'active_dealer_subscription_required'; END IF;
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status <> 'active' AND NEW.status = 'active') THEN
      SELECT count(*) INTO v_count FROM public.car_listings WHERE dealer_id = NEW.dealer_id AND status = 'active' AND id <> NEW.id;
      IF v_count >= least(v_dealer.max_listings, 30) THEN RAISE EXCEPTION 'dealer_listing_limit'; END IF;
    END IF;
  END IF;
  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status <> 'active') THEN NEW.status := 'under_review'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS enforce_listing_integrity ON public.car_listings;
CREATE TRIGGER enforce_listing_integrity BEFORE INSERT OR UPDATE ON public.car_listings FOR EACH ROW EXECUTE FUNCTION public.enforce_listing_integrity();

CREATE OR REPLACE FUNCTION public.enforce_auction_integrity()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_is_admin boolean;
BEGIN
  IF auth.role()='service_role' THEN RETURN NEW; END IF;
  v_is_admin:=public.has_role(auth.uid(),'admin');
  IF v_is_admin THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL OR NEW.seller_id<>auth.uid() THEN RAISE EXCEPTION 'auction_owner_required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.car_listings l WHERE l.id=NEW.listing_id AND l.seller_id=auth.uid() AND l.status IN ('active','under_review')) THEN RAISE EXCEPTION 'eligible_listing_required'; END IF;
  IF TG_OP='INSERT' THEN
    NEW.status:='pending_inspection'; NEW.current_bid:=0; NEW.winning_bid_id:=NULL; NEW.bid_count:=0; NEW.watchers_count:=0;
    NEW.inspection_rating:=NULL; NEW.hpi_clear:=false; NEW.ownership_verified:=false; NEW.seller_verified:=false;
    NEW.buyer_premium_pct:=3; NEW.seller_fee_pct:=1.5; NEW.original_end_time:=NEW.ends_at;
  ELSE
    IF NEW.seller_id<>OLD.seller_id OR NEW.listing_id<>OLD.listing_id THEN RAISE EXCEPTION 'auction_ownership_immutable'; END IF;
    IF OLD.status NOT IN ('draft','pending_inspection') OR NEW.status NOT IN ('draft','pending_inspection') THEN RAISE EXCEPTION 'auction_review_required'; END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS enforce_auction_integrity ON public.auctions;
CREATE TRIGGER enforce_auction_integrity BEFORE INSERT OR UPDATE ON public.auctions FOR EACH ROW EXECUTE FUNCTION public.enforce_auction_integrity();

-- Atomic enquiries and view counters ------------------------------------------
CREATE OR REPLACE FUNCTION public.record_listing_view(p_listing_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.car_listings WHERE id = p_listing_id AND status = 'active') THEN RETURN; END IF;
  INSERT INTO public.listing_views(listing_id, viewer_id) VALUES (p_listing_id, auth.uid());
  UPDATE public.car_listings SET views_count = views_count + 1 WHERE id = p_listing_id;
END $$;
GRANT EXECUTE ON FUNCTION public.record_listing_view(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_listing_enquiry_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.car_listings SET enquiries_count=enquiries_count+1 WHERE id=NEW.listing_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS increment_listing_enquiry_count ON public.enquiries;
CREATE TRIGGER increment_listing_enquiry_count AFTER INSERT ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.increment_listing_enquiry_count();

DROP TRIGGER IF EXISTS on_arbitrage_status_change ON public.arbitrage_deals;
CREATE OR REPLACE FUNCTION public.transition_arbitrage_deal(p_deal_id uuid,p_action text,p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_deal public.arbitrage_deals%ROWTYPE; v_dealer public.dealers%ROWTYPE; v_is_admin boolean; v_title text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  SELECT * INTO v_deal FROM public.arbitrage_deals WHERE id=p_deal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'deal_not_found'; END IF;
  v_is_admin:=public.has_role(auth.uid(),'admin');
  SELECT coalesce(l.title,concat_ws(' ',l.year::text,l.make,l.model)) INTO v_title FROM public.car_listings l WHERE l.id=v_deal.listing_id;
  IF p_action='seller_accepted' THEN
    IF auth.uid()<>v_deal.seller_id OR v_deal.status<>'offer_sent' THEN RAISE EXCEPTION 'transition_not_allowed'; END IF;
    UPDATE public.arbitrage_deals SET status='seller_accepted',seller_accepted_at=now() WHERE id=p_deal_id;
  ELSIF p_action='seller_rejected' THEN
    IF auth.uid()<>v_deal.seller_id OR v_deal.status<>'offer_sent' THEN RAISE EXCEPTION 'transition_not_allowed'; END IF;
    UPDATE public.arbitrage_deals SET status='seller_rejected',rejection_reason=left(coalesce(nullif(trim(p_note),''),'Ohne Angabe'),500) WHERE id=p_deal_id;
  ELSIF p_action='dealer_accepted' THEN
    SELECT * INTO v_dealer FROM public.dealers WHERE user_id=auth.uid() AND is_active AND subscription_status IN ('active','trialing');
    IF NOT FOUND OR v_deal.status<>'listed_to_dealers' OR v_deal.buyer_dealer_id IS NOT NULL THEN RAISE EXCEPTION 'transition_not_allowed'; END IF;
    UPDATE public.arbitrage_deals SET status='dealer_accepted',buyer_dealer_id=v_dealer.id,dealer_accepted_at=now() WHERE id=p_deal_id;
  ELSIF p_action='offer_sent' AND v_is_admin AND v_deal.status='sourced' THEN
    UPDATE public.arbitrage_deals SET status='offer_sent',seller_offer_sent_at=now() WHERE id=p_deal_id;
  ELSIF p_action='listed_to_dealers' AND v_is_admin AND v_deal.status='seller_accepted' THEN
    UPDATE public.arbitrage_deals SET status='listed_to_dealers',dealer_offer_sent_at=now() WHERE id=p_deal_id;
  ELSIF p_action='seller_paid' AND v_is_admin AND v_deal.status='dealer_accepted' AND v_deal.dealer_paid_at IS NOT NULL THEN
    IF char_length(trim(coalesce(p_note,'')))<6 THEN RAISE EXCEPTION 'payment_reference_required'; END IF;
    UPDATE public.arbitrage_deals SET status='seller_paid',seller_paid_at=now(),seller_payment_ref=trim(p_note) WHERE id=p_deal_id;
  ELSIF p_action='completed' AND v_is_admin AND v_deal.status='seller_paid' AND v_deal.dealer_paid_at IS NOT NULL THEN
    UPDATE public.arbitrage_deals SET status='completed' WHERE id=p_deal_id;
  ELSIF p_action='cancelled' AND v_is_admin AND v_deal.status IN ('sourced','offer_sent','seller_accepted','seller_rejected','listed_to_dealers') THEN
    UPDATE public.arbitrage_deals SET status='cancelled' WHERE id=p_deal_id;
  ELSE
    RAISE EXCEPTION 'transition_not_allowed';
  END IF;
  UPDATE public.arbitrage_deals SET updated_at=now() WHERE id=p_deal_id;
  INSERT INTO public.arbitrage_audit_log(deal_id,actor_id,actor_role,action,details)
  VALUES(p_deal_id,auth.uid(),CASE WHEN v_is_admin THEN 'admin' WHEN auth.uid()=v_deal.seller_id THEN 'seller' ELSE 'dealer' END,p_action,jsonb_build_object('note',left(coalesce(p_note,''),500)));
  IF p_action='offer_sent' THEN
    INSERT INTO public.notifications(user_id,type,title,message,link) VALUES(v_deal.seller_id,'arbitrage','Neues Händlerangebot',format('Für %s liegt ein Angebot über %s € vor.',v_title,to_char(v_deal.seller_price,'FM999G999G990D00')),'/trade-stock');
  ELSIF p_action IN ('seller_accepted','seller_rejected') THEN
    INSERT INTO public.notifications(user_id,type,title,message,link)
      SELECT user_id,'arbitrage',CASE WHEN p_action='seller_accepted' THEN 'Angebot angenommen' ELSE 'Angebot abgelehnt' END,v_title,'/trade-stock' FROM public.user_roles WHERE role='admin';
  ELSIF p_action='listed_to_dealers' THEN
    INSERT INTO public.notifications(user_id,type,title,message,link)
      SELECT user_id,'arbitrage','Neuer Händlerbestand',format('%s ist für %s € verfügbar.',v_title,to_char(v_deal.dealer_price,'FM999G999G990D00')),'/trade-stock' FROM public.dealers WHERE is_active;
  ELSIF p_action='dealer_accepted' THEN
    INSERT INTO public.notifications(user_id,type,title,message,link) VALUES(v_deal.seller_id,'arbitrage','Händler gefunden',format('Für %s wurde ein Händler gefunden.',v_title),'/trade-stock');
  ELSIF p_action='seller_paid' THEN
    INSERT INTO public.notifications(user_id,type,title,message,link) VALUES(v_deal.seller_id,'payment','Auszahlung veranlasst',format('Die Auszahlung für %s wurde dokumentiert.',v_title),'/trade-stock');
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.transition_arbitrage_deal(uuid,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.increment_inspector_completed(p_user_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.inspector_profiles
  SET total_inspections=coalesce(total_inspections,0)+1,updated_at=now()
  WHERE user_id=p_user_id;
$$;
REVOKE ALL ON FUNCTION public.increment_inspector_completed(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.increment_inspector_completed(uuid) TO service_role;

-- Finance requests ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_auction_finance_request(p_auction_id uuid, p_provider text, p_reference text, p_amount numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  IF p_amount <= 0 OR char_length(trim(p_provider)) NOT BETWEEN 2 AND 100 OR char_length(trim(p_reference)) NOT BETWEEN 4 AND 120 THEN RAISE EXCEPTION 'invalid_finance_request'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.auctions WHERE id = p_auction_id AND status = 'live' AND seller_id <> auth.uid() AND ends_at > now()) THEN RAISE EXCEPTION 'auction_not_open'; END IF;
  INSERT INTO public.auction_finance_requests(auction_id,user_id,provider,reference,requested_amount,status)
  VALUES (p_auction_id,auth.uid(),trim(p_provider),trim(p_reference),p_amount,'pending')
  ON CONFLICT (auction_id,user_id) DO UPDATE SET provider=excluded.provider,reference=excluded.reference,requested_amount=excluded.requested_amount,status='pending',approved_amount=NULL,reviewed_by=NULL,reviewed_at=NULL,expires_at=NULL,updated_at=now()
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.submit_auction_finance_request(uuid,text,text,numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_auction_finance_request(p_request_id uuid, p_approve boolean, p_approved_amount numeric DEFAULT NULL, p_valid_days integer DEFAULT 30)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admin_required'; END IF;
  IF p_approve AND (p_approved_amount IS NULL OR p_approved_amount <= 0 OR p_valid_days NOT BETWEEN 1 AND 90) THEN RAISE EXCEPTION 'invalid_approval'; END IF;
  UPDATE public.auction_finance_requests SET status=CASE WHEN p_approve THEN 'verified' ELSE 'rejected' END, approved_amount=CASE WHEN p_approve THEN p_approved_amount ELSE NULL END, reviewed_by=auth.uid(), reviewed_at=now(), expires_at=CASE WHEN p_approve THEN now() + make_interval(days => p_valid_days) ELSE NULL END, updated_at=now()
  WHERE id=p_request_id AND status='pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'request_not_pending'; END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.review_auction_finance_request(uuid,boolean,numeric,integer) TO authenticated;

-- Atomic, row-locked bid placement with verified funding and proxy bidding -----
CREATE OR REPLACE FUNCTION public.bid_increment(p_amount numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN p_amount < 1000 THEN 50 WHEN p_amount < 5000 THEN 100 WHEN p_amount < 20000 THEN 250 WHEN p_amount < 50000 THEN 500 ELSE 1000 END::numeric
$$;

CREATE OR REPLACE FUNCTION public.place_auction_bid(p_auction_id uuid, p_amount numeric, p_max_auto_bid numeric DEFAULT NULL, p_request_id text DEFAULT NULL)
RETURNS TABLE(bid_id uuid, current_bid numeric, is_winning boolean, ends_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_auction public.auctions%ROWTYPE; v_deposit boolean; v_finance boolean; v_min numeric;
  v_previous public.auction_bids%ROWTYPE; v_previous_max numeric; v_new_max numeric;
  v_challenger_id uuid; v_winner_id uuid; v_final numeric; v_result_ends_at timestamptz; v_challenger_wins boolean := true;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  IF p_request_id IS NULL OR p_request_id !~ '^[A-Za-z0-9._:-]{8,128}$' THEN RAISE EXCEPTION 'invalid_request_id'; END IF;
  SELECT * INTO v_auction FROM public.auctions WHERE id=p_auction_id FOR UPDATE;
  IF NOT FOUND OR v_auction.status <> 'live' OR v_auction.starts_at > now() OR v_auction.ends_at <= now() THEN RAISE EXCEPTION 'auction_not_open'; END IF;
  IF v_auction.seller_id = auth.uid() THEN RAISE EXCEPTION 'seller_cannot_bid'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.auction_deposits WHERE auction_id=p_auction_id AND user_id=auth.uid() AND status='authorized') INTO v_deposit;
  SELECT EXISTS(SELECT 1 FROM public.auction_finance_requests WHERE auction_id=p_auction_id AND user_id=auth.uid() AND status='verified' AND expires_at>now() AND approved_amount>=greatest(p_amount,coalesce(p_max_auto_bid,p_amount))) INTO v_finance;
  IF NOT v_deposit AND NOT v_finance THEN RAISE EXCEPTION 'verified_funding_required'; END IF;
  v_min := greatest(v_auction.current_bid, v_auction.starting_price) + public.bid_increment(greatest(v_auction.current_bid, v_auction.starting_price));
  IF p_amount < v_min THEN RAISE EXCEPTION 'bid_below_minimum'; END IF;
  v_new_max := coalesce(p_max_auto_bid,p_amount);
  IF v_new_max < p_amount THEN RAISE EXCEPTION 'invalid_proxy_maximum'; END IF;
  SELECT * INTO v_previous FROM public.auction_bids WHERE id=v_auction.winning_bid_id;
  v_previous_max := coalesce(v_previous.max_auto_bid,v_previous.amount,0);
  INSERT INTO public.auction_bids(auction_id,bidder_id,amount,is_winning,is_auto_bid,max_auto_bid,deposit_verified,finance_preapproved,request_id)
  VALUES(p_auction_id,auth.uid(),p_amount,false,false,p_max_auto_bid,v_deposit,v_finance,p_request_id) RETURNING id INTO v_challenger_id;
  IF v_previous.id IS NOT NULL AND v_previous.bidder_id <> auth.uid() AND v_previous_max >= v_new_max THEN
    v_challenger_wins := false;
    v_final := least(v_previous_max, v_new_max + public.bid_increment(v_new_max));
    INSERT INTO public.auction_bids(auction_id,bidder_id,amount,is_winning,is_auto_bid,max_auto_bid,deposit_verified,finance_preapproved,request_id)
    VALUES(p_auction_id,v_previous.bidder_id,v_final,true,true,v_previous.max_auto_bid,v_previous.deposit_verified,v_previous.finance_preapproved,p_request_id||':proxy') RETURNING id INTO v_winner_id;
  ELSE
    v_final := CASE WHEN v_previous.id IS NULL OR v_previous.bidder_id=auth.uid() OR v_previous_max=0 THEN p_amount ELSE least(v_new_max, greatest(p_amount,v_previous_max+public.bid_increment(v_previous_max))) END;
    UPDATE public.auction_bids SET amount=v_final,is_winning=true WHERE id=v_challenger_id;
    v_winner_id := v_challenger_id;
  END IF;
  UPDATE public.auction_bids SET is_winning=false WHERE auction_id=p_auction_id AND id<>v_winner_id AND is_winning;
  UPDATE public.auctions AS target SET current_bid=v_final,winning_bid_id=v_winner_id,bid_count=target.bid_count+1,
    ends_at=CASE WHEN format='timed' AND ends_at-now()<make_interval(mins=>anti_snipe_extension_mins)
      THEN least(ends_at+make_interval(mins=>anti_snipe_extension_mins),coalesce(original_end_time,ends_at)+interval '10 minutes') ELSE ends_at END,
    updated_at=now() WHERE id=p_auction_id
  RETURNING target.ends_at INTO v_result_ends_at;
  INSERT INTO public.auction_audit_log(auction_id,actor_id,actor_role,action,details)
  VALUES(p_auction_id,auth.uid(),'buyer','bid_placed',jsonb_build_object('bid_id',v_challenger_id,'amount',p_amount,'proxy',p_max_auto_bid IS NOT NULL));
  bid_id:=v_challenger_id; current_bid:=v_final; is_winning:=v_challenger_wins; ends_at:=v_result_ends_at; RETURN NEXT;
END $$;
GRANT EXECUTE ON FUNCTION public.place_auction_bid(uuid,numeric,numeric,text) TO authenticated;

DROP TRIGGER IF EXISTS on_auction_bid_insert ON public.auction_bids;

-- Server-authorized auction workflow ------------------------------------------
CREATE OR REPLACE FUNCTION public.review_auction_submission(p_auction_id uuid,p_approve boolean,p_inspection_rating integer DEFAULT NULL,p_ownership_verified boolean DEFAULT false,p_seller_verified boolean DEFAULT false,p_legal_check_clear boolean DEFAULT false,p_condition_report jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'admin_required'; END IF;
  IF p_approve AND (p_inspection_rating NOT BETWEEN 1 AND 5 OR NOT p_ownership_verified OR NOT p_seller_verified OR NOT p_legal_check_clear) THEN RAISE EXCEPTION 'inspection_and_verification_required'; END IF;
  UPDATE public.auctions SET status=CASE WHEN p_approve THEN 'live'::public.auction_status ELSE 'cancelled'::public.auction_status END,
    inspection_rating=CASE WHEN p_approve THEN p_inspection_rating ELSE inspection_rating END,
    condition_report=CASE WHEN p_approve THEN coalesce(p_condition_report,'{}'::jsonb) ELSE condition_report END,
    hpi_clear=CASE WHEN p_approve THEN p_legal_check_clear ELSE hpi_clear END,
    ownership_verified=CASE WHEN p_approve THEN true ELSE ownership_verified END,
    seller_verified=CASE WHEN p_approve THEN true ELSE seller_verified END,
    starts_at=CASE WHEN p_approve THEN now() ELSE starts_at END,
    ends_at=CASE WHEN p_approve THEN coalesce(ends_at,now()+interval '7 days') ELSE ends_at END,
    original_end_time=CASE WHEN p_approve THEN coalesce(original_end_time,ends_at,now()+interval '7 days') ELSE original_end_time END
  WHERE id=p_auction_id AND status='pending_inspection';
  IF NOT FOUND THEN RAISE EXCEPTION 'auction_not_pending'; END IF;
  INSERT INTO public.auction_audit_log(auction_id,actor_id,actor_role,action,details)
  VALUES(p_auction_id,auth.uid(),'admin',CASE WHEN p_approve THEN 'inspection_approved' ELSE 'inspection_rejected' END,
    jsonb_build_object('rating',p_inspection_rating,'ownership_verified',p_ownership_verified,'seller_verified',p_seller_verified,'legal_check_clear',p_legal_check_clear));
END $$;
GRANT EXECUTE ON FUNCTION public.review_auction_submission(uuid,boolean,integer,boolean,boolean,boolean,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_dealer_kyc(p_dealer_id uuid,p_approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'admin_required'; END IF;
  UPDATE public.dealers SET kyc_verified=p_approve,kyc_approved_at=CASE WHEN p_approve THEN now() ELSE NULL END,
    approved_by=auth.uid(),is_active=CASE WHEN p_approve THEN is_active ELSE false END WHERE id=p_dealer_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'dealer_not_found'; END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.review_dealer_kyc(uuid,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_dealer_active(p_dealer_id uuid,p_active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'admin_required'; END IF;
  UPDATE public.dealers SET is_active=p_active WHERE id=p_dealer_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'dealer_not_found'; END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.set_dealer_active(uuid,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.sign_auction_contract(p_contract_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_contract public.auction_contracts%ROWTYPE;
BEGIN
  SELECT * INTO v_contract FROM public.auction_contracts WHERE id=p_contract_id FOR UPDATE;
  IF NOT FOUND OR auth.uid() NOT IN (v_contract.buyer_id,v_contract.seller_id) THEN RAISE EXCEPTION 'contract_not_found'; END IF;
  IF v_contract.sealed_at IS NULL OR v_contract.contract_snapshot IS NULL THEN RAISE EXCEPTION 'contract_not_sealed'; END IF;
  UPDATE public.auction_contracts SET
    buyer_signed=CASE WHEN auth.uid()=buyer_id THEN true ELSE buyer_signed END,
    buyer_signed_at=CASE WHEN auth.uid()=buyer_id THEN coalesce(buyer_signed_at,now()) ELSE buyer_signed_at END,
    seller_signed=CASE WHEN auth.uid()=seller_id THEN true ELSE seller_signed END,
    seller_signed_at=CASE WHEN auth.uid()=seller_id THEN coalesce(seller_signed_at,now()) ELSE seller_signed_at END,
    status=CASE WHEN (auth.uid()=buyer_id OR buyer_signed) AND (auth.uid()=seller_id OR seller_signed) THEN 'signed'::public.contract_status WHEN auth.uid()=buyer_id THEN 'pending_seller'::public.contract_status ELSE status END
  WHERE id=p_contract_id;
  UPDATE public.auction_escrow e SET contract_signed=true
  WHERE e.id=v_contract.escrow_id AND EXISTS(
    SELECT 1 FROM public.auction_contracts c WHERE c.id=p_contract_id AND c.buyer_signed AND c.seller_signed
  );
END $$;
GRANT EXECUTE ON FUNCTION public.sign_auction_contract(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.confirm_auction_handover(p_escrow_id uuid,p_kind text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_kind NOT IN ('documents_received','keys_handed_over') THEN RAISE EXCEPTION 'invalid_confirmation'; END IF;
  UPDATE public.auction_escrow SET
    v5c_received=CASE WHEN p_kind='documents_received' AND auth.uid()=buyer_id THEN true ELSE v5c_received END,
    keys_handed_over=CASE WHEN p_kind='keys_handed_over' AND auth.uid()=seller_id THEN true ELSE keys_handed_over END
  WHERE id=p_escrow_id AND auth.uid() IN (buyer_id,seller_id) AND status='full_payment_held';
  IF NOT FOUND THEN RAISE EXCEPTION 'escrow_not_available'; END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.confirm_auction_handover(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_seller_payout(p_escrow_id uuid,p_reference text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') OR char_length(trim(p_reference))<6 THEN RAISE EXCEPTION 'invalid_payout_request'; END IF;
  UPDATE public.auction_escrow e SET status='released_to_seller',released_at=now(),payout_reference=trim(p_reference)
  WHERE e.id=p_escrow_id AND e.status='full_payment_held' AND e.v5c_received AND e.keys_handed_over
    AND EXISTS(SELECT 1 FROM public.auction_contracts c WHERE c.escrow_id=e.id AND c.status='signed' AND c.buyer_signed AND c.seller_signed);
  IF NOT FOUND THEN RAISE EXCEPTION 'release_conditions_not_met'; END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.record_seller_payout(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.close_due_auction(p_auction_id uuid)
RETURNS TABLE(final_status public.auction_status,winner_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_auction public.auctions%ROWTYPE; v_bid public.auction_bids%ROWTYPE; v_listing public.car_listings%ROWTYPE;
  v_status public.auction_status; v_escrow_id uuid; v_premium numeric; v_seller_fee numeric; v_total numeric;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'service_role_required'; END IF;
  SELECT * INTO v_auction FROM public.auctions WHERE id=p_auction_id FOR UPDATE;
  IF NOT FOUND OR v_auction.status <> 'live' OR v_auction.ends_at > now() THEN RAISE EXCEPTION 'auction_not_due'; END IF;
  INSERT INTO public.auction_close_jobs(auction_id,status,attempt_count,locked_at,updated_at)
  VALUES(p_auction_id,'processing',1,now(),now())
  ON CONFLICT(auction_id) DO UPDATE SET status='processing',attempt_count=auction_close_jobs.attempt_count+1,locked_at=now(),updated_at=now();
  SELECT * INTO v_bid FROM public.auction_bids WHERE id=v_auction.winning_bid_id;
  v_status := CASE WHEN v_bid.id IS NULL THEN 'ended'::public.auction_status WHEN v_auction.reserve_price IS NOT NULL AND v_bid.amount<v_auction.reserve_price THEN 'reserve_not_met'::public.auction_status ELSE 'sold'::public.auction_status END;
  UPDATE public.auctions SET status=v_status,updated_at=now() WHERE id=p_auction_id;
  SELECT * INTO v_listing FROM public.car_listings WHERE id=v_auction.listing_id;
  IF v_status='sold' THEN
    v_premium:=round(v_bid.amount*v_auction.buyer_premium_pct/100,2);
    v_seller_fee:=round(v_bid.amount*v_auction.seller_fee_pct/100,2);
    v_total:=v_bid.amount+v_premium;
    INSERT INTO public.auction_escrow(auction_id,buyer_id,seller_id,total_amount,buyer_premium,seller_fee,platform_revenue,status,payment_deadline)
    VALUES(p_auction_id,v_bid.bidder_id,v_auction.seller_id,v_total,v_premium,v_seller_fee,v_premium+v_seller_fee,'pending_deposit',now()+interval '72 hours')
    ON CONFLICT(auction_id) DO UPDATE SET buyer_id=excluded.buyer_id,total_amount=excluded.total_amount,buyer_premium=excluded.buyer_premium,seller_fee=excluded.seller_fee,platform_revenue=excluded.platform_revenue
    RETURNING id INTO v_escrow_id;
    INSERT INTO public.auction_contracts(auction_id,escrow_id,buyer_id,seller_id,contract_snapshot,sealed_at,status)
    VALUES(p_auction_id,v_escrow_id,v_bid.bidder_id,v_auction.seller_id,
      jsonb_build_object(
        'version',1,'auction_id',p_auction_id,'sealed_at',now(),
        'vehicle',jsonb_build_object('year',v_listing.year,'make',v_listing.make,'model',v_listing.model,'registration',v_listing.registration,'vin',v_listing.vin,'mileage',v_listing.mileage),
        'hammer_price',v_bid.amount,'buyer_premium_pct',v_auction.buyer_premium_pct,'buyer_premium',v_premium,
        'seller_fee_pct',v_auction.seller_fee_pct,'seller_fee',v_seller_fee,'total_due',v_total,
        'currency','EUR','condition_report',v_auction.condition_report
      ),now(),'pending_buyer')
    ON CONFLICT(auction_id) DO NOTHING;
    INSERT INTO public.notifications(user_id,type,title,message,link) VALUES
      (v_bid.bidder_id,'auction','Auktion gewonnen','Bitte schließen Sie Zahlung und Vertragsunterzeichnung innerhalb von 72 Stunden ab.','/auction/'||p_auction_id),
      (v_auction.seller_id,'auction','Fahrzeug verkauft','Der Zuschlag wurde erteilt. Bitte prüfen Sie den versiegelten Vertrag.','/auction/'||p_auction_id);
  ELSE
    INSERT INTO public.notifications(user_id,type,title,message,link)
    VALUES(v_auction.seller_id,'auction',CASE WHEN v_status='reserve_not_met' THEN 'Mindestpreis nicht erreicht' ELSE 'Auktion beendet' END,'Die Auktion wurde ohne Verkauf beendet.','/auction/'||p_auction_id);
  END IF;
  INSERT INTO public.auction_audit_log(auction_id,actor_role,action,details)
  VALUES(p_auction_id,'system','auction_closed',jsonb_build_object('status',v_status,'final_bid',coalesce(v_bid.amount,0),'winner_id',v_bid.bidder_id));
  UPDATE public.auction_close_jobs SET status='succeeded',completed_at=now(),updated_at=now() WHERE auction_id=p_auction_id;
  final_status:=v_status; winner_id:=v_bid.bidder_id; RETURN NEXT;
EXCEPTION WHEN OTHERS THEN
  UPDATE public.auction_close_jobs SET status='failed',last_error=left(SQLERRM,500),updated_at=now() WHERE auction_id=p_auction_id;
  RAISE;
END $$;
REVOKE ALL ON FUNCTION public.close_due_auction(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_due_auction(uuid) TO service_role;

-- Prevent credential/status writes from browser code. Edge functions use service role.
REVOKE INSERT, UPDATE, DELETE ON public.dealer_integrations FROM authenticated;
REVOKE ALL ON public.dealer_portal_configs FROM authenticated, anon;
UPDATE public.dealer_portal_configs SET is_enabled=false WHERE is_enabled;
REVOKE INSERT, UPDATE, DELETE ON public.staff_invites FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.ad_campaigns FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.reservation_deposits FROM authenticated, anon;
DROP POLICY IF EXISTS "Anyone can submit contact message" ON public.contact_messages;
REVOKE INSERT ON public.contact_messages FROM authenticated, anon;
REVOKE ALL ON public.account_deletion_log FROM authenticated, anon;
