-- Create enum for dig deeper question types
create type dig_deeper_question_type as enum ('ONBOARDING_DATA', 'PERSONALITY_INSIGHTS');

-- Create enum for dig deeper question status
create type dig_deeper_question_status as enum ('PENDING', 'ANSWERED', 'SKIPPED');

-- Create the dig_deeper_questions table
create table if not exists dig_deeper_questions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    question text not null,
    question_type dig_deeper_question_type not null,
    context text not null,
    status dig_deeper_question_status not null default 'PENDING',
    answer text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable realtime
alter publication supabase_realtime add table dig_deeper_questions;

-- Set up Row Level Security (RLS)
alter table dig_deeper_questions enable row level security;

-- Create policies
create policy "Users can view their own dig deeper questions"
    on dig_deeper_questions for select
    using (auth.uid() = user_id);

create policy "System can insert dig deeper questions"
    on dig_deeper_questions for insert
    with check (auth.uid() = user_id);

create policy "System can update dig deeper questions"
    on dig_deeper_questions for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their dig deeper questions"
    on dig_deeper_questions for delete
    using (auth.uid() = user_id);

-- Create indexes
create index idx_dig_deeper_questions_user_id on dig_deeper_questions(user_id);
create index idx_dig_deeper_questions_status on dig_deeper_questions(status);

-- Set up change tracking
create trigger set_updated_at_timestamp
    before update on dig_deeper_questions
    for each row
    execute function update_updated_at_timestamp();
