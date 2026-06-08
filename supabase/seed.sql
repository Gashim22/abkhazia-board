-- ============================================================
-- ABKHAZIA BOARD — Seed Data
-- Запускать после 0001_initial_schema.sql
-- ============================================================


-- ============================================================
-- CITIES
-- Очищаем старые данные и вставляем актуальные города
-- ============================================================

truncate table public.cities restart identity cascade;

insert into public.cities (name, slug) values
  ('Сухум',      'sukhum'),
  ('Гагра',      'gagra'),
  ('Гудаута',    'gudauta'),
  ('Очамчыра',   'ochamchyra'),
  ('Ткварчели',  'tkvarcheli'),
  ('Гал',        'gal'),
  ('Новый Афон', 'novy-afon'),
  ('Пицунда',    'pitsunda');


-- ============================================================
-- CATEGORIES
-- Сначала удаляем подкатегории (из-за parent_id), потом корни
-- ============================================================

truncate table public.categories restart identity cascade;

insert into public.categories (name, slug, icon, parent_id, sort_order) values
  ('Авто',            'avto',        '🚗', null, 10),
  ('Недвижимость',    'nedvizhimost','🏠', null, 20),
  ('Работа',          'rabota',      '💼', null, 30),
  ('Услуги',          'uslugi',      '🔧', null, 40),
  ('Электроника',     'elektronika', '📱', null, 50),
  ('Одежда',          'odezhda',     '👕', null, 60),
  ('Животные',        'zhivotnye',   '🐾', null, 70),
  ('Мебель',          'mebel',       '🪑', null, 80),
  ('Стройматериалы',  'stroy',       '🧱', null, 90),
  ('Разное',          'raznoe',      '📦', null, 100);
