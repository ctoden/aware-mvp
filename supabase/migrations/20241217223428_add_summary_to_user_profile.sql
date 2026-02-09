-- Add summary column to user_profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'summary'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN summary TEXT;
        
        -- Add comment to the column
        COMMENT ON COLUMN public.user_profiles.summary IS 'User profile summary text';
    END IF;
END $$;