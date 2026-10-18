-- Run once in Supabase Dashboard > SQL Editor for the project configured in auth.js.
begin;
create table if not exists public.user_vision_ratings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rating integer not null default 1000 check (rating between 400 and 2400),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  sessions_count integer not null default 0 check (sessions_count >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.vision_rating_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null check (length(session_id) between 1 and 200),
  rating_after integer not null check (rating_after between 400 and 2400),
  delta integer not null,
  performance numeric(6,5) not null check (performance between 0 and 1),
  created_at timestamptz not null default now(),
  primary key (user_id, session_id)
);
alter table public.user_vision_ratings enable row level security;
alter table public.vision_rating_sessions enable row level security;
drop policy if exists "Users can read their own Vision Rating" on public.user_vision_ratings;
create policy "Users can read their own Vision Rating" on public.user_vision_ratings
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can read their own Vision Rating sessions" on public.vision_rating_sessions;
create policy "Users can read their own Vision Rating sessions" on public.vision_rating_sessions
  for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.user_vision_ratings from anon, authenticated;
revoke insert, update, delete on public.vision_rating_sessions from anon, authenticated;
grant select on public.user_vision_ratings to authenticated;
grant select on public.vision_rating_sessions to authenticated;

create or replace function public.get_my_vision_rating()
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_user_id uuid := auth.uid(); v_profile public.user_vision_ratings%rowtype;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  insert into public.user_vision_ratings(user_id) values(v_user_id) on conflict(user_id) do nothing;
  select * into v_profile from public.user_vision_ratings where user_id = v_user_id;
  return jsonb_build_object('rating',v_profile.rating,'history',v_profile.history,
    'sessions_count',v_profile.sessions_count,'updated_at',v_profile.updated_at);
end;
$$;

create or replace function public.record_vision_rating(
  p_session_id text, p_correct integer, p_mistakes integer, p_average_reaction_ms numeric,
  p_best_streak integer, p_duration_seconds integer, p_mode text
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid(); v_profile public.user_vision_ratings%rowtype;
  v_existing public.vision_rating_sessions%rowtype; v_attempts integer;
  v_accuracy numeric; v_reaction numeric; v_consistency numeric; v_difficulty numeric;
  v_recent numeric; v_performance numeric; v_delta integer; v_rating integer;
  v_history jsonb; v_entry jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_session_id is null or length(p_session_id) not between 1 and 200 then raise exception 'Invalid session id'; end if;
  if p_correct is null or p_mistakes is null or p_correct < 0 or p_mistakes < 0
     or p_correct > 1000000 or p_mistakes > 1000000 then raise exception 'Invalid answer counts'; end if;
  if p_average_reaction_ms is null or p_average_reaction_ms < 0 or p_average_reaction_ms > 30000 then raise exception 'Invalid reaction time'; end if;
  if p_best_streak is null or p_best_streak < 0 or p_best_streak > p_correct + p_mistakes then raise exception 'Invalid streak'; end if;
  if p_duration_seconds is null or p_duration_seconds < 0 or p_duration_seconds > 86400 then raise exception 'Invalid duration'; end if;
  if p_mode not in ('square','coordinate','reverse','knight','blindfold','color','custom') then raise exception 'Unsupported rating mode'; end if;

  insert into public.user_vision_ratings(user_id) values(v_user_id) on conflict(user_id) do nothing;
  select * into v_profile from public.user_vision_ratings where user_id = v_user_id for update;
  select * into v_existing from public.vision_rating_sessions where user_id = v_user_id and session_id = p_session_id;
  if found then
    return jsonb_build_object('rating',v_profile.rating,'history',v_profile.history,
      'sessions_count',v_profile.sessions_count,'duplicate',true);
  end if;

  v_attempts := p_correct + p_mistakes;
  if v_attempts < 5 then
    return jsonb_build_object('rating',v_profile.rating,'history',v_profile.history,
      'sessions_count',v_profile.sessions_count,'delta',0,'performance',0,'ignored',true);
  end if;
  v_accuracy := p_correct::numeric / greatest(v_attempts,1);
  v_reaction := greatest(0,least(1,1-(p_average_reaction_ms-450)/2550));
  v_consistency := greatest(0,least(1,p_best_streak::numeric/greatest(v_attempts,1)*1.6));
  v_difficulty := case when p_mode='knight' then 0.9 when p_mode='reverse' then 0.82
    when p_mode='blindfold' then 0.86 when p_mode='color' then 0.68
    when p_duration_seconds <= 45 then 0.82 when p_duration_seconds >= 120 then 0.76 else 0.7 end;
  select avg((entry->>'performance')::numeric) into v_recent
  from (select entry from jsonb_array_elements(v_profile.history) with ordinality h(entry,ord)
        order by ord desc limit 5) recent
  where entry ? 'performance' and (entry->>'performance') ~ '^[0-9]+(\.[0-9]+)?$';
  v_recent := coalesce(v_recent,v_accuracy);
  v_performance := v_accuracy*0.42 + v_reaction*0.20 + v_difficulty*0.13 + v_consistency*0.15 + v_recent*0.10;
  v_delta := round(greatest(-42,least(42,(v_performance-0.5)*84)))::integer;
  v_rating := greatest(400,least(2400,v_profile.rating+v_delta));
  v_entry := jsonb_build_object('date',now(),'rating',v_rating,'delta',v_delta,
    'performance',round(v_performance,4),'mode',p_mode);
  v_history := v_profile.history || jsonb_build_array(v_entry);
  select coalesce(jsonb_agg(item order by ord),'[]'::jsonb) into v_history
  from (select value as item,ord from jsonb_array_elements(v_history) with ordinality h(value,ord)
        order by ord desc limit 100) kept;
  update public.user_vision_ratings set rating=v_rating,history=v_history,
    sessions_count=sessions_count+1,updated_at=now() where user_id=v_user_id;
  insert into public.vision_rating_sessions(user_id,session_id,rating_after,delta,performance)
    values(v_user_id,p_session_id,v_rating,v_delta,v_performance);
  return jsonb_build_object('rating',v_rating,'history',v_history,
    'sessions_count',v_profile.sessions_count+1,'delta',v_delta,
    'performance',round(v_performance,4),'duplicate',false);
end;
$$;
revoke all on function public.get_my_vision_rating() from public;
revoke all on function public.record_vision_rating(text,integer,integer,numeric,integer,integer,text) from public;
grant execute on function public.get_my_vision_rating() to authenticated;
grant execute on function public.record_vision_rating(text,integer,integer,numeric,integer,integer,text) to authenticated;
commit;
