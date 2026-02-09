-- Create enum for message sender types
create type message_sender as enum ('user', 'assistant');

-- Create the chats table
create table if not exists chats (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    is_main boolean default false not null,
    -- Add a constraint to ensure unique titles per user
    constraint chats_title_user_unique unique (user_id, title)
);

-- Create the messages table
create table if not exists messages (
    id uuid primary key default uuid_generate_v4(),
    chat_id uuid references chats(id) on delete cascade not null,
    sender message_sender not null,
    content text not null,
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable realtime
alter publication supabase_realtime add table chats;
alter publication supabase_realtime add table messages;

-- Set up Row Level Security (RLS)
alter table chats enable row level security;
alter table messages enable row level security;

-- Create policies for chats
create policy "Users can view their own chats"
    on chats for select
    using (auth.uid() = user_id);

create policy "Users can insert their own chats"
    on chats for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own non-main chats"
    on chats for update
    using (auth.uid() = user_id and not is_main)
    with check (auth.uid() = user_id and not is_main);

create policy "Users can delete their own non-main chats"
    on chats for delete
    using (auth.uid() = user_id and not is_main);

-- Create policies for messages
create policy "Users can view messages in their chats"
    on messages for select
    using (
        exists (
            select 1 from chats
            where chats.id = messages.chat_id
            and chats.user_id = auth.uid()
        )
    );

create policy "Users can insert messages in their chats"
    on messages for insert
    with check (
        exists (
            select 1 from chats
            where chats.id = messages.chat_id
            and chats.user_id = auth.uid()
        )
    );

-- Create indexes
create index idx_chats_user_id on chats(user_id);
create index idx_messages_chat_id on messages(chat_id);
create index idx_messages_timestamp on messages(timestamp);

-- Create updated_at trigger for chats
create trigger set_chats_updated_at
    before update on chats
    for each row
    execute function update_updated_at_timestamp(); 