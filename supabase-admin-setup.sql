-- ============================================
-- 管理者機能のセットアップ用SQL
-- ============================================

-- 管理者テーブルの作成
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS（Row Level Security）を有効化
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 管理者は全員のデータを閲覧可能
-- 注意: このポリシーは管理者テーブル自体へのアクセスを制御します
CREATE POLICY "Admins can view all admins"
  ON admins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- 管理者の追加（既存のユーザーを管理者にする場合）
-- 使用方法: 以下のコマンドで、特定のユーザーIDを管理者に追加できます
-- INSERT INTO admins (user_id) VALUES ('ユーザーのUUID');

-- インデックスの作成
CREATE INDEX IF NOT EXISTS admins_user_id_idx ON admins(user_id);

-- 管理者かどうかを確認する関数
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 全ユーザーの日報を閲覧するためのビュー（管理者用）
CREATE OR REPLACE VIEW admin_daily_reports AS
SELECT 
  dr.*,
  u.email as user_email
FROM daily_reports dr
JOIN auth.users u ON dr.user_id = u.id;

-- 全ユーザーのToDoを閲覧するためのビュー（管理者用）
CREATE OR REPLACE VIEW admin_todos AS
SELECT 
  t.*,
  u.email as user_email
FROM todos t
JOIN auth.users u ON t.user_id = u.id;

