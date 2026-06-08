-- ============================================================
-- Исправление: RLS политики для listings + триггер профилей
-- Запустить в Supabase SQL Editor
-- ============================================================

-- 1. RLS политика INSERT для listings
-- (позволяет авторизованным пользователям создавать объявления)
DROP POLICY IF EXISTS "Users can create listings" ON listings;
CREATE POLICY "Users can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. RLS политика UPDATE для listings
-- (позволяет редактировать только свои объявления)
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. RLS политика DELETE для listings
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;
CREATE POLICY "Users can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Обновлённый триггер создания профиля при регистрации
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- 5. Создать профили для уже существующих пользователей
INSERT INTO public.profiles (id, name)
SELECT
  id,
  split_part(email, '@', 1) AS name
FROM auth.users
ON CONFLICT (id) DO NOTHING;
