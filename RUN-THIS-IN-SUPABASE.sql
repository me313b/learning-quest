-- ===========================================================================
--  Learning Quest — optional setup (run ONCE in Supabase → SQL Editor)
--  Paste this whole file in and press RUN. Safe to run more than once.
--  This switches on:
--    • the "+5 / +10 bonus minutes today" buttons in the parent dashboard
--    • the daily-limit and minutes-per-correct controls in Settings
--    • the voice cache in Supabase Storage (so French/English clips are
--      generated once, then reused — keeps usage and cost down)
-- ===========================================================================

-- 1) Parent-tunable video-time economy ------------------------------------
alter table public.account_settings
  add column if not exists reward_daily_cap_min  numeric default 30;
alter table public.account_settings
  add column if not exists reward_per_correct_min numeric default 1;

-- Extra minutes a parent grants for a single day
alter table public.sessions
  add column if not exists bonus_minutes numeric default 0;

-- 2) Voice cache in Supabase Storage --------------------------------------
-- Generated speech is stored as MP3 objects under <your-user-id>/<hash>.mp3 in
-- a private "audio" bucket. Row-level policies keep each family's clips private.

insert into storage.buckets (id, name, public)
values ('audio', 'audio', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'lq_audio_read'
  ) then
    create policy lq_audio_read on storage.objects for select
      using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'lq_audio_insert'
  ) then
    create policy lq_audio_insert on storage.objects for insert
      with check (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'lq_audio_update'
  ) then
    create policy lq_audio_update on storage.objects for update
      using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text)
      with check (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

-- 3) PhET simulation activity log -----------------------------------------
-- Records which PhET simulations a child explored, for the parent dashboard.
-- Owner is stamped automatically from auth.uid(); RLS keeps each family private.

create table if not exists public.phet_activity_log (
  id                 uuid primary key default gen_random_uuid(),
  owner              uuid not null references auth.users(id) on delete cascade,
  profile_id         uuid not null references public.profiles(id) on delete cascade,
  sim_slug           text not null,
  subject            text,
  topics             text[] default '{}',
  prediction_answer  text,
  reflection_answer  text,
  completed          boolean default false,
  created_at         timestamptz not null default now()
);

create index if not exists phet_activity_profile_idx
  on public.phet_activity_log (profile_id, created_at desc);

alter table public.phet_activity_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'phet_activity_log' and policyname = 'own phet activity'
  ) then
    create policy "own phet activity" on public.phet_activity_log
      for all using (auth.uid() = owner) with check (auth.uid() = owner);
  end if;
end $$;

drop trigger if exists phet_activity_set_owner on public.phet_activity_log;
create trigger phet_activity_set_owner before insert on public.phet_activity_log
  for each row execute function public.set_owner();

-- 4) More parent controls (timer, voice, fun) -----------------------------
-- All optional with sensible defaults; the app works without them.
alter table public.account_settings add column if not exists question_seconds integer default 60;
alter table public.account_settings add column if not exists allow_overtime boolean default true;
alter table public.account_settings add column if not exists tts_voice text default 'coral';
alter table public.account_settings add column if not exists fun_mode boolean default true;

-- 5) Weekly spelling/dictation --------------------------------------------
alter table public.account_settings add column if not exists spelling_words text[] default '{}';
alter table public.account_settings add column if not exists dictation_pause integer default 4;
alter table public.account_settings add column if not exists dictation_confirm boolean default false;
alter table public.account_settings add column if not exists dictation_length text default 'short';
alter table public.account_settings add column if not exists dictation_difficulty text default 'easy';

create table if not exists public.dictation_log (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null references auth.users(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  score       integer default 0,
  total       integer default 0,
  words       text[] default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists dictation_profile_idx on public.dictation_log (profile_id, created_at desc);
alter table public.dictation_log enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='dictation_log' and policyname='own dictation') then
    create policy "own dictation" on public.dictation_log for all using (auth.uid() = owner) with check (auth.uid() = owner);
  end if;
end $$;
drop trigger if exists dictation_set_owner on public.dictation_log;
create trigger dictation_set_owner before insert on public.dictation_log
  for each row execute function public.set_owner();
