-- Storage policies for location-img bucket with private folder structure
-- Run this in your Supabase SQL editor

-- Policy for uploading to private folder
CREATE POLICY "Users can upload to their private folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'location-img'::text 
  AND (storage.foldername(name))[1] = 'private'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy for reading from private folder (only own images)
CREATE POLICY "Users can read their own private images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'location-img'::text 
  AND (storage.foldername(name))[1] = 'private'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy for updating own private images
CREATE POLICY "Users can update their own private images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'location-img'::text 
  AND (storage.foldername(name))[1] = 'private'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy for deleting own private images
CREATE POLICY "Users can delete their own private images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'location-img'::text 
  AND (storage.foldername(name))[1] = 'private'
  AND (storage.foldername(name))[2] = auth.uid()::text
); 