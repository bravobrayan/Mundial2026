-- ============================================================
--  Quiniela Mundial 2026 — Esquema inicial
--  Ejecutar en Supabase → SQL Editor (una sola vez).
-- ============================================================

-- ---------- Tablas de referencia ----------

create table if not exists public.teams (
  id   int  primary key,            -- 1..48
  name text not null,
  grp  char(1) not null,            -- A..L
  flag text                         -- emoji de bandera
);

create table if not exists public.matches (
  id           int primary key,     -- 1..104 (IdPart del Excel)
  stage        text not null check (stage in ('group','r32','r16','qf','sf','third','final')),
  grp          char(1),             -- A..L (solo fase de grupos)
  matchday     int,                 -- 1..3 (jornada de grupos)
  kickoff      timestamptz not null,
  stadium      text,
  city         text,
  country      text,
  home_team_id int references public.teams(id),  -- null en eliminatorias
  away_team_id int references public.teams(id),
  label        text                 -- ej. "Dieciseisavos 1"
);

create table if not exists public.settings (
  key   text primary key,
  value text
);

-- ---------- Datos de usuario ----------

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at   timestamptz not null default now()
);

-- Resultados reales (los carga el admin)
create table if not exists public.results (
  match_id        int primary key references public.matches(id) on delete cascade,
  home_goals      int not null check (home_goals >= 0),
  away_goals      int not null check (away_goals >= 0),
  home_team_id    int references public.teams(id),  -- equipos reales (eliminatorias)
  away_team_id    int references public.teams(id),
  advance_team_id int references public.teams(id),  -- quién avanzó (penales)
  updated_at      timestamptz not null default now()
);

-- Pronósticos: una fila por usuario y partido
create table if not exists public.predictions (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  match_id        int  not null references public.matches(id) on delete cascade,
  home_goals      int check (home_goals >= 0),
  away_goals      int check (away_goals >= 0),
  advance_team_id int references public.teams(id),  -- desempate en mata-mata
  updated_at      timestamptz not null default now(),
  unique (user_id, match_id)
);

-- Orden manual de cada grupo por usuario (resuelve empates de puntos) -> posición 1..4
create table if not exists public.group_positions (
  user_id  uuid not null references auth.users(id) on delete cascade,
  grp      char(1) not null,
  team_id  int not null references public.teams(id),
  position int not null check (position between 1 and 4),
  primary key (user_id, grp, team_id),
  unique (user_id, grp, position)
);

create index if not exists predictions_user_idx on public.predictions(user_id);
create index if not exists predictions_match_idx on public.predictions(match_id);

-- ---------- Crear perfil automáticamente al registrarse ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  Row Level Security
-- ============================================================

alter table public.teams           enable row level security;
alter table public.matches         enable row level security;
alter table public.settings        enable row level security;
alter table public.results         enable row level security;
alter table public.profiles        enable row level security;
alter table public.predictions     enable row level security;
alter table public.group_positions enable row level security;

-- Lectura pública de datos de referencia
drop policy if exists "read teams"    on public.teams;
drop policy if exists "read matches"  on public.matches;
drop policy if exists "read settings" on public.settings;
drop policy if exists "read results"  on public.results;
create policy "read teams"    on public.teams    for select using (true);
create policy "read matches"  on public.matches  for select using (true);
create policy "read settings" on public.settings for select using (true);
create policy "read results"  on public.results  for select using (true);

-- Perfiles: todos leen (para el ranking), cada quien edita el suyo
drop policy if exists "read profiles"   on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;
create policy "read profiles"       on public.profiles for select using (true);
create policy "insert own profile"  on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile"  on public.profiles for update using (auth.uid() = id);

-- Pronósticos: SOLO los propios (nadie ve los de otros)
drop policy if exists "own predictions select" on public.predictions;
drop policy if exists "own predictions insert" on public.predictions;
drop policy if exists "own predictions update" on public.predictions;
drop policy if exists "own predictions delete" on public.predictions;
create policy "own predictions select" on public.predictions for select using (auth.uid() = user_id);
create policy "own predictions insert" on public.predictions for insert with check (auth.uid() = user_id);
create policy "own predictions update" on public.predictions for update using (auth.uid() = user_id);
create policy "own predictions delete" on public.predictions for delete using (auth.uid() = user_id);

-- Orden de grupos: SOLO el propio
drop policy if exists "own positions select" on public.group_positions;
drop policy if exists "own positions insert" on public.group_positions;
drop policy if exists "own positions update" on public.group_positions;
drop policy if exists "own positions delete" on public.group_positions;
create policy "own positions select" on public.group_positions for select using (auth.uid() = user_id);
create policy "own positions insert" on public.group_positions for insert with check (auth.uid() = user_id);
create policy "own positions update" on public.group_positions for update using (auth.uid() = user_id);
create policy "own positions delete" on public.group_positions for delete using (auth.uid() = user_id);

-- Nota: teams/matches/results/settings NO tienen política de escritura,
-- así que solo se pueden modificar con la llave service_role (panel admin).

-- ---------- Configuración inicial ----------
insert into public.settings (key, value) values
  ('app_name', 'Quiniela Mundial 2026'),
  ('lock_at',  '2026-06-11T19:00:00Z')   -- cierre: 1er partido (11-jun 15:00 UTC-4)
on conflict (key) do nothing;
