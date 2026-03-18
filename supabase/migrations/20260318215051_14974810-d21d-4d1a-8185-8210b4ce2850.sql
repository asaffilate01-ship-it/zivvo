
-- Fix 1: Remove public SELECT on auction_bids (exposes max_auto_bid and ip_address)
DROP POLICY IF EXISTS "Anyone can view bids on live auctions" ON public.auction_bids;

-- Fix 2: Remove anonymous SELECT on car_listings (exposes VIN, HPI data, logbook_url)
DROP POLICY IF EXISTS "Public can view active listings" ON public.car_listings;

-- Fix 3: Tighten dealer arbitrage update policy with WITH CHECK
DROP POLICY IF EXISTS "Dealers can accept deals" ON public.arbitrage_deals;
CREATE POLICY "Dealers can accept deals" ON public.arbitrage_deals
  FOR UPDATE TO authenticated
  USING (
    (status = 'listed_to_dealers'::arbitrage_status)
    AND EXISTS (SELECT 1 FROM dealers d WHERE d.user_id = auth.uid() AND d.is_active = true)
  )
  WITH CHECK (
    -- Dealers may only set buyer_dealer_id and status/dealer_accepted_at
    seller_price IS NOT DISTINCT FROM (SELECT ad.seller_price FROM arbitrage_deals ad WHERE ad.id = arbitrage_deals.id)
    AND dealer_price IS NOT DISTINCT FROM (SELECT ad.dealer_price FROM arbitrage_deals ad WHERE ad.id = arbitrage_deals.id)
    AND platform_markup IS NOT DISTINCT FROM (SELECT ad.platform_markup FROM arbitrage_deals ad WHERE ad.id = arbitrage_deals.id)
    AND admin_notes IS NOT DISTINCT FROM (SELECT ad.admin_notes FROM arbitrage_deals ad WHERE ad.id = arbitrage_deals.id)
    AND seller_payment_ref IS NOT DISTINCT FROM (SELECT ad.seller_payment_ref FROM arbitrage_deals ad WHERE ad.id = arbitrage_deals.id)
    AND dealer_payment_ref IS NOT DISTINCT FROM (SELECT ad.dealer_payment_ref FROM arbitrage_deals ad WHERE ad.id = arbitrage_deals.id)
  );

-- Fix 4: Tighten seller arbitrage update policy
DROP POLICY IF EXISTS "Sellers can respond to offers" ON public.arbitrage_deals;
CREATE POLICY "Sellers can respond to offers" ON public.arbitrage_deals
  FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id AND status = 'offer_sent'::arbitrage_status)
  WITH CHECK (
    auth.uid() = seller_id
    AND dealer_price IS NOT DISTINCT FROM (SELECT ad.dealer_price FROM arbitrage_deals ad WHERE ad.id = arbitrage_deals.id)
    AND platform_markup IS NOT DISTINCT FROM (SELECT ad.platform_markup FROM arbitrage_deals ad WHERE ad.id = arbitrage_deals.id)
    AND admin_notes IS NOT DISTINCT FROM (SELECT ad.admin_notes FROM arbitrage_deals ad WHERE ad.id = arbitrage_deals.id)
    AND dealer_payment_ref IS NOT DISTINCT FROM (SELECT ad.dealer_payment_ref FROM arbitrage_deals ad WHERE ad.id = arbitrage_deals.id)
  );

-- Fix 5: Tighten seller auction update to prevent fee manipulation
DROP POLICY IF EXISTS "Sellers can update own draft auctions" ON public.auctions;
CREATE POLICY "Sellers can update own draft auctions" ON public.auctions
  FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id AND status = ANY (ARRAY['draft'::auction_status, 'pending_inspection'::auction_status]))
  WITH CHECK (
    auth.uid() = seller_id
    AND seller_fee_pct IS NOT DISTINCT FROM (SELECT a.seller_fee_pct FROM auctions a WHERE a.id = auctions.id)
    AND buyer_premium_pct IS NOT DISTINCT FROM (SELECT a.buyer_premium_pct FROM auctions a WHERE a.id = auctions.id)
    AND winning_bid_id IS NOT DISTINCT FROM (SELECT a.winning_bid_id FROM auctions a WHERE a.id = auctions.id)
  );
