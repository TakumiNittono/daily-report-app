-- ============================================
-- RLSポリシーの無限再帰エラーを修正するSQL
-- ============================================

-- 1. 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Users and admins can view daily reports" ON daily_reports;
DROP POLICY IF EXISTS "Users and admins can view todos" ON todos;
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;

-- 2. adminsテーブルのRLSを無効化（管理者テーブルなので、アプリケーション側で制御）
-- または、シンプルなポリシーを設定
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- 3. 管理者チェック用の関数を再作成（SECURITY DEFINERでRLSをバイパス）
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- SECURITY DEFINERなので、RLSをバイパスして直接adminsテーブルにアクセス
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. daily_reportsテーブルのポリシーを作成（関数を使用）
CREATE POLICY "Users and admins can view daily reports"
  ON daily_reports
  FOR SELECT
  USING (
    auth.uid() = user_id OR is_admin_user()
  );

-- 5. todosテーブルのポリシーを作成（関数を使用）
CREATE POLICY "Users and admins can view todos"
  ON todos
  FOR SELECT
  USING (
    auth.uid() = user_id OR is_admin_user()
  );

-- 6. adminsテーブルにRLSを再度有効化して、シンプルなポリシーを設定
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- adminsテーブルは関数経由でアクセスするため、RLSポリシーは不要
-- ただし、直接アクセスを許可する場合は以下を設定
CREATE POLICY "Allow all for admins table"
  ON admins
  FOR ALL
  USING (true)
  WITH CHECK (true);

