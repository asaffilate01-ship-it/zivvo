
-- Create car-videos storage bucket for direct video uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('car-videos', 'car-videos', true, 104857600)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload car videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'car-videos');

-- Allow public to view car videos
CREATE POLICY "Public can view car videos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'car-videos');

-- Allow users to delete their own videos
CREATE POLICY "Users can delete own car videos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'car-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
