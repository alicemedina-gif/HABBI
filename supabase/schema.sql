-- ============================================================================
-- HABBI — Schema SQL + Row Level Security (RLS) para Supabase (PostgreSQL)
-- Branch: feat/supabase-integration
-- Executar no Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================================

-- Extensão para UUIDs (já habilitada por padrão no Supabase)
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. FUNÇÃO AUXILIAR: updated_at automático
-- ============================================================================
create or replace function public.habbi_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ============================================================================
-- 2. TABELA: profiles (1:1 com auth.users)
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  email text not null default '',
  avatar text not null default 'verde',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.habbi_set_updated_at();

-- ============================================================================
-- 3. TABELA: user_preferences (idioma, tema, onboarding, tutorial, flags)
-- ============================================================================
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  language text not null default 'PT' check (language in ('PT', 'EN', 'ES')),
  theme text not null default 'light' check (theme in ('light', 'dark')),
  onboarding_completed boolean not null default false,
  tutorial_completed boolean not null default false,
  has_configured_first_goal boolean not null default false,
  sacola_100_celebrated boolean not null default false,
  reminders_enabled boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_user_preferences_updated_at on public.user_preferences;
create trigger trg_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.habbi_set_updated_at();

-- ============================================================================
-- 4. TABELA: user_goals (meta diária, consumo habitual, preço maço, conquista)
-- ============================================================================
create table if not exists public.user_goals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  today_meta integer not null default 11 check (today_meta >= 0 and today_meta <= 100),
  habitual_cigs integer not null default 12 check (habitual_cigs >= 1 and habitual_cigs <= 100),
  habitual_cigs_customized boolean not null default false,
  pack_price numeric(10, 2) not null default 15.00 check (pack_price > 0 and pack_price <= 500),
  cigs_per_pack integer not null default 20 check (cigs_per_pack >= 1 and cigs_per_pack <= 60),
  pack_freq_days integer not null default 2 check (pack_freq_days >= 1 and pack_freq_days <= 60),
  savings_goal_title text not null default 'Minha conquista',
  savings_goal_target numeric(10, 2) not null default 250.00 check (savings_goal_target >= 1),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_user_goals_updated_at on public.user_goals;
create trigger trg_user_goals_updated_at
  before update on public.user_goals
  for each row execute function public.habbi_set_updated_at();

-- ============================================================================
-- 5. TABELA: daily_records (resumo diário por usuário e data YYYY-MM-DD)
-- ============================================================================
create table if not exists public.daily_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date_key date not null,
  meta integer not null default 11 check (meta >= 0),
  cigs_count integer not null default 0 check (cigs_count >= 0),
  urges_count integer not null default 0 check (urges_count >= 0),
  smoke_free boolean not null default false,
  day_completed boolean not null default false,
  latest_mood text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint uq_daily_records_user_date unique (user_id, date_key)
);

create index if not exists idx_daily_records_user_date
  on public.daily_records (user_id, date_key desc);

drop trigger if exists trg_daily_records_updated_at on public.daily_records;
create trigger trg_daily_records_updated_at
  before update on public.daily_records
  for each row execute function public.habbi_set_updated_at();

-- ============================================================================
-- 6. TABELA: habbi_events (eventos individuais: cigarro, humor, vontade, SOS)
-- client_event_id garante migração e sincronização offline idempotentes
-- ============================================================================
create table if not exists public.habbi_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_event_id text not null,
  date_key date not null,
  kind text not null check (kind in ('smoke', 'no-smoke', 'urge', 'sos', 'mood', 'day-complete')),
  event_type text not null default 'sucesso',
  title text not null default '',
  desc_text text not null default '',
  detail text not null default '',
  mood_value text,
  influences text[] not null default '{}',
  note text not null default '',
  clock_label text not null default '',
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint uq_habbi_events_user_client_id unique (user_id, client_event_id)
);

create index if not exists idx_habbi_events_user_date
  on public.habbi_events (user_id, date_key desc, occurred_at desc);

-- ============================================================================
-- 7. TABELA: pack_events (maços evitados/comprados — compatibilidade economia)
-- ============================================================================
create table if not exists public.pack_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_event_id text not null,
  date_key date not null,
  kind text not null check (kind in ('bought', 'avoided')),
  price numeric(10, 2) not null check (price >= 0),
  cigs_per_pack integer not null default 20 check (cigs_per_pack >= 1),
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint uq_pack_events_user_client_id unique (user_id, client_event_id)
);

create index if not exists idx_pack_events_user_date
  on public.pack_events (user_id, date_key desc);

