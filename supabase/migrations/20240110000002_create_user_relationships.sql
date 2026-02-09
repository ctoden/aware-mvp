-- conventional commit: feat: add relationships table for user relationships
-- Create user_relationships table

create table if not exists user_relationships (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    key_terms text[] not null,
    description text not null,
    communication_style_title text not null,
    communication_style_description text not null,
    conflict_style_title text not null,
    conflict_style_description text not null,
    attachment_style_title text not null,
    attachment_style_description text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime
alter publication supabase_realtime add table user_relationships;

-- Enable Row Level Security (RLS)
alter table user_relationships enable row level security;

-- Access policies
create policy "Users can view their own relationships"
    on user_relationships for select
    using (auth.uid() = user_id);

create policy "System can insert relationships"
    on user_relationships for insert
    with check (auth.uid() = user_id);

create policy "System can update relationships"
    on user_relationships for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their relationships"
    on user_relationships for delete
    using (auth.uid() = user_id);

-- Auto-updates updated_at timestamp
create or replace function update_relationships_updated_at_timestamp()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger set_user_relationships_updated_at
    before update on user_relationships
    for each row
    execute function update_relationships_updated_at_timestamp(); 