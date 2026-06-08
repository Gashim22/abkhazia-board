-- ============================================================
-- Функции для инкремента счётчиков просмотров
-- SECURITY DEFINER позволяет обходить RLS (только для счётчиков)
-- Запустить в Supabase SQL Editor
-- ============================================================

create or replace function increment_listing_views(listing_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.listings
  set views_count = views_count + 1
  where id = listing_id;
$$;

create or replace function increment_phone_views(listing_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.listings
  set phone_views_count = phone_views_count + 1
  where id = listing_id;
$$;
