-- Per-user learning journey progress. Apply in Supabase SQL Editor.
create table if not exists public.cvt_learning_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{"version":1,"completed":{},"selectedUnit":0,"selectedLesson":0}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.cvt_learning_progress enable row level security;
drop policy if exists "Players can read their own learning progress" on public.cvt_learning_progress;
create policy "Players can read their own learning progress" on public.cvt_learning_progress
 for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Players can insert their own learning progress" on public.cvt_learning_progress;
create policy "Players can insert their own learning progress" on public.cvt_learning_progress
 for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Players can update their own learning progress" on public.cvt_learning_progress;
create policy "Players can update their own learning progress" on public.cvt_learning_progress
 for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update on public.cvt_learning_progress to authenticated;
