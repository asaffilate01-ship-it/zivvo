
-- Fix: drop the broken trigger that referenced a not-yet-created function, then recreate properly
DROP TRIGGER IF EXISTS trg_notify_on_listing_report ON public.listing_reports;

CREATE OR REPLACE FUNCTION public.notify_admins_on_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      admin_record.user_id,
      'report',
      'Listing reported',
      'A listing has been reported for: ' || NEW.reason,
      '/admin'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_listing_report
  AFTER INSERT ON public.listing_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_report();
