-- Create enum for about you section types
create type about_you_section_type as enum ('SELF_AWARENESS', 'RELATIONSHIPS', 'CAREER_DEVELOPMENT');

-- Create the user_about_you table
create table if not exists user_about_you (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text not null,
    section_type about_you_section_type not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable realtime
alter publication supabase_realtime add table user_about_you;

-- Row Level Security policies
alter table user_about_you enable row level security;

create policy "Users can view their own about you entries"
    on user_about_you for select
    using (auth.uid() = user_id);

create policy "System can insert about you entries"
    on user_about_you for insert
    with check (auth.uid() = user_id);

create policy "System can update about you entries"
    on user_about_you for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their about you entries"
    on user_about_you for delete
    using (auth.uid() = user_id);

-- Create indexes
create index idx_user_about_you_user_id on user_about_you(user_id);

-- Trigger to automatically update updated_at
create trigger set_updated_at_timestamp
    before update on user_about_you
    for each row
    execute function update_updated_at_timestamp();

