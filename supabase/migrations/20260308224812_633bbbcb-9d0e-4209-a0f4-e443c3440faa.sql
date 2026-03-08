-- Create public bucket for pictochat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pc-images', 'pc-images', true, 5242880, ARRAY['image/jpeg','image/png','image/gif','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to pc-images
CREATE POLICY "Anyone can upload pc images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'pc-images');

-- Allow anyone to read pc images
CREATE POLICY "Anyone can read pc images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'pc-images');