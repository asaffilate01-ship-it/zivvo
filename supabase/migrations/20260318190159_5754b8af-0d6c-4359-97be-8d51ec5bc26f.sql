-- Fix auctions_public view to only show public-facing auctions (not drafts/pending)
CREATE OR REPLACE VIEW public.auctions_public WITH (security_invoker = on) AS
SELECT
  id, listing_id, seller_id, format, status,
  starting_price, current_bid, winning_bid_id,
  buyer_premium_pct, seller_fee_pct,
  starts_at, ends_at, original_end_time,
  anti_snipe_extension_mins, lot_number, inspection_rating,
  condition_report, hpi_clear, ownership_verified, seller_verified,
  delivery_available, delivery_cost_estimate,
  bid_count, watchers_count,
  created_at, updated_at, live_event_name, live_event_date
FROM public.auctions
WHERE status IN ('live', 'ended', 'sold', 'reserve_not_met');