DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'birth_date'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN birth_date DATE;
        
        -- Add comment to the column
        COMMENT ON COLUMN public.user_profiles.birth_date IS 'User''s date of birth';
    END IF;
END $$;
