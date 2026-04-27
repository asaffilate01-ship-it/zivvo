
-- 1. Lock down user_roles: only admins may insert/update/delete
DROP POLICY IF EXISTS "Users cannot self-assign roles" ON public.user_roles;
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Restrict car-images / car-videos uploads to user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload car images" ON storage.objects;
CREATE POLICY "Users upload car images to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'car-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Authenticated users can upload car videos" ON storage.objects;
CREATE POLICY "Users upload car videos to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'car-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Harden dealer self-update with WITH CHECK (defence-in-depth alongside trigger)
DROP POLICY IF EXISTS "Dealers can update own record" ON public.dealers;
CREATE POLICY "Dealers can update own record"
  ON public.dealers FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND tier IS NOT DISTINCT FROM (SELECT d.tier FROM public.dealers d WHERE d.id = dealers.id)
    AND subscription_status IS NOT DISTINCT FROM (SELECT d.subscription_status FROM public.dealers d WHERE d.id = dealers.id)
    AND stripe_customer_id IS NOT DISTINCT FROM (SELECT d.stripe_customer_id FROM public.dealers d WHERE d.id = dealers.id)
    AND stripe_subscription_id IS NOT DISTINCT FROM (SELECT d.stripe_subscription_id FROM public.dealers d WHERE d.id = dealers.id)
    AND kyc_verified IS NOT DISTINCT FROM (SELECT d.kyc_verified FROM public.dealers d WHERE d.id = dealers.id)
    AND kyc_approved_at IS NOT DISTINCT FROM (SELECT d.kyc_approved_at FROM public.dealers d WHERE d.id = dealers.id)
    AND approved_by IS NOT DISTINCT FROM (SELECT d.approved_by FROM public.dealers d WHERE d.id = dealers.id)
    AND max_listings IS NOT DISTINCT FROM (SELECT d.max_listings FROM public.dealers d WHERE d.id = dealers.id)
    AND is_active IS NOT DISTINCT FROM (SELECT d.is_active FROM public.dealers d WHERE d.id = dealers.id)
  );
