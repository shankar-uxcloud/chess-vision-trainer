-- Phase 4: privacy-controlled public player identity.
-- Existing profile rows are preserved and remain private by default.
begin;

alter table public.cvt_player_profiles
  add column if not exists username text,
  add column if not exists profile_public boolean not null default false,
  add column if not exists show_stats boolean not null default false;

alter table public.cvt_player_profiles
  drop constraint if exists cvt_player_profiles_username_format;
alter table public.cvt_player_profiles
  add constraint cvt_player_profiles_username_format
  check (
    username is null or (
      username = lower(username)
      and username ~ '^[a-z0-9][a-z0-9_]{2,19}$'
    )
  );

create unique index if not exists cvt_player_profiles_username_unique
  on public.cvt_player_profiles (lower(username))
  where username is not null;

create table if not exists public.cvt_profile_lookup_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_lookup_at timestamptz not null
);
alter table public.cvt_profile_lookup_limits enable row level security;
revoke all on public.cvt_profile_lookup_limits from public, anon, authenticated;

create or replace function public.find_public_player_profile(p_username text)
returns table (
  username text,
  display_name text,
  show_stats boolean,
  vision_rating integer,
  total_sessions integer,
  accuracy numeric,
  xp bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_claimed boolean;
  v_username text := lower(trim(coalesce(p_username, '')));
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if v_username !~ '^[a-z0-9][a-z0-9_]{2,19}$' then
    raise exception 'Enter a valid exact username';
  end if;

  insert into public.cvt_profile_lookup_limits(user_id, last_lookup_at)
  values (v_user_id, now())
  on conflict (user_id) do update
    set last_lookup_at = excluded.last_lookup_at
    where public.cvt_profile_lookup_limits.last_lookup_at < now() - interval '1 second'
  returning true into v_claimed;

  if not coalesce(v_claimed, false) then
    raise exception 'Please wait before searching again';
  end if;

  return query
  select
    p.username,
    p.display_name,
    p.show_stats,
    case when p.show_stats then nullif(p.progress #>> '{visionRating,current}', '')::integer else null end,
    case when p.show_stats then nullif(p.progress #>> '{stats,totalSessions}', '')::integer else null end,
    case when p.show_stats then
      case
        when coalesce(nullif(p.progress #>> '{stats,totalCorrect}', '')::numeric, 0)
           + coalesce(nullif(p.progress #>> '{stats,totalMistakes}', '')::numeric, 0) > 0
        then round(
          coalesce(nullif(p.progress #>> '{stats,totalCorrect}', '')::numeric, 0) * 100
          / (
            coalesce(nullif(p.progress #>> '{stats,totalCorrect}', '')::numeric, 0)
            + coalesce(nullif(p.progress #>> '{stats,totalMistakes}', '')::numeric, 0)
          ), 1
        )
        else null
      end
    else null end,
    case when p.show_stats then nullif(p.progress ->> 'xp', '')::bigint else null end
  from public.cvt_player_profiles p
  where lower(p.username) = v_username
    and p.profile_public = true
  limit 1;
end;
$$;

revoke all on function public.find_public_player_profile(text) from public, anon;
grant execute on function public.find_public_player_profile(text) to authenticated;

commit;
