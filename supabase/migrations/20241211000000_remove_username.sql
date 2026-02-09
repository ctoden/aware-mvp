-- Remove username column and its constraint from user_profiles table
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS username_length;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS username; 