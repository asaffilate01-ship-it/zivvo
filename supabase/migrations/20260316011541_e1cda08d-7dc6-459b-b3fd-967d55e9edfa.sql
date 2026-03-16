
-- Re-create the function (it may have been rolled back)
CREATE OR REPLACE FUNCTION public.update_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.make, '') || ' ' ||
    coalesce(NEW.model, '') || ' ' ||
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.body_type, '') || ' ' ||
    coalesce(NEW.fuel_type, '') || ' ' ||
    coalesce(NEW.color, '') || ' ' ||
    coalesce(NEW.location, '') || ' ' ||
    coalesce(NEW.transmission, '') || ' ' ||
    coalesce(NEW.description, '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE OR REPLACE TRIGGER car_listings_search_vector_update
  BEFORE INSERT OR UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_search_vector();

-- Backfill existing listings by touching them
UPDATE public.car_listings SET make = make;

-- updated_at triggers
CREATE OR REPLACE TRIGGER dealers_updated_at
  BEFORE UPDATE ON public.dealers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER car_listings_updated_at
  BEFORE UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
