-- Inspector payouts table
CREATE TABLE public.inspector_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  inspector_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 120.00,
  currency text NOT NULL DEFAULT 'GBP',
  status text NOT NULL DEFAULT 'pending', -- pending | approved | paid | cancelled
  payment_reference text,
  paid_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

CREATE INDEX idx_inspector_payouts_inspector ON public.inspector_payouts(inspector_id);
CREATE INDEX idx_inspector_payouts_status ON public.inspector_payouts(status);

ALTER TABLE public.inspector_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all payouts"
ON public.inspector_payouts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Inspectors view own payouts"
ON public.inspector_payouts
FOR SELECT
TO authenticated
USING (auth.uid() = inspector_id);

CREATE TRIGGER update_inspector_payouts_updated_at
BEFORE UPDATE ON public.inspector_payouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create payout when an inspection booking is marked completed
CREATE OR REPLACE FUNCTION public.create_inspector_payout_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed'
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.inspector_id IS NOT NULL
  THEN
    INSERT INTO public.inspector_payouts (booking_id, inspector_id, amount, currency)
    VALUES (NEW.id, NEW.inspector_id, 120.00, COALESCE(NEW.currency, 'GBP'))
    ON CONFLICT (booking_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_inspector_payout
AFTER UPDATE ON public.inspection_bookings
FOR EACH ROW
EXECUTE FUNCTION public.create_inspector_payout_on_completion();