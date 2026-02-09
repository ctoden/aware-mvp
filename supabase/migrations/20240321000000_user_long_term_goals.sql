create table if not exists user_long_term_goals (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    goal text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter publication supabase_realtime add table user_long_term_goals;
alter table user_long_term_goals enable row level security;

create policy "Users can view their own long term goals"
    on user_long_term_goals for select
    using (auth.uid() = user_id);

create policy "Users can insert their own long term goals"
    on user_long_term_goals for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own long term goals"
    on user_long_term_goals for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own long term goals"
    on user_long_term_goals for delete
    using (auth.uid() = user_id);

create index idx_user_long_term_goals_user_id on user_long_term_goals(user_id);

create trigger set_updated_at_timestamp
    before update on user_long_term_goals
    for each row
    execute function update_updated_at_timestamp(); 