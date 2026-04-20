-- ============================================================
-- KARAOKU DATABASE SCHEMA
-- Run this in Supabase SQL Editor after creating the project
-- ============================================================

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  name text,
  plan text default 'free' check (plan in ('free','day','month','year')),
  plan_upgraded_at timestamptz,
  plan_expires_at timestamptz,
  language text default 'en' check (language in ('en','bm')),
  created_at timestamptz default now()
);

-- PARTIES
create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.profiles(id) on delete cascade not null,
  code text unique not null,
  name text not null,
  party_type text default 'other',
  is_active boolean default true,
  current_song_id text,
  current_song_title text,
  current_song_artist text,
  current_song_thumb text,
  current_song_started_at timestamptz,
  is_playing boolean default true,
  created_at timestamptz default now(),
  ended_at timestamptz
);
create index if not exists parties_code_idx on public.parties(code);
create index if not exists parties_host_id_idx on public.parties(host_id);

-- QUEUE
create table if not exists public.queue_items (
  id uuid primary key default gen_random_uuid(),
  party_id uuid references public.parties(id) on delete cascade not null,
  video_id text not null,
  title text not null,
  artist text,
  duration text,
  thumb_url text,
  added_by_name text,
  added_by_id uuid,
  position integer not null default 0,
  vote_count integer default 0,
  played boolean default false,
  added_at timestamptz default now()
);
create index if not exists queue_party_idx on public.queue_items(party_id, played, position);

-- VOTES
create table if not exists public.queue_votes (
  id uuid primary key default gen_random_uuid(),
  queue_item_id uuid references public.queue_items(id) on delete cascade not null,
  voter_fingerprint text not null,
  created_at timestamptz default now(),
  unique(queue_item_id, voter_fingerprint)
);

-- GUESTS
create table if not exists public.party_guests (
  id uuid primary key default gen_random_uuid(),
  party_id uuid references public.parties(id) on delete cascade not null,
  name text not null,
  fingerprint text not null,
  joined_at timestamptz default now(),
  unique(party_id, fingerprint)
);

-- PLAY HISTORY
create table if not exists public.play_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  party_id uuid references public.parties(id) on delete set null,
  video_id text not null,
  title text not null,
  artist text,
  thumb_url text,
  played_at timestamptz default now()
);
create index if not exists play_history_user_idx on public.play_history(user_id, played_at desc);

-- FAVORITES
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_id text not null,
  title text not null,
  artist text,
  thumb_url text,
  added_at timestamptz default now(),
  unique(user_id, video_id)
);

-- MIC USAGE
create table if not exists public.mic_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  fingerprint text,
  party_id uuid references public.parties(id) on delete cascade,
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- PROMO CODES (same pattern as Memoir)
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_percent integer not null check (discount_percent between 1 and 100),
  max_uses integer default 100,
  used_count integer default 0,
  expires_at timestamptz,
  is_active boolean default true,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.promo_uses (
  id uuid primary key default gen_random_uuid(),
  promo_id uuid references public.promo_codes(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  used_at timestamptz default now()
);

-- AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.parties enable row level security;
alter table public.queue_items enable row level security;
alter table public.queue_votes enable row level security;
alter table public.party_guests enable row level security;
alter table public.play_history enable row level security;
alter table public.favorites enable row level security;
alter table public.mic_usage enable row level security;
alter table public.promo_codes enable row level security;
alter table public.promo_uses enable row level security;

-- Profiles: read/update own
create policy "Own profile read" on public.profiles for select using (auth.uid() = id);
create policy "Own profile update" on public.profiles for update using (auth.uid() = id);

-- Parties: host full control, guests read active parties by code
create policy "Host parties read" on public.parties for select using (auth.uid() = host_id);
create policy "Host parties write" on public.parties for all using (auth.uid() = host_id);
create policy "Public active party" on public.parties for select using (is_active = true);

-- Queue: anyone can read, anyone in a guest party can add
create policy "Queue public read" on public.queue_items for select using (true);
create policy "Queue public add" on public.queue_items for insert with check (true);
create policy "Queue host manage" on public.queue_items for all using (
  party_id in (select id from public.parties where host_id = auth.uid())
);

-- Votes: public
create policy "Votes public" on public.queue_votes for all using (true) with check (true);

-- Guests: public read/insert
create policy "Guests public" on public.party_guests for all using (true) with check (true);

-- Play history: own only
create policy "Own history" on public.play_history for select using (auth.uid() = user_id);

-- Favorites: own only
create policy "Own favorites" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Mic usage: own + public insert
create policy "Mic own read" on public.mic_usage for select using (auth.uid() = user_id);
create policy "Mic public write" on public.mic_usage for insert with check (true);

-- Promo codes: public read active, admin write (we check admin in app code)
create policy "Promo public read" on public.promo_codes for select using (is_active = true);
create policy "Promo uses own" on public.promo_uses for select using (auth.uid() = user_id);

-- ============================================================
-- REALTIME (for live queue sync across devices)
-- ============================================================
alter publication supabase_realtime add table public.parties;
alter publication supabase_realtime add table public.queue_items;
alter publication supabase_realtime add table public.queue_votes;
alter publication supabase_realtime add table public.party_guests;
