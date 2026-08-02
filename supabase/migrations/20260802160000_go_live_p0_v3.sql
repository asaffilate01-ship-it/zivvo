-- Go-live P0 v3: make payment state and pending checkout uniqueness enforceable.

ALTER TABLE public.auction_deposits
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS captured_amount numeric NOT NULL DEFAULT 0;

-- Deposits created before the fixed-EUR contract cannot be safely reused.
UPDATE public.auction_deposits
SET status = 'released', released_at = COALESCE(released_at, now())
WHERE status IN ('pending', 'authorized');

UPDATE public.auction_deposits SET currency = 'EUR';

ALTER TABLE public.auction_deposits
  DROP CONSTRAINT IF EXISTS auction_deposits_currency_check,
  DROP CONSTRAINT IF EXISTS auction_deposits_captured_amount_check,
  DROP CONSTRAINT IF EXISTS auction_deposits_authorized_card_check;

ALTER TABLE public.auction_deposits
  ADD CONSTRAINT auction_deposits_currency_check CHECK (currency = 'EUR'),
  ADD CONSTRAINT auction_deposits_captured_amount_check CHECK (captured_amount >= 0 AND captured_amount <= amount),
  ADD CONSTRAINT auction_deposits_authorized_card_check CHECK (
    status <> 'authorized'
    OR (type = 'card_preauth' AND amount = 500 AND stripe_payment_intent_id IS NOT NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS active_auction_deposit_key
  ON public.auction_deposits (auction_id, user_id)
  WHERE status IN ('pending', 'authorized');

CREATE UNIQUE INDEX IF NOT EXISTS inspection_pending_checkout_key
  ON public.inspection_bookings (listing_id, buyer_id, inspection_type)
  WHERE status = 'pending_payment';

CREATE UNIQUE INDEX IF NOT EXISTS inspection_stripe_session_key
  ON public.inspection_bookings (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

ALTER TABLE public.arbitrage_deals ALTER COLUMN country SET DEFAULT 'DE';

COMMENT ON COLUMN public.auction_deposits.captured_amount IS
  'EUR amount captured from the fixed card authorization; updated only by trusted payment functions.';
