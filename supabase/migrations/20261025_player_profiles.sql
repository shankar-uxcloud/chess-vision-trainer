-- Chess Vision Trainer: per-account profile and progress snapshots.
-- Apply this migration in the Supabase SQL Editor before using cloud sync.
create table if not exists public.cvt_player_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Chess Player'
    check (char_length(display_name) between 1 and 60),
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.cvt_player_profiles enable row level security;

drop policy if exists "Players can read their own profile" on public.cvt_player_profiles;
create policy "Players can read their own profile"
  on public.cvt_player_profiles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Players can create their own profile" on public.cvt_player_profiles;
create policy "Players can create their own profile"
  on public.cvt_player_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Players can update their own profile" on public.cvt_player_profiles;
create policy "Players can update their own profile"
  on public.cvt_player_profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.cvt_player_profiles to authenticated;
