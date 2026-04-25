-- Add VAT scheme per vehicle so dealer profit/VAT calc is accurate
ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS vat_scheme text NOT NULL DEFAULT 'margin'
    CHECK (vat_scheme IN ('margin', 'standard', 'none'));

COMMENT ON COLUMN public.car_listings.vat_scheme IS 'margin = UK VAT margin scheme (VAT on profit only), standard = standard VAT (reclaim input, charge output), none = not VAT registered / private sale';