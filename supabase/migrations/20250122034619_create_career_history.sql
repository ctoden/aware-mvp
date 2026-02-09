create table if not exists career_history (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    position_text text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable realtime for career_history table
alter publication supabase_realtime add table career_history;

-- Enable Row Level Security
alter table career_history enable row level security;

-- RLS Policies
create policy "Users can view their own career history"
    on career_history for select
    using (auth.uid() = user_id);

create policy "Users can insert their own career history"
    on career_history for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own career history"
    on career_history for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own career history"
    on career_history for delete
    using (auth.uid() = user_id);

-- Index for faster lookups by user_id
create index idx_career_history_user_id on career_history(user_id);

-- Trigger for updating the updated_at timestamp
create trigger set_career_history_timestamp
    before update on career_history
    for each row
    execute function update_updated_at_timestamp();
