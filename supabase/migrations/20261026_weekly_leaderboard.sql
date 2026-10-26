-- Weekly challenge leaderboard. Apply in Supabase SQL Editor.
create table if not exists public.cvt_weekly_leaderboard (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_key text not null check (week_key ~ '^\d{4}-W\d{2}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  points integer not null default 0 check (points >= 0 and points <= 1000000000),
  sessions integer not null default 0 check (sessions >= 0 and sessions <= 1000000),
  correct integer not null default 0 check (correct >= 0 and correct <= 10000000),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_key)
);
create index if not exists cvt_weekly_leaderboard_week_points_idx
  on public.cvt_weekly_leaderboard (week_key, points desc, correct desc);

alter table public.cvt_weekly_leaderboard enable row level security;
drop policy if exists "Authenticated players can read weekly leaderboard" on public.cvt_weekly_leaderboard;
create policy "Authenticated players can read weekly leaderboard"
  on public.cvt_weekly_leaderboard for select to authenticated using (true);
drop policy if exists "Players can insert their own weekly score" on public.cvt_weekly_leaderboard;
create policy "Players can insert their own weekly score"
  on public.cvt_weekly_leaderboard for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Players can update their own weekly score" on public.cvt_weekly_leaderboard;
create policy "Players can update their own weekly score"
  on public.cvt_weekly_leaderboard for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update on public.cvt_weekly_leaderboard to authenticated;
