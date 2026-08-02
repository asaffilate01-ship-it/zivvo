-- Zivvo production assurance v2.
-- Apply only after 20260801170000_production_security_hardening.sql.

-- Dealer lead operations ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dealer_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.car_listings(id) ON DELETE SET NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 40),
  message text NOT NULL CHECK (char_length(message) BETWEEN 2 AND 4000),
  source text NOT NULL DEFAULT 'dealer_page' CHECK (source IN ('dealer_page', 'listing', 'phone', 'walk_in', 'manual')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'appointment', 'offer', 'won', 'lost')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  next_action_at timestamptz,
  last_contacted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dealer_leads_queue_idx
  ON public.dealer_leads(dealer_id, status, priority, next_action_at, created_at DESC);
CREATE INDEX IF NOT EXISTS dealer_leads_assignee_idx
  ON public.dealer_leads(assigned_to, status) WHERE assigned_to IS NOT NULL;

-- Privileged database access requires a verified second factor. Service-role
-- automation remains unaffected, and non-admin role checks keep their existing
-- behaviour.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (_user_id = auth.uid() OR current_setting('request.jwt.claim.role', true) = 'service_role')
      AND (
        _role <> 'admin'::public.app_role
        OR current_setting('request.jwt.claim.role', true) = 'service_role'
        OR coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
      )
  )
$$;

CREATE TABLE IF NOT EXISTS public.dealer_lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.dealer_leads(id) ON DELETE CASCADE,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('created', 'status_changed', 'priority_changed', 'assigned', 'note')),
  from_value text,
  to_value text,
  note text CHECK (note IS NULL OR char_length(note) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dealer_lead_events_lead_idx
  ON public.dealer_lead_events(lead_id, created_at DESC);

ALTER TABLE public.dealer_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_lead_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dealer teams read their leads" ON public.dealer_leads;
CREATE POLICY "Dealer teams read their leads" ON public.dealer_leads
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = dealer_id AND d.user_id = auth.uid())
    OR public.is_dealer_staff(dealer_id, auth.uid())
  );

DROP POLICY IF EXISTS "Dealer teams read lead events" ON public.dealer_lead_events;
CREATE POLICY "Dealer teams read lead events" ON public.dealer_lead_events
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = dealer_id AND d.user_id = auth.uid())
    OR public.is_dealer_staff(dealer_id, auth.uid())
  );

REVOKE ALL ON public.dealer_leads, public.dealer_lead_events FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.dealer_leads, public.dealer_lead_events FROM authenticated;
GRANT SELECT ON public.dealer_leads, public.dealer_lead_events TO authenticated;

