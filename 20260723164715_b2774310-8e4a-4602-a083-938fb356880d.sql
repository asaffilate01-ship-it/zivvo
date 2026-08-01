
-- Fix overly permissive audit log insert policy
DROP POLICY "System and admins can insert audit entries" ON public.auction_audit_log;

-- Only allow authenticated users to insert audit entries for their own actions or auctions they're involved in
CREATE POLICY "Users can insert own audit entries" ON public.auction_audit_log FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = actor_id
    OR public.has_role(auth.uid(), 'admin')
  );
