-- Create enum for weakness types
create type weakness_type as enum ('SYSTEM_GENERATED', 'USER_DEFINED');

-- Create the user_weaknesses table
create table if not exists user_weaknesses (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text not null,
    weakness_type weakness_type not null default 'SYSTEM_GENERATED',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint user_weaknesses_limit unique (user_id, title)
);

-- Enable realtime
alter publication supabase_realtime add table user_weaknesses;

-- Row Level Security policies
alter table user_weaknesses enable row level security;

create policy "Users can view their own weaknesses"
    on user_weaknesses for select
    using (auth.uid() = user_id);

create policy "System can insert weaknesses"
    on user_weaknesses for insert
    with check (auth.uid() = user_id);

create policy "System can update weaknesses"
    on user_weaknesses for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their weaknesses"
    on user_weaknesses for delete
    using (auth.uid() = user_id);

-- Create indexes
create index idx_user_weaknesses_user_id on user_weaknesses(user_id);

-- Set up change tracking
create trigger set_updated_at_timestamp
    before update on user_weaknesses
    for each row
    execute function update_updated_at_timestamp(); 