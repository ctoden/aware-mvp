create table if not exists user_inner_circle (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    relationship_type text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint user_inner_circle_unique unique (user_id, name)
);

alter publication supabase_realtime add table user_inner_circle;
alter table user_inner_circle enable row level security;

create policy "Users can view their own inner circle"
    on user_inner_circle for select
    using (auth.uid() = user_id);

create policy "Users can insert into their inner circle"
    on user_inner_circle for insert
    with check (auth.uid() = user_id);

create policy "Users can update their inner circle"
    on user_inner_circle for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete from their inner circle"
    on user_inner_circle for delete
    using (auth.uid() = user_id);

create index idx_user_inner_circle_user_id on user_inner_circle(user_id);

create trigger set_updated_at_timestamp
    before update on user_inner_circle
    for each row
    execute function update_updated_at_timestamp();
