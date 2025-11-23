-- Migration: Add image support to blog posts
-- This enables featured images and inline content images

-- Add content_images column to blog_posts for inline images
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS content_images JSONB DEFAULT '[]'::jsonb;

-- Add index for content_images for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_content_images 
ON blog_posts USING GIN(content_images);

-- Ensure featured_image column exists and allows NULL
-- (It should already exist from initial schema, but we'll make sure)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'featured_image'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN featured_image TEXT;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN blog_posts.content_images IS 
'Array of image objects for inline content: [{url: string, alt: string, caption: string, position: number}]';

COMMENT ON COLUMN blog_posts.featured_image IS 
'URL of the featured/hero image for the blog post';

-- Create storage bucket for blog images (if not exists)
-- Note: This needs to be done via Supabase Dashboard or CLI
-- Bucket name: blog-images
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- Storage policies will be created separately
-- These allow authenticated users to upload and manage images