CREATE OR REPLACE FUNCTION public.manage_dealer_lead(
  p_lead_id uuid,
  p_status text DEFAULT NULL,
  p_priority text DEFAULT NULL,
  p_assigned_to uuid DEFAULT NULL,
  p_clear_assignee boolean DEFAULT false,
  p_next_action_at timestamptz DEFAULT NULL,
  p_clear_next_action boolean DEFAULT false,
  p_note text DEFAULT NULL
)
RETURNS public.dealer_leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.dealer_leads;
  v_before public.dealer_leads;
  v_allowed boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  SELECT * INTO v_before FROM public.dealer_leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'lead_not_found'; END IF;

  v_allowed := public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = v_before.dealer_id AND d.user_id = auth.uid())
    OR public.is_dealer_staff(v_before.dealer_id, auth.uid());
  IF NOT v_allowed THEN RAISE EXCEPTION 'dealer_access_required'; END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('new', 'contacted', 'qualified', 'appointment', 'offer', 'won', 'lost') THEN
    RAISE EXCEPTION 'invalid_lead_status';
  END IF;
  IF p_priority IS NOT NULL AND p_priority NOT IN ('low', 'normal', 'high') THEN
    RAISE EXCEPTION 'invalid_lead_priority';
  END IF;
  IF p_note IS NOT NULL AND (char_length(trim(p_note)) < 2 OR char_length(trim(p_note)) > 2000) THEN
    RAISE EXCEPTION 'invalid_lead_note';
  END IF;
  IF p_assigned_to IS NOT NULL AND NOT (
    EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = v_before.dealer_id AND d.user_id = p_assigned_to)
    OR public.is_dealer_staff(v_before.dealer_id, p_assigned_to)
  ) THEN
    RAISE EXCEPTION 'assignee_not_in_dealer_team';
  END IF;

  UPDATE public.dealer_leads SET
    status = COALESCE(p_status, status),
    priority = COALESCE(p_priority, priority),
    assigned_to = CASE WHEN p_clear_assignee THEN NULL ELSE COALESCE(p_assigned_to, assigned_to) END,
    next_action_at = CASE WHEN p_clear_next_action THEN NULL ELSE COALESCE(p_next_action_at, next_action_at) END,
    last_contacted_at = CASE WHEN p_status = 'contacted' THEN now() ELSE last_contacted_at END,
    updated_at = now()
  WHERE id = p_lead_id
  RETURNING * INTO v_lead;

  IF p_status IS NOT NULL AND p_status IS DISTINCT FROM v_before.status THEN
    INSERT INTO public.dealer_lead_events(lead_id, dealer_id, actor_id, event_type, from_value, to_value)
    VALUES(p_lead_id, v_lead.dealer_id, auth.uid(), 'status_changed', v_before.status, p_status);
  END IF;
  IF p_priority IS NOT NULL AND p_priority IS DISTINCT FROM v_before.priority THEN
    INSERT INTO public.dealer_lead_events(lead_id, dealer_id, actor_id, event_type, from_value, to_value)
    VALUES(p_lead_id, v_lead.dealer_id, auth.uid(), 'priority_changed', v_before.priority, p_priority);
  END IF;
  IF p_assigned_to IS NOT NULL OR p_clear_assignee THEN
    INSERT INTO public.dealer_lead_events(lead_id, dealer_id, actor_id, event_type, from_value, to_value)
    VALUES(p_lead_id, v_lead.dealer_id, auth.uid(), 'assigned', v_before.assigned_to::text, v_lead.assigned_to::text);
  END IF;
  IF p_note IS NOT NULL THEN
    INSERT INTO public.dealer_lead_events(lead_id, dealer_id, actor_id, event_type, note)
    VALUES(p_lead_id, v_lead.dealer_id, auth.uid(), 'note', trim(p_note));
  END IF;
  RETURN v_lead;
END;
$$;

REVOKE ALL ON FUNCTION public.manage_dealer_lead(uuid,text,text,uuid,boolean,timestamptz,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_dealer_lead(uuid,text,text,uuid,boolean,timestamptz,boolean,text) TO authenticated;

-- Reservation expiry and immutable event trail --------------------------------
ALTER TABLE public.reservation_deposits
  ADD COLUMN IF NOT EXISTS expiry_claimed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.reservation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservation_deposits(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('created', 'paid', 'expired', 'refund_started', 'refunded', 'refund_failed', 'applied_to_sale')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reservation_events_reservation_idx
  ON public.reservation_events(reservation_id, created_at DESC);

ALTER TABLE public.reservation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reservation parties read events" ON public.reservation_events
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.reservation_deposits r
      LEFT JOIN public.dealers d ON d.id = r.dealer_id
      WHERE r.id = reservation_id
        AND (r.buyer_id = auth.uid() OR d.user_id = auth.uid() OR public.is_dealer_staff(r.dealer_id, auth.uid()))
    )
  );
