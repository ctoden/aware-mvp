-- conventional commit: feat: create main_interests table

-- Create main interests table
create table if not exists user_main_interests (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    interest text not null,
    created_at timestamp with time zone default timezone('utc', now()),
    updated_at timestamp with time zone default timezone('utc', now())
);

-- Enable row level security
alter table user_main_interests enable row level security;

-- Create policies
create policy "Users can view their own interests"
    on user_main_interests for select
    using (auth.uid() = user_id);

create policy "Users can insert their own interests"
    on user_main_interests for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own interests"
    on user_main_interests for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own interests"
    on user_main_interests for delete
    using (auth.uid() = user_id);

-- Enable realtime
alter publication supabase_realtime add table user_main_interests;

-- Create updated_at trigger function
create or replace function update_main_interests_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger set_updated_at
    before update on user_main_interests
    for each row
    execute function update_main_interests_updated_at();
