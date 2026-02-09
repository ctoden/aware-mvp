-- conventional commit: feat: add primary occupation to user profiles

-- Add primary_occupation column to user_profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'primary_occupation'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN primary_occupation TEXT;
        
        -- Add comment to the column
        COMMENT ON COLUMN public.user_profiles.primary_occupation IS 'User''s primary occupation or career';
    END IF;
END $$;
