-- conventional commit: feat: add family story to user profiles

-- Add family_story column to user_profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'family_story'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN family_story TEXT;
        
        -- Add comment to the column
        COMMENT ON COLUMN public.user_profiles.family_story IS 'User''s family story and background';
    END IF;
END $$;
