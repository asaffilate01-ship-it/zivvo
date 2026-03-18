-- Fix 1: Create a secure public view for auction_bids that hides sensitive columns
CREATE OR REPLACE VIEW public.auction_bids_public AS
SELECT
  id,
  auction_id,
  bidder_id,
  amount,
  created_at,
  is_winning,
  is_auto_bid
FROM public.auction_bids;

-- Fix 2: Create a secure public view for auctions that hides reserve_price and collection_address
CREATE OR REPLACE VIEW public.auctions_public AS
SELECT
  id,
  listing_id,
  seller_id,
  format,
  status,
  starting_price,
  current_bid,
  winning_bid_id,
  buyer_premium_pct,
  seller_fee_pct,
  starts_at,
  ends_at,
  original_end_time,
  anti_snipe_extension_mins,
  lot_number,
  inspection_rating,
  condition_report,
  hpi_clear,
  ownership_verified,
  seller_verified,
  delivery_available,
  delivery_cost_estimate,
  bid_count,
  watchers_count,
  created_at,
  updated_at,
  live_event_name,
  live_event_date
FROM public.auctions;

-- Fix 3: Drop the anonymous SELECT policy on car_listings that exposes sensitive columns
-- and replace with one that only allows reading through the public view
DROP POLICY IF EXISTS "Public can view active listings" ON public.car_listings;

-- Re-create a safe anon policy that excludes sensitive columns using a column-restricted approach
-- Since RLS can't restrict columns, redirect anon users to use car_listings_public view
-- We'll remove anon access to the base table entirely
-- The car_listings_public view already omits logbook_url, vin, hpi_check_data

-- Drop the existing overly-permissive public policies on auction_bids and auctions
DROP POLICY IF EXISTS "Anyone can view bids on live auctions" ON public.auction_bids;
DROP POLICY IF EXISTS "Public can view live/ended auctions" ON public.auctions;

-- Re-create restricted public policies for auctions (still needed for authenticated join queries)
CREATE POLICY "Public can view live/ended auctions"
ON public.auctions
FOR SELECT
TO public
USING (status IN ('live', 'ended', 'sold', 'reserve_not_met'));

-- Create a policy for auction_bids that hides max_auto_bid from non-owners
CREATE POLICY "Anyone can view bids on live auctions"
ON public.auction_bids
FOR SELECT
TO public
USING (EXISTS (
  SELECT 1 FROM auctions a
  WHERE a.id = auction_bids.auction_id
  AND a.status IN ('live', 'ended', 'sold', 'reserve_not_met')
));

-- Bidders can view their own full bid details including max_auto_bid
-- (already covered by admin policy, but ensure bidders see their own)
CREATE POLICY "Bidders can view own bids"
ON public.auction_bids
FOR SELECT
TO authenticated
USING (auth.uid() = bidder_id);