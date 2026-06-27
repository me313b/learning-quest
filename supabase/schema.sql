-- Learning Quest database schema for Supabase (Postgres).
-- Run this in the Supabase SQL editor (or via the CLI) once per project.
-- It is safe to re-run: everything uses IF NOT EXISTS / drop-and-recreate.

create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------- --
-- Tables
-- --------------------------------------------------------------------------- --

-- One row per child, owned by a parent account (auth.users).
create table if not exists public.profiles (
  id               uuid primary key default gen_random_uuid(),
  owner            uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  age              int,
  year             text,
  interests        text[] default '{}',
  avatar           text default 'steve',
  strengths        jsonb default '{}'::jsonb,
  ability          jsonb default '{}'::jsonb,
  enabled_subjects text[] default '{}',
  created_at       timestamptz default now(),
  last_active      timestamptz default now()
);

-- One row per parent account: the family's API key (encrypted), approved
-- videos and the parent PIN. Shared by all of that parent's children.
create table if not exists public.account_settings (
  owner             uuid primary key references auth.users(id) on delete cascade,
  api_provider      text default 'anthropic',
  api_key_encrypted text default '',
  api_model         text default '',
  parent_pin        text default '',
  video_urls        text[] default '{}',
  playlist_id       text default '',
  updated_at        timestamptz default now()
);

-- One row per child per day.
create table if not exists public.sessions (
  id             uuid primary key default gen_random_uuid(),
  owner          uuid not null references auth.users(id) on delete cascade,
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  day            date not null,
  subjects       text[] default '{}',
  earned_minutes numeric default 0,
  minutes_used   numeric default 0,
  completed      boolean default false,
  created_at     timestamptz default now(),
  unique (profile_id, day)
);

-- One row per question answered.
create table if not exists public.attempts (
  id             uuid primary key default gen_random_uuid(),
  owner          uuid not null references auth.users(id) on delete cascade,
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  session_id     uuid references public.sessions(id) on delete set null,
  subject        text,
  topic          text,
  skill          text,
  difficulty     int,
  qtype          text,
  prompt         text,
  correct_answer text,
  user_answer    text,
  verdict        text,           -- correct | partial | incorrect | timeout
  time_taken     numeric,
  resolved       boolean default false,
  created_at     timestamptz default now()
);

create index if not exists attempts_profile_idx on public.attempts(profile_id, created_at);
create index if not exists attempts_skill_idx on public.attempts(profile_id, subject, skill);

-- --------------------------------------------------------------------------- --
-- Owner stamping: set owner = auth.uid() automatically on insert.
-- (Runs before RLS WITH CHECK, so the client never has to send owner.)
-- --------------------------------------------------------------------------- --
create or replace function public.set_owner()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.owner is null then
    new.owner := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_owner on public.profiles;
create trigger profiles_set_owner before insert on public.profiles
  for each row execute function public.set_owner();

drop trigger if exists sessions_set_owner on public.sessions;
create trigger sessions_set_owner before insert on public.sessions
  for each row execute function public.set_owner();

drop trigger if exists attempts_set_owner on public.attempts;
create trigger attempts_set_owner before insert on public.attempts
  for each row execute function public.set_owner();

-- --------------------------------------------------------------------------- --
-- Row-level security: a parent can only see and touch their own rows.
-- --------------------------------------------------------------------------- --
alter table public.profiles         enable row level security;
alter table public.account_settings enable row level security;
alter table public.sessions         enable row level security;
alter table public.attempts         enable row level security;

drop policy if exists "own profiles" on public.profiles;
create policy "own profiles" on public.profiles
  for all using (auth.uid() = owner) with check (auth.uid() = owner);

drop policy if exists "own settings" on public.account_settings;
create policy "own settings" on public.account_settings
  for all using (auth.uid() = owner) with check (auth.uid() = owner);

drop policy if exists "own sessions" on public.sessions;
create policy "own sessions" on public.sessions
  for all using (auth.uid() = owner) with check (auth.uid() = owner);

drop policy if exists "own attempts" on public.attempts;
create policy "own attempts" on public.attempts
  for all using (auth.uid() = owner) with check (auth.uid() = owner);

-- --------------------------------------------------------------------------- --
-- Storage: a private bucket for uploaded art photos.
-- --------------------------------------------------------------------------- --
insert into storage.buckets (id, name, public)
  values ('art', 'art', false)
  on conflict (id) do nothing;

drop policy if exists "own art read" on storage.objects;
create policy "own art read" on storage.objects
  for select using (bucket_id = 'art' and owner = auth.uid());

drop policy if exists "own art write" on storage.objects;
create policy "own art write" on storage.objects
  for insert with check (bucket_id = 'art' and owner = auth.uid());

drop policy if exists "own art delete" on storage.objects;
create policy "own art delete" on storage.objects
  for delete using (bucket_id = 'art' and owner = auth.uid());

-- --------------------------------------------------------------------------- --
-- Optional: cache for generated speech (so the same phrase isn't re-generated
-- and re-charged every time). The app works without this table — it simply
-- generates each time — so running this block is an optimisation, not required.
-- --------------------------------------------------------------------------- --
create table if not exists public.audio_cache (
  owner      uuid not null references auth.users(id) on delete cascade,
  text_hash  text not null,
  text       text,
  voice      text,
  speed      text,
  provider   text,
  audio_b64  text not null,
  created_at timestamptz default now(),
  primary key (owner, text_hash)
);

alter table public.audio_cache enable row level security;

drop policy if exists "own audio" on public.audio_cache;
create policy "own audio" on public.audio_cache
  for all using (auth.uid() = owner) with check (auth.uid() = owner);

drop trigger if exists audio_cache_set_owner on public.audio_cache;
create trigger audio_cache_set_owner before insert on public.audio_cache
  for each row execute function public.set_owner();

-- --------------------------------------------------------------------------- --
-- Optional: let parents tune the video-time economy. Without these columns the
-- app uses the built-in defaults (30 min/day, 1 min per correct), so this block
-- is only needed to use the in-app controls. Safe to run any time.
-- --------------------------------------------------------------------------- --
alter table public.account_settings
  add column if not exists reward_daily_cap_min  numeric default 30;
alter table public.account_settings
  add column if not exists reward_per_correct_min numeric default 1;

-- Lets a parent grant extra minutes for a single day.
alter table public.sessions
  add column if not exists bonus_minutes numeric default 0;
