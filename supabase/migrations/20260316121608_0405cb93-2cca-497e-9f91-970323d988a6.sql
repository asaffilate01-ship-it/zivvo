
-- Fix overly permissive referral insert policy
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;
CREATE POLICY "Authenticated can insert referrals for self" ON public.referrals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = referred_id);
