DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN phone_number TEXT;
        
        -- Add comment to the column
        COMMENT ON COLUMN public.user_profiles.phone_number IS 'User''s phone number';
    END IF;
END $$;
