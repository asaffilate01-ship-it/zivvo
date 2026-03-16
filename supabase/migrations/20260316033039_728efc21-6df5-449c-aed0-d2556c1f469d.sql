
-- RESTORE ALL MISSING TRIGGERS

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE TRIGGER update_car_search_vector
  BEFORE INSERT OR UPDATE ON public.car_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_search_vector();

CREATE OR REPLACE TRIGGER set_updated_at_car_listings
  BEFORE UPDATE ON public.car_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_dealers
  BEFORE UPDATE ON public.dealers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER sync_dealer_public_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.dealers
  FOR EACH ROW EXECUTE FUNCTION public.sync_dealer_public_rows();

CREATE OR REPLACE TRIGGER sync_profile_public_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_public_row();

CREATE OR REPLACE TRIGGER enforce_message_update_safety_trigger
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_update_safety();

CREATE OR REPLACE TRIGGER enforce_enquiry_update_safety_trigger
  BEFORE UPDATE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.enforce_enquiry_update_safety();
