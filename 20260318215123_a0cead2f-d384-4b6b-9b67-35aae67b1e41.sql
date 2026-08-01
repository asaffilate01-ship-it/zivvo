
-- Add logbook and HPI check fields to car_listings
ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS logbook_url text,
  ADD COLUMN IF NOT EXISTS hpi_check_data jsonb;

-- Create storage bucket for listing KYC documents (logbooks etc)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-documents', 'listing-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: sellers can upload their own documents
CREATE POLICY "Sellers can upload listing documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: sellers can view their own documents
CREATE POLICY "Sellers can view own listing documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'listing-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: admins can view all listing documents
CREATE POLICY "Admins can view all listing documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'listing-documents' AND public.has_role(auth.uid(), 'admin'));
