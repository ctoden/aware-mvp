-- Add FTUX fields to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN has_completed_intro boolean DEFAULT false,
ADD COLUMN has_completed_ftux boolean DEFAULT false,
ADD COLUMN ftux_current_step integer DEFAULT 0;

-- Update trigger to initialize FTUX fields for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SET search_path = ''
as $$
begin
  insert into public.user_profiles (
    id, 
    full_name, 
    avatar_url, 
    has_completed_intro, 
    has_completed_ftux, 
    ftux_current_step
  )
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    false,
    false,
    0
  );
  return new;
end;
$$ language plpgsql security definer;