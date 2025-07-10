-- Add latitude and longitude columns to users table
ALTER TABLE users 
ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL,
ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL;

-- Add index for better performance on location queries
CREATE INDEX idx_users_location ON users(latitude, longitude);

-- Update existing users with default coordinates (optional - you can remove this if you don't want defaults)
-- UPDATE users SET latitude = 40.7128, longitude = -74.0060 WHERE latitude IS NULL AND longitude IS NULL; 