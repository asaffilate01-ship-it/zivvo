
-- Fix: Replace overly permissive insert policy on notifications
-- Only service role and the notify-enquiry edge function should insert, 
-- but we also need sellers to potentially be notified, so scope to authenticated users
DROP POLICY "Service can insert notifications" ON public.notifications;

-- Allow admins and the system to insert notifications (via service role key in edge functions)
-- Regular users shouldn't insert notifications directly
CREATE POLICY "Admins can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow users to delete own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
