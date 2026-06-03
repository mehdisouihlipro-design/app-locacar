-- Run this in Supabase SQL Editor

create table if not exists public.app_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_snapshots enable row level security;

drop policy if exists "read own snapshot" on public.app_snapshots;
create policy "read own snapshot"
  on public.app_snapshots
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "upsert own snapshot" on public.app_snapshots;
create policy "upsert own snapshot"
  on public.app_snapshots
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
