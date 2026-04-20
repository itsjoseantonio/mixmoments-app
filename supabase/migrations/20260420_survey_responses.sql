-- Survey responses from the post-export modal
create table if not exists survey_responses (
  id         uuid primary key default gen_random_uuid(),
  user_id    text,                         -- Clerk user id, null for anonymous users
  use_case   text not null,
  feedback   text,
  created_at timestamptz not null default now()
);

-- Allow anyone to insert (anon key is used from the browser)
alter table survey_responses enable row level security;

create policy "anyone can insert survey responses"
  on survey_responses for insert
  with check (true);
