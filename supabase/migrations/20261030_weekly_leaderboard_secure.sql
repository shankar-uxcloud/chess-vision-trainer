-- Phase 2: make weekly leaderboard writes server-controlled.
-- Existing leaderboard rows are retained. Client-side aggregate upserts are revoked.
begin;

create table if not exists public.cvt_weekly_challenge_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_key text not null check (week_key ~ '^\d{4}-W\d{2}$'),
  session_id text not null check (char_length(session_id) between 1 and 200),
  mode text not null check (mode in ('square','coordinate','reverse','knight','blindfold','color','custom','daily')),
  correct integer not null check (correct between 0 and 10000),
  accuracy numeric(5,2) not null check (accuracy between 0 and 100),
  best_streak integer not null check (best_streak between 0 and 10000),
  duration_seconds integer not null check (duration_seconds between 0 and 86400),
  points integer not null check (points between 0 and 100250),
  completed_at timestamptz not null,
  submitted_at timestamptz not null default now(),
  primary key (user_id, session_id)
);
create index if not exists cvt_weekly_challenge_sessions_user_week_idx
  on public.cvt_weekly_challenge_sessions(user_id, week_key);

alter table public.cvt_weekly_challenge_sessions enable row level security;
revoke all on public.cvt_weekly_challenge_sessions from anon, authenticated;
grant select, insert, update, delete on public.cvt_weekly_challenge_sessions to service_role;

-- Authenticated users may read public leaderboard rows, but cannot write their own totals.
drop policy if exists "Players can insert their own weekly score" on public.cvt_weekly_leaderboard;
drop policy if exists "Players can update their own weekly score" on public.cvt_weekly_leaderboard;
revoke insert, update, delete on public.cvt_weekly_leaderboard from anon, authenticated;
grant select on public.cvt_weekly_leaderboard to authenticated;
grant select, insert, update, delete on public.cvt_weekly_leaderboard to service_role;

create table if not exists public.cvt_weekly_challenge_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_request_at timestamptz not null
);
alter table public.cvt_weekly_challenge_rate_limits enable row level security;
revoke all on public.cvt_weekly_challenge_rate_limits from anon, authenticated, service_role;

create or replace function public.claim_cvt_weekly_submission_slot()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_claimed boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.cvt_weekly_challenge_rate_limits(user_id, last_request_at)
  values (v_user_id, now())
  on conflict (user_id) do update
    set last_request_at = excluded.last_request_at
    where public.cvt_weekly_challenge_rate_limits.last_request_at < now() - interval '2 seconds'
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end;
$$;

revoke all on function public.claim_cvt_weekly_submission_slot() from public, anon;
grant execute on function public.claim_cvt_weekly_submission_slot() to authenticated;

commit;
