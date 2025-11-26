-- ============================================
-- 管理者が全ユーザーのデータを閲覧できるようにするRLSポリシー
-- ============================================

-- 既存のポリシーを削除（重複を避けるため）
-- 注意: エラーが出る場合は、既に削除されている可能性があります

-- daily_reportsテーブルの既存ポリシーを確認してから削除
DO $$
BEGIN
  -- 既存のポリシーを削除
  DROP POLICY IF EXISTS "Users can view their own daily reports" ON daily_reports;
  DROP POLICY IF EXISTS "Admins can view all daily reports" ON daily_reports;
END $$;

-- todosテーブルの既存ポリシーを確認してから削除
DO $$
BEGIN
  -- 既存のポリシーを削除
  DROP POLICY IF EXISTS "Users can view their own todos" ON todos;
  DROP POLICY IF EXISTS "Admins can view all todos" ON todos;
END $$;

-- daily_reportsテーブル: 自分のデータまたは管理者は全データを閲覧可能
CREATE POLICY "Users and admins can view daily reports"
  ON daily_reports
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- todosテーブル: 自分のデータまたは管理者は全データを閲覧可能
CREATE POLICY "Users and admins can view todos"
  ON todos
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- 既存のINSERT、UPDATE、DELETEポリシーはそのまま維持
-- （ユーザーは自分のデータのみ追加・更新・削除可能）
