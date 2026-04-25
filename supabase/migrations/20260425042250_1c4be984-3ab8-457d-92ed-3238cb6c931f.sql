
-- Recreate as SECURITY INVOKER view so RLS of car_listings/vehicle_costs/stock_book_entries is enforced per user
DROP VIEW IF EXISTS public.dealer_vehicle_profit;

CREATE VIEW public.dealer_vehicle_profit
WITH (security_invoker = true) AS
SELECT
  cl.id AS listing_id,
  cl.dealer_id,
  cl.title,
  cl.make,
  cl.model,
  cl.year,
  cl.price AS asking_price,
  cl.status,
  COALESCE((SELECT SUM(amount) FROM public.vehicle_costs vc WHERE vc.listing_id = cl.id AND vc.category = 'purchase'), 0) AS purchase_cost,
  COALESCE((SELECT SUM(amount) FROM public.vehicle_costs vc WHERE vc.listing_id = cl.id AND vc.category != 'purchase'), 0) AS additional_costs,
  COALESCE((SELECT SUM(amount) FROM public.vehicle_costs vc WHERE vc.listing_id = cl.id), 0) AS total_costs,
  COALESCE((SELECT SUM(vat_amount) FROM public.vehicle_costs vc WHERE vc.listing_id = cl.id), 0) AS total_vat,
  COALESCE((SELECT amount FROM public.stock_book_entries sb WHERE sb.listing_id = cl.id AND sb.entry_type = 'sale' ORDER BY entry_date DESC LIMIT 1), NULL) AS sale_price,
  cl.created_at
FROM public.car_listings cl
WHERE cl.dealer_id IS NOT NULL;
