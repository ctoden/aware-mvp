-- Create enum for core value types
create type core_value_type as enum ('SYSTEM_GENERATED', 'USER_DEFINED');

-- Create updated_at timestamp trigger function
create or replace function update_updated_at_timestamp()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create the user_core_values table
create table if not exists user_core_values (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text not null,
    value_type core_value_type not null default 'SYSTEM_GENERATED',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    -- Add a constraint to ensure unique titles per user
    constraint user_core_values_limit unique (user_id, title)
);

-- Enable realtime
alter publication supabase_realtime add table user_core_values;

-- Set up Row Level Security (RLS)
alter table user_core_values enable row level security;

-- Create policies
create policy "Users can view their own core values"
    on user_core_values for select
    using (auth.uid() = user_id);

create policy "System can insert core values"
    on user_core_values for insert
    with check (auth.uid() = user_id);

create policy "System can update core values"
    on user_core_values for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their core values"
    on user_core_values for delete
    using (auth.uid() = user_id);

-- Create indexes
create index idx_user_core_values_user_id on user_core_values(user_id);

-- Set up change tracking
create trigger set_updated_at_timestamp
    before update on user_core_values
    for each row
    execute function update_updated_at_timestamp();