-- Add video webinar fields to destinations table
-- This allows admin to add presentation videos to destination pages

-- Add video columns to destinations table
ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_title_fr TEXT,
  ADD COLUMN IF NOT EXISTS video_title_en TEXT,
  ADD COLUMN IF NOT EXISTS video_duration TEXT;

-- Add comment to explain the columns
COMMENT ON COLUMN destinations.video_url IS 'YouTube/Vimeo embed URL for webinar video';
COMMENT ON COLUMN destinations.video_title_fr IS 'Video title in French';
COMMENT ON COLUMN destinations.video_title_en IS 'Video title in English';
COMMENT ON COLUMN destinations.video_duration IS 'Video duration (e.g., "45 min")';
