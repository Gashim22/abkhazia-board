-- ============================================================
-- ABKHAZIA BOARD — Initial Schema
-- ============================================================


-- ============================================================
-- 1. PROFILES
-- Расширяет auth.users от Supabase Auth.
-- Создаётся автоматически при регистрации через триггер ниже.
-- ============================================================

create table if not exists public.profiles (
  id         uuid        primary key references auth.users (id) on delete cascade,
  phone      text        unique,
  name       text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Автоматически создаём профиль при регистрации нового пользователя
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- 2. CITIES
-- Города и населённые пункты Абхазии.
-- ============================================================

create table if not exists public.cities (
  id   serial primary key,
  name text   not null,
  slug text   not null unique
);

insert into public.cities (name, slug) values
  ('Сухум',       'sukhum'),
  ('Гагра',       'gagra'),
  ('Гудаута',     'gudauta'),
  ('Новый Афон',  'novy-afon'),
  ('Очамчыра',    'ochamchyra'),
  ('Ткуарчал',    'tkuarchal'),
  ('Гал',         'gal'),
  ('Пицунда',     'pitsunda'),
  ('Гульрипш',    'gulripsh'),
  ('Сухумский р.','sukhum-rayon')
on conflict (slug) do nothing;


-- ============================================================
-- 3. CATEGORIES
-- Поддерживает вложенность через parent_id (одноуровневая).
-- ============================================================

create table if not exists public.categories (
  id         serial  primary key,
  name       text    not null,
  slug       text    not null unique,
  icon       text,
  parent_id  int     references public.categories (id) on delete set null,
  sort_order int     not null default 0
);

-- Корневые категории
insert into public.categories (name, slug, icon, sort_order) values
  ('Недвижимость',       'real-estate',    '🏠', 10),
  ('Транспорт',          'transport',      '🚗', 20),
  ('Работа',             'jobs',           '💼', 30),
  ('Электроника',        'electronics',    '📱', 40),
  ('Дом и сад',          'home-garden',    '🛋️', 50),
  ('Одежда и обувь',     'clothing',       '👗', 60),
  ('Услуги',             'services',       '🔧', 70),
  ('Животные',           'animals',        '🐾', 80),
  ('Бизнес',             'business',       '📊', 90),
  ('Другое',             'other',          '📦', 100)
on conflict (slug) do nothing;

-- Подкатегории: Недвижимость
insert into public.categories (name, slug, icon, parent_id, sort_order)
select name, slug, icon,
       (select id from public.categories where slug = 'real-estate'),
       sort_order
from (values
  ('Квартиры продажа',   'apartments-sale',   null, 1),
  ('Квартиры аренда',    'apartments-rent',   null, 2),
  ('Дома и дачи',        'houses',            null, 3),
  ('Земельные участки',  'land',              null, 4),
  ('Коммерческая',       'commercial',        null, 5)
) as t(name, slug, icon, sort_order)
on conflict (slug) do nothing;

-- Подкатегории: Транспорт
insert into public.categories (name, slug, icon, parent_id, sort_order)
select name, slug, icon,
       (select id from public.categories where slug = 'transport'),
       sort_order
from (values
  ('Легковые автомобили','cars',              null, 1),
  ('Мотоциклы',          'motorcycles',       null, 2),
  ('Грузовики',          'trucks',            null, 3),
  ('Запчасти',           'auto-parts',        null, 4)
) as t(name, slug, icon, sort_order)
on conflict (slug) do nothing;

-- Подкатегории: Электроника
insert into public.categories (name, slug, icon, parent_id, sort_order)
select name, slug, icon,
       (select id from public.categories where slug = 'electronics'),
       sort_order
from (values
  ('Телефоны',           'phones',            null, 1),
  ('Ноутбуки и ПК',      'computers',         null, 2),
  ('Телевизоры',         'tvs',               null, 3),
  ('Фото и видео',       'photo-video',       null, 4)
) as t(name, slug, icon, sort_order)
on conflict (slug) do nothing;


-- ============================================================
-- 4. LISTINGS
-- Основная таблица объявлений.
-- ============================================================

create table if not exists public.listings (
  id                uuid          primary key default gen_random_uuid(),
  user_id           uuid          not null references public.profiles (id) on delete cascade,
  category_id       int           references public.categories (id) on delete set null,
  city_id           int           references public.cities (id) on delete set null,
  title             text          not null,
  description       text,
  price             decimal(12,2),
  photos            text[]        not null default '{}',
  status            text          not null default 'active'
                                  check (status in ('active', 'moderation', 'rejected', 'archived')),
  score             int           not null default 0,
  views_count       int           not null default 0,
  phone_views_count int           not null default 0,
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now()
);

-- Автоматически обновляем updated_at при изменении строки
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_listings_updated_at on public.listings;
create trigger set_listings_updated_at
  before update on public.listings
  for each row execute procedure public.set_updated_at();


-- ============================================================
-- 5. LISTING REPORTS
-- Жалобы пользователей на объявления.
-- ============================================================

create table if not exists public.listing_reports (
  id         serial      primary key,
  listing_id uuid        not null references public.listings (id) on delete cascade,
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  reason     text,
  created_at timestamptz not null default now(),

  -- один пользователь может пожаловаться на объявление только один раз
  unique (listing_id, user_id)
);


-- ============================================================
-- INDEXES — ускоряют частые запросы
-- ============================================================

create index if not exists idx_listings_user_id       on public.listings (user_id);
create index if not exists idx_listings_category_id   on public.listings (category_id);
create index if not exists idx_listings_city_id       on public.listings (city_id);
create index if not exists idx_listings_status        on public.listings (status);
create index if not exists idx_listings_created_at    on public.listings (created_at desc);
create index if not exists idx_listings_price         on public.listings (price);

create index if not exists idx_categories_parent_id   on public.categories (parent_id);
create index if not exists idx_categories_sort_order  on public.categories (sort_order);

create index if not exists idx_reports_listing_id     on public.listing_reports (listing_id);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Защита данных: каждый видит только то, что положено.
-- ============================================================

alter table public.profiles        enable row level security;
alter table public.cities          enable row level security;
alter table public.categories      enable row level security;
alter table public.listings        enable row level security;
alter table public.listing_reports enable row level security;

-- profiles: читать может любой, менять — только владелец
create policy "profiles_public_read"
  on public.profiles for select using (true);

create policy "profiles_owner_update"
  on public.profiles for update using (auth.uid() = id);

-- cities и categories: только чтение для всех
create policy "cities_public_read"
  on public.cities for select using (true);

create policy "categories_public_read"
  on public.categories for select using (true);

-- listings: активные видят все; остальное — только владелец
create policy "listings_public_read"
  on public.listings for select
  using (status = 'active' or auth.uid() = user_id);

create policy "listings_owner_insert"
  on public.listings for insert
  with check (auth.uid() = user_id);

create policy "listings_owner_update"
  on public.listings for update
  using (auth.uid() = user_id);

create policy "listings_owner_delete"
  on public.listings for delete
  using (auth.uid() = user_id);

-- listing_reports: создать может любой авторизованный, читать — только владелец жалобы
create policy "reports_auth_insert"
  on public.listing_reports for insert
  with check (auth.uid() = user_id);

create policy "reports_owner_read"
  on public.listing_reports for select
  using (auth.uid() = user_id);
