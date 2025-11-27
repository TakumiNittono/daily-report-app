-- ============================================
-- notificationsテーブルの管理者用RLSポリシー
-- ============================================

-- 管理者チェック用の関数（既に存在する場合は更新）
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

-- 既存のINSERTポリシーを削除
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;

-- 新しいINSERTポリシー: 自分の通知または管理者は全ユーザーの通知を挿入可能
CREATE POLICY "Users and admins can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR is_admin_user()
  );

-- 既存のSELECTポリシーを削除
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

-- 新しいSELECTポリシー: 自分の通知または管理者は全通知を閲覧可能
CREATE POLICY "Users and admins can view notifications"
  ON notifications
  FOR SELECT
  USING (
    auth.uid() = user_id OR is_admin_user()
  );

-- 既存のUPDATEポリシーを削除
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- 新しいUPDATEポリシー: 自分の通知または管理者は全通知を更新可能
CREATE POLICY "Users and admins can update notifications"
  ON notifications
  FOR UPDATE
  USING (
    auth.uid() = user_id OR is_admin_user()
  )
  WITH CHECK (
    auth.uid() = user_id OR is_admin_user()
  );

-- 既存のDELETEポリシーを削除
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- 新しいDELETEポリシー: 自分の通知または管理者は全通知を削除可能
CREATE POLICY "Users and admins can delete notifications"
  ON notifications
  FOR DELETE
  USING (
    auth.uid() = user_id OR is_admin_user()
  );