-- ============================================================================
-- 8. TABELA: minigame_records (recordes dos 4 minijogos)
-- ============================================================================
create table if not exists public.minigame_records (
  user_id uuid not null references auth.users (id) on delete cascade,
  game_key text not null check (game_key in ('memory', 'sequence', 'math', 'reflex')),
  best_score integer not null default 0 check (best_score >= 0),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, game_key)
);

drop trigger if exists trg_minigame_records_updated_at on public.minigame_records;
create trigger trg_minigame_records_updated_at
  before update on public.minigame_records
  for each row execute function public.habbi_set_updated_at();

-- ============================================================================
-- 9. TRIGGER AUTOMÁTICO AO CRIAR USUÁRIO NO SUPABASE AUTH
-- Cria perfil, preferências e metas padrão automaticamente no signup
-- ============================================================================
create or replace function public.habbi_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    ''
  );

  insert into public.profiles (id, display_name, email, avatar)
  values (new.id, v_name, coalesce(new.email, ''), 'verde')
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_goals (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_habbi on auth.users;
create trigger on_auth_user_created_habbi
  after insert on auth.users
  for each row execute function public.habbi_handle_new_user();

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) — CADA USUÁRIO ACESSA SOMENTE SEUS PRÓPRIOS DADOS
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_goals enable row level security;
alter table public.daily_records enable row level security;
alter table public.habbi_events enable row level security;
alter table public.pack_events enable row level security;
alter table public.minigame_records enable row level security;

-- Revoga acesso anônimo direto nas tabelas (modo visitante permanece 100% local)
revoke all on public.profiles from anon;
revoke all on public.user_preferences from anon;
revoke all on public.user_goals from anon;
revoke all on public.daily_records from anon;
revoke all on public.habbi_events from anon;
revoke all on public.pack_events from anon;
revoke all on public.minigame_records from anon;

-- ---- Policies: profiles ----
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated
  using ((select auth.uid()) = id);

-- ---- Policies: user_preferences ----
drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own" on public.user_preferences
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own" on public.user_preferences
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own" on public.user_preferences
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_preferences_delete_own" on public.user_preferences;
create policy "user_preferences_delete_own" on public.user_preferences
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---- Policies: user_goals ----
drop policy if exists "user_goals_select_own" on public.user_goals;
create policy "user_goals_select_own" on public.user_goals
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_goals_insert_own" on public.user_goals;
create policy "user_goals_insert_own" on public.user_goals
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_goals_update_own" on public.user_goals;
create policy "user_goals_update_own" on public.user_goals
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_goals_delete_own" on public.user_goals;
create policy "user_goals_delete_own" on public.user_goals
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---- Policies: daily_records ----
drop policy if exists "daily_records_select_own" on public.daily_records;
create policy "daily_records_select_own" on public.daily_records
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "daily_records_insert_own" on public.daily_records;
create policy "daily_records_insert_own" on public.daily_records
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "daily_records_update_own" on public.daily_records;
create policy "daily_records_update_own" on public.daily_records
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "daily_records_delete_own" on public.daily_records;
create policy "daily_records_delete_own" on public.daily_records
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---- Policies: habbi_events ----
drop policy if exists "habbi_events_select_own" on public.habbi_events;
create policy "habbi_events_select_own" on public.habbi_events
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "habbi_events_insert_own" on public.habbi_events;
create policy "habbi_events_insert_own" on public.habbi_events
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "habbi_events_update_own" on public.habbi_events;
create policy "habbi_events_update_own" on public.habbi_events
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "habbi_events_delete_own" on public.habbi_events;
create policy "habbi_events_delete_own" on public.habbi_events
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---- Policies: pack_events ----
drop policy if exists "pack_events_select_own" on public.pack_events;
create policy "pack_events_select_own" on public.pack_events
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "pack_events_insert_own" on public.pack_events;
create policy "pack_events_insert_own" on public.pack_events
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "pack_events_update_own" on public.pack_events;
create policy "pack_events_update_own" on public.pack_events
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "pack_events_delete_own" on public.pack_events;
create policy "pack_events_delete_own" on public.pack_events
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---- Policies: minigame_records ----
drop policy if exists "minigame_records_select_own" on public.minigame_records;
create policy "minigame_records_select_own" on public.minigame_records
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "minigame_records_insert_own" on public.minigame_records;
create policy "minigame_records_insert_own" on public.minigame_records
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "minigame_records_update_own" on public.minigame_records;
create policy "minigame_records_update_own" on public.minigame_records
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "minigame_records_delete_own" on public.minigame_records;
create policy "minigame_records_delete_own" on public.minigame_records
  for delete to authenticated
  using ((select auth.uid()) = user_id);
