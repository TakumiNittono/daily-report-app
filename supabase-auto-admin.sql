-- ============================================
-- 特定のメールアドレスを自動的に管理者にする設定
-- ============================================

-- 管理者メールアドレスの設定テーブル（オプション）
CREATE TABLE IF NOT EXISTS admin_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 管理者メールアドレスを追加
-- ここに管理者にしたいメールアドレスを追加してください
INSERT INTO admin_emails (email) 
VALUES ('nittonotakumi@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 既存のユーザーを管理者にする関数
CREATE OR REPLACE FUNCTION auto_make_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- 管理者メールアドレスリストに含まれているかチェック
  IF EXISTS (
    SELECT 1 FROM admin_emails 
    WHERE email = NEW.email
  ) THEN
    -- 管理者テーブルに追加（既に存在する場合は何もしない）
    INSERT INTO admins (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザー作成時に自動的に管理者にするトリガー
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_make_admin();

-- 既存のユーザーも管理者にする（一度だけ実行）
-- このメールアドレスの既存ユーザーを管理者にする
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, email FROM auth.users 
    WHERE email = 'nittonotakumi@gmail.com'
  LOOP
    INSERT INTO admins (user_id)
    VALUES (user_record.id)
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;

-- メールアドレスが更新された場合も管理者にする関数
CREATE OR REPLACE FUNCTION check_admin_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- メールアドレスが変更された場合、管理者メールアドレスリストに含まれているかチェック
  IF NEW.email IS DISTINCT FROM OLD.email AND EXISTS (
    SELECT 1 FROM admin_emails 
    WHERE email = NEW.email
  ) THEN
    -- 管理者テーブルに追加
    INSERT INTO admins (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザー更新時に管理者をチェックするトリガー
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION check_admin_on_update();

