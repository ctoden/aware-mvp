-- Create the user_professional_development table
create table if not exists user_professional_development (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    key_terms text[] not null default '{}',
    description text not null,
    leadership_style_title text not null,
    leadership_style_description text not null,
    goal_setting_style_title text not null,
    goal_setting_style_description text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint user_professional_development_user_id_key unique (user_id)
);

-- Enable realtime
alter publication supabase_realtime add table user_professional_development;

-- Row Level Security policies
alter table user_professional_development enable row level security;

create policy "Users can view their own professional development"
    on user_professional_development for select
    using (auth.uid() = user_id);

create policy "System can insert professional development"
    on user_professional_development for insert
    with check (auth.uid() = user_id);

create policy "System can update professional development"
    on user_professional_development for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their professional development"
    on user_professional_development for delete
    using (auth.uid() = user_id);

-- Create indexes
create index idx_user_professional_development_user_id on user_professional_development(user_id);

-- Trigger to automatically update updated_at
create trigger set_updated_at_timestamp
    before update on user_professional_development
    for each row
    execute function update_updated_at_timestamp(); 