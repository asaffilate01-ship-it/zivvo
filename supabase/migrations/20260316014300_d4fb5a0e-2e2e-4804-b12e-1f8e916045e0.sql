
-- Recreate critical triggers that are missing

-- 1. Auto-create profile and buyer role on new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Auto-update search_vector on car_listings insert/update
CREATE OR REPLACE TRIGGER update_car_search_vector
  BEFORE INSERT OR UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_search_vector();

-- 3. Auto-update updated_at on car_listings
CREATE OR REPLACE TRIGGER update_car_listings_updated_at
  BEFORE UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Auto-update updated_at on dealers
CREATE OR REPLACE TRIGGER update_dealers_updated_at
  BEFORE UPDATE ON public.dealers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Auto-update updated_at on profiles
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
