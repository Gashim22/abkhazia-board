-- ============================================================
-- ABKHAZIA BOARD — Row Level Security Policies
-- Запускать после 0001_initial_schema.sql
-- ============================================================


-- ============================================================
-- Включаем RLS на всех таблицах
-- (если уже включён — команда ничего не сломает)
-- ============================================================

alter table public.profiles        enable row level security;
alter table public.cities          enable row level security;
alter table public.categories      enable row level security;
alter table public.listings        enable row level security;
alter table public.listing_reports enable row level security;


-- ============================================================
-- Удаляем старые политики перед созданием новых
-- (чтобы не было дублей при повторном запуске)
-- ============================================================

drop policy if exists "profiles_public_read"    on public.profiles;
drop policy if exists "profiles_owner_update"   on public.profiles;

drop policy if exists "cities_public_read"      on public.cities;
drop policy if exists "categories_public_read"  on public.categories;

drop policy if exists "listings_public_read"    on public.listings;
drop policy if exists "listings_owner_insert"   on public.listings;
drop policy if exists "listings_owner_update"   on public.listings;
drop policy if exists "listings_owner_delete"   on public.listings;

drop policy if exists "reports_auth_insert"     on public.listing_reports;
drop policy if exists "reports_owner_read"      on public.listing_reports;


-- ============================================================
-- PROFILES
-- ============================================================

-- Любой (в том числе анонимный) может читать профили
create policy "profiles_public_read"
  on public.profiles
  for select
  using (true);

-- Обновлять профиль может только его владелец
create policy "profiles_owner_update"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ============================================================
-- CITIES — только чтение для всех
-- ============================================================

create policy "cities_public_read"
  on public.cities
  for select
  using (true);


-- ============================================================
-- CATEGORIES — только чтение для всех
-- ============================================================

create policy "categories_public_read"
  on public.categories
  for select
  using (true);


-- ============================================================
-- LISTINGS
-- ============================================================

-- Читать активные объявления может любой.
-- Свои объявления (любого статуса) видит только владелец.
create policy "listings_public_read"
  on public.listings
  for select
  using (
    status = 'active'
    or
    auth.uid() = user_id
  );

-- Создавать объявления могут только авторизованные пользователи.
-- user_id при вставке должен совпадать с текущим пользователем.
create policy "listings_auth_insert"
  on public.listings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Редактировать может только владелец
create policy "listings_owner_update"
  on public.listings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Удалять может только владелец
create policy "listings_owner_delete"
  on public.listings
  for delete
  using (auth.uid() = user_id);


-- ============================================================
-- LISTING REPORTS
-- ============================================================

-- Жаловаться могут только авторизованные пользователи.
-- В жалобе user_id должен совпадать с текущим пользователем.
create policy "reports_auth_insert"
  on public.listing_reports
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Свои жалобы видит только тот, кто их оставил
create policy "reports_owner_read"
  on public.listing_reports
  for select
  using (auth.uid() = user_id);
