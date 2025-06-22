-- Add coordinate columns to quests table for Google Maps integration
-- This migration adds latitude, longitude, and location metadata columns

ALTER TABLE quests 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_name TEXT,
ADD COLUMN IF NOT EXISTS location_address TEXT,
ADD COLUMN IF NOT EXISTS location_rating DECIMAL(3, 2),
ADD COLUMN IF NOT EXISTS location_place_id TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quests_coordinates ON quests(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_quests_completed_at ON quests(completed_at);
CREATE INDEX IF NOT EXISTS idx_quests_status_coordinates ON quests(status, latitude, longitude) WHERE status = 'completed';

-- Add comments for documentation
COMMENT ON COLUMN quests.latitude IS 'Latitude coordinate for quest location';
COMMENT ON COLUMN quests.longitude IS 'Longitude coordinate for quest location';
COMMENT ON COLUMN quests.location_name IS 'Name of the quest location (e.g., "UC Berkeley Greek Theatre")';
COMMENT ON COLUMN quests.location_address IS 'Full address of the quest location';
COMMENT ON COLUMN quests.location_rating IS 'Google Maps rating of the location (1-5 scale)';
COMMENT ON COLUMN quests.location_place_id IS 'Google Maps Place ID for the location'; 