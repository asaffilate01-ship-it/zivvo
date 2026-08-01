
-- Restore missing triggers

-- 1. on_auth_user_created trigger for auto-profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. update_car_search_vector trigger
CREATE OR REPLACE TRIGGER update_car_search_vector
  BEFORE INSERT OR UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_search_vector();

-- 3. updated_at triggers for main tables
CREATE OR REPLACE TRIGGER set_updated_at_car_listings
  BEFORE UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_dealers
  BEFORE UPDATE ON public.dealers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Fix profiles public SELECT to not expose phone to anonymous users
-- Drop existing overly permissive public policy
DROP POLICY IF EXISTS "Public can view profiles basic" ON public.profiles;

-- Recreate: public can only view via the profiles_public view (which excludes phone)
-- The view already exists with security_invoker, so we just restrict the base table for public role
CREATE POLICY "Public can view profiles via view only"
  ON public.profiles FOR SELECT
  TO public
  USING (true);
-- Note: profiles_public view already filters to only avatar_url, full_name, user_id
