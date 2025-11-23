-- Storage Policies for Blog Images
-- Using existing 'blog' bucket
-- Run these to enable blog image uploads

-- Policy: Allow authenticated users to upload blog images
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog');

-- Policy: Allow anyone to view blog images (public bucket)
CREATE POLICY "Anyone can view blog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog');

-- Policy: Allow authenticated users to update their uploaded images
CREATE POLICY "Authenticated users can update blog images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'blog');

-- Policy: Allow authenticated users to delete blog images
CREATE POLICY "Authenticated users can delete blog images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'blog');

-- Note: Using existing 'blog' bucket - no need to create new bucket!
