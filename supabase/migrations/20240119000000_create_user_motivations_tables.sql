-- Create enum for motivation types
create type motivation_type as enum ('SYSTEM_GENERATED', 'USER_DEFINED');

-- Create the user_motivations table
create table if not exists user_motivations (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text not null,
    motivation_type motivation_type not null default 'SYSTEM_GENERATED',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint user_motivations_limit unique (user_id, title)
);

-- Enable realtime
alter publication supabase_realtime add table user_motivations;

-- Row Level Security policies
alter table user_motivations enable row level security;

create policy "Users can view their own motivations"
    on user_motivations for select
    using (auth.uid() = user_id);

create policy "System can insert motivations"
    on user_motivations for insert
    with check (auth.uid() = user_id);

create policy "System can update motivations"
    on user_motivations for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their motivations"
    on user_motivations for delete
    using (auth.uid() = user_id);

-- Create indexes
create index idx_user_motivations_user_id on user_motivations(user_id);

-- Set up change tracking
create trigger set_updated_at_timestamp
    before update on user_motivations
    for each row
    execute function update_updated_at_timestamp(); 