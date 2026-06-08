-- ============================================================
-- Supabase Storage: bucket для фотографий объявлений
-- Запустить в Supabase SQL Editor
-- ============================================================

-- Создаём публичный bucket
insert into storage.buckets (id, name, public)
values ('listings', 'listings', true)
on conflict (id) do nothing;

-- Авторизованные пользователи могут загружать файлы в свою папку
create policy "listings_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Читать могут все (bucket публичный)
create policy "listings_read"
  on storage.objects for select
  using (bucket_id = 'listings');

-- Удалять может только владелец папки
create policy "listings_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
