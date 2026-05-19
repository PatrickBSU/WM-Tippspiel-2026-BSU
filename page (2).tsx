-- ============================================
-- WM Tippspiel 2026 - Supabase Schema
-- Einfügen in Supabase SQL Editor und ausführen
-- ============================================

-- PROFILES: Nutzerdaten (1:1 mit auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- MATCHES: Alle 104 Spiele der WM 2026
create table public.matches (
  id integer primary key,                    -- football-data.org Match-ID oder fortlaufend
  stage text not null,                       -- GROUP_A..L, ROUND_OF_32, ROUND_OF_16, QUARTER_FINAL, SEMI_FINAL, THIRD_PLACE_FINAL, FINAL
  group_code text,                           -- A..L (null bei K.O.)
  matchday integer,                          -- 1..3 Gruppenphase
  kickoff timestamptz not null,
  home_team text not null,
  away_team text not null,
  home_score integer,                        -- null = noch nicht gespielt
  away_score integer,
  status text not null default 'SCHEDULED',  -- SCHEDULED, IN_PLAY, FINISHED
  updated_at timestamptz not null default now()
);

-- BETS: Tipps der Nutzer pro Spiel
create table public.bets (
  user_id uuid references public.profiles(id) on delete cascade,
  match_id integer references public.matches(id) on delete cascade,
  home_score integer not null check (home_score >= 0 and home_score <= 20),
  away_score integer not null check (away_score >= 0 and away_score <= 20),
  points integer,                            -- wird bei Spielende berechnet
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

-- SPECIAL_BETS: Sonderwetten (Weltmeister, Torschütze, Gruppensieger)
create table public.special_bets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  champion text,                             -- Weltmeister
  top_scorer text,                           -- Torschützenkönig
  group_winners jsonb not null default '{}'::jsonb,  -- {"A":"Mexico","B":"Canada",...}
  champion_points integer,
  top_scorer_points integer,
  group_winners_points integer,
  updated_at timestamptz not null default now()
);

-- SPECIAL_RESULTS: Endgültige Ergebnisse für Sonderwetten (vom Admin gepflegt)
create table public.special_results (
  id integer primary key default 1 check (id = 1),  -- nur eine Zeile
  champion text,
  top_scorer text,
  group_winners jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.special_results (id) values (1) on conflict do nothing;

-- Indizes
create index bets_match_idx on public.bets(match_id);
create index matches_kickoff_idx on public.matches(kickoff);
create index matches_status_idx on public.matches(status);

-- ============================================
-- Row Level Security
-- ============================================
alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.bets enable row level security;
alter table public.special_bets enable row level security;
alter table public.special_results enable row level security;

-- Profile: jeder darf alle sehen (für Rangliste), nur sich selbst editieren
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_self" on public.profiles for insert with check (auth.uid() = id);

-- Matches: alle lesen, nur Admin schreiben (via service role)
create policy "matches_select_all" on public.matches for select using (true);

-- Bets: nach Anpfiff für alle sichtbar, vorher nur eigene
create policy "bets_select_own_or_after_kickoff" on public.bets
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.matches m where m.id = match_id and m.kickoff <= now())
  );
create policy "bets_insert_own_before_kickoff" on public.bets
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.matches m where m.id = match_id and m.kickoff > now())
  );
create policy "bets_update_own_before_kickoff" on public.bets
  for update using (
    auth.uid() = user_id
    and exists (select 1 from public.matches m where m.id = match_id and m.kickoff > now())
  );

-- Special bets: vor Turnierbeginn editierbar, danach für alle lesbar
create policy "special_bets_select_all" on public.special_bets for select using (true);
create policy "special_bets_upsert_self" on public.special_bets
  for insert with check (auth.uid() = user_id and now() < '2026-06-11T20:00:00+02:00');
create policy "special_bets_update_self" on public.special_bets
  for update using (auth.uid() = user_id and now() < '2026-06-11T20:00:00+02:00');

-- Special results: alle lesen
create policy "special_results_select_all" on public.special_results for select using (true);

-- ============================================
-- Trigger: Profile bei Signup automatisch anlegen
-- ============================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- View: Rangliste
-- ============================================
create or replace view public.leaderboard as
select
  p.id,
  p.display_name,
  coalesce((select sum(points) from public.bets where user_id = p.id), 0) as match_points,
  coalesce((select champion_points from public.special_bets where user_id = p.id), 0) as champion_points,
  coalesce((select top_scorer_points from public.special_bets where user_id = p.id), 0) as top_scorer_points,
  coalesce((select group_winners_points from public.special_bets where user_id = p.id), 0) as group_winners_points,
  (coalesce((select sum(points) from public.bets where user_id = p.id), 0)
    + coalesce((select champion_points from public.special_bets where user_id = p.id), 0)
    + coalesce((select top_scorer_points from public.special_bets where user_id = p.id), 0)
    + coalesce((select group_winners_points from public.special_bets where user_id = p.id), 0)
  ) as total_points,
  (select count(*) from public.bets b join public.matches m on m.id = b.match_id where b.user_id = p.id and m.status = 'FINISHED' and b.points >= 3) as exact_hits,
  (select count(*) from public.bets b join public.matches m on m.id = b.match_id where b.user_id = p.id and m.status = 'FINISHED' and b.points >= 1) as tendency_hits
from public.profiles p;
