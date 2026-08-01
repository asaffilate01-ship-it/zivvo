-- Storage bucket for car images (we create a policy via SQL)
INSERT INTO storage.buckets (id, name, public) VALUES ('car-images', 'car-images', true);

-- Allow authenticated users to upload car images
CREATE POLICY "Authenticated users can upload car images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'car-images');

-- Allow public read access to car images
CREATE POLICY "Public can view car images" ON storage.objects FOR SELECT USING (bucket_id = 'car-images');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own car images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'car-images' AND (storage.foldername(name))[1] = auth.uid()::text);