REVOKE INSERT, UPDATE, DELETE ON public.reservation_events FROM authenticated, anon;
GRANT SELECT ON public.reservation_events TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_expired_reservations(p_limit integer DEFAULT 50)
RETURNS SETOF public.reservation_deposits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.jwt()->>'role', '') <> 'service_role' THEN RAISE EXCEPTION 'service_role_required'; END IF;
  IF p_limit < 1 OR p_limit > 200 THEN RAISE EXCEPTION 'invalid_limit'; END IF;
  RETURN QUERY
  UPDATE public.reservation_deposits r SET
    status = 'expiry_processing',
    expiry_claimed_at = now(),
    updated_at = now()
  WHERE r.id IN (
    SELECT candidate.id
    FROM public.reservation_deposits candidate
    WHERE candidate.expires_at <= now()
      AND candidate.status IN ('pending', 'paid')
      AND (candidate.expiry_claimed_at IS NULL OR candidate.expiry_claimed_at < now() - interval '15 minutes')
    ORDER BY candidate.expires_at
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  )
  RETURNING r.*;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_expired_reservations(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_expired_reservations(integer) TO service_role;

-- Payment failure, dispute and reconciliation ledgers -------------------------
CREATE TABLE IF NOT EXISTS public.payment_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE,
  provider_object_id text,
  incident_type text NOT NULL CHECK (incident_type IN ('checkout_expired', 'payment_failed', 'async_payment_failed', 'invoice_failed', 'refund_failed', 'webhook_processing_failed')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  dealer_id uuid REFERENCES public.dealers(id) ON DELETE SET NULL,
  listing_id uuid REFERENCES public.car_listings(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),
  amount_cents integer CHECK (amount_cents IS NULL OR amount_cents >= 0),
  currency text,
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 2 AND 500),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_disputes (
  stripe_dispute_id text PRIMARY KEY,
  stripe_charge_id text NOT NULL,
  payment_intent_id text,
  status text NOT NULL,
  reason text,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  evidence_due_at timestamptz,
  is_charge_refundable boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_incidents_open_idx ON public.payment_incidents(status, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_disputes_status_idx ON public.payment_disputes(status, evidence_due_at);

ALTER TABLE public.payment_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read payment incidents" ON public.payment_incidents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read payment disputes" ON public.payment_disputes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
REVOKE ALL ON public.payment_incidents, public.payment_disputes FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.payment_incidents, public.payment_disputes FROM authenticated;
GRANT SELECT ON public.payment_incidents, public.payment_disputes TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_payment_incident(p_incident_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admin_required'; END IF;
  IF p_status NOT IN ('investigating', 'resolved', 'ignored') THEN RAISE EXCEPTION 'invalid_status'; END IF;
  UPDATE public.payment_incidents SET
    status = p_status,
    resolved_by = CASE WHEN p_status IN ('resolved', 'ignored') THEN auth.uid() ELSE NULL END,
    resolved_at = CASE WHEN p_status IN ('resolved', 'ignored') THEN now() ELSE NULL END,
    updated_at = now()
  WHERE id = p_incident_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'incident_not_found'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.resolve_payment_incident(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_payment_incident(uuid,text) TO authenticated;

-- Storage constraints: policies enforce ownership; bucket rules reject large or
-- unexpected MIME types before the application can reference an object.
UPDATE storage.buckets SET
  file_size_limit = 12582912,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'car-images';

UPDATE storage.buckets SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime']
WHERE id = 'car-videos';

UPDATE storage.buckets SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
WHERE id = 'listing-documents';

DROP INDEX IF EXISTS public.active_vehicle_reservation_key;
CREATE UNIQUE INDEX active_vehicle_reservation_key
  ON public.reservation_deposits(listing_id)
  WHERE status IN ('pending', 'paid', 'held', 'expiry_processing');

DROP POLICY IF EXISTS "Users upload car images to own folder" ON storage.objects;
CREATE POLICY "Users upload safe car images to own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'car-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
  );

DROP POLICY IF EXISTS "Users upload car videos to own folder" ON storage.objects;
CREATE POLICY "Users upload safe car videos to own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'car-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('mp4', 'webm', 'mov')
  );

DROP POLICY IF EXISTS "Sellers can upload listing documents" ON storage.objects;
CREATE POLICY "Sellers upload safe listing documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listing-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('pdf', 'jpg', 'jpeg', 'png', 'webp')
  );

-- Ensure common updated-at trigger is used for operational rows.
DROP TRIGGER IF EXISTS trg_dealer_leads_updated_at ON public.dealer_leads;
CREATE TRIGGER trg_dealer_leads_updated_at BEFORE UPDATE ON public.dealer_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
