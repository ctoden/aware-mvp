create table if not exists user_quick_insights (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null check (char_length(title) <= 200 and char_length(trim(title)) > 0),
    description text not null check (char_length(description) <= 2000 and char_length(trim(description)) > 0),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable real-time updates
alter publication supabase_realtime add table user_quick_insights;

-- Enable Row Level Security
alter table user_quick_insights enable row level security;

-- Create policies
create policy "Users can view their own insights"
    on user_quick_insights for select
    using (auth.uid() = user_id);

create policy "Users can create their own insights"
    on user_quick_insights for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own insights"
    on user_quick_insights for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own insights"
    on user_quick_insights for delete
    using (auth.uid() = user_id);

-- Create index for better query performance
create index idx_user_quick_insights_user_id on user_quick_insights(user_id);

-- Add trigger for updating the updated_at timestamp
create trigger set_user_quick_insights_updated_at
    before update on user_quick_insights
    for each row
    execute function update_updated_at_timestamp();
