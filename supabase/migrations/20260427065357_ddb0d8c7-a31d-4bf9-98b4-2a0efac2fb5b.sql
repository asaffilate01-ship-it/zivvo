DROP VIEW IF EXISTS public.car_listings_public;
CREATE VIEW public.car_listings_public AS
SELECT id, title, make, model, year, price, mileage, fuel_type, transmission,
       body_type, color, doors, engine_size, location, description, images, features,
       specs, video_url, country, status, views_count, enquiries_count, verified,
       finance_check_clear, legal_check_clear, inspection_score, is_promoted,
       promoted_until, is_featured, dealer_id, seller_id, registration,
       created_at, updated_at, search_vector,
       latitude, longitude
FROM public.car_listings
WHERE status = 'active'::listing_status;