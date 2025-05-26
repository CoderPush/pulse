create table public.submission_shares (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  shared_with_id uuid not null references public.users(id) on delete cascade,
  shared_by_id uuid not null references public.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Optional: Add an index to speed up lookups for a given user or submission
create index idx_submission_shares_submission_id on public.submission_shares (submission_id);
create index idx_submission_shares_shared_with_id on public.submission_shares (shared_with_id);
