
-- ============================================================
-- RESTORE ALL 9 CRITICAL DATABASE TRIGGERS
-- ============================================================

-- 1. Auto-create profile + buyer role on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Search vector indexing on car_listings
CREATE OR REPLACE TRIGGER update_car_search_vector
  BEFORE INSERT OR UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_search_vector();

-- 3. updated_at on car_listings
CREATE OR REPLACE TRIGGER set_car_listings_updated_at
  BEFORE UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. updated_at on dealers
CREATE OR REPLACE TRIGGER set_dealers_updated_at
  BEFORE UPDATE ON public.dealers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. updated_at on profiles
CREATE OR REPLACE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Sync dealers -> dealers_public & dealer_landing_public
CREATE OR REPLACE TRIGGER sync_dealer_public
  AFTER INSERT OR UPDATE OR DELETE ON public.dealers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_dealer_public_rows();

-- 7. Sync profiles -> profiles_public
CREATE OR REPLACE TRIGGER sync_profile_public
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_public_row();

-- 8. Message immutability safety
CREATE OR REPLACE TRIGGER enforce_message_safety
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_message_update_safety();

-- 9. Enquiry immutability safety
CREATE OR REPLACE TRIGGER enforce_enquiry_safety
  BEFORE UPDATE ON public.enquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_enquiry_update_safety();

-- Also ensure notifications table is in realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- Ensure messages table is in realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
