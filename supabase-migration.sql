-- ============================================
-- 日報＆自己管理アプリへの移行用SQL
-- ============================================

-- 1. todosテーブルにtarget_dateカラムを追加
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS target_date DATE DEFAULT CURRENT_DATE;

-- target_date用のインデックスを作成
CREATE INDEX IF NOT EXISTS todos_target_date_idx ON todos(target_date);

-- 2. daily_reportsテーブルの作成
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reflection TEXT,
  wake_up_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date) -- 1ユーザー1日1レコード
);

-- RLS（Row Level Security）を有効化
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- 自分のデータのみ閲覧可能なポリシー
CREATE POLICY "Users can view their own daily reports"
  ON daily_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- 自分のデータのみ追加可能なポリシー
CREATE POLICY "Users can insert their own daily reports"
  ON daily_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のデータのみ更新可能なポリシー
CREATE POLICY "Users can update their own daily reports"
  ON daily_reports
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 自分のデータのみ削除可能なポリシー
CREATE POLICY "Users can delete their own daily reports"
  ON daily_reports
  FOR DELETE
  USING (auth.uid() = user_id);

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS daily_reports_user_id_idx ON daily_reports(user_id);
CREATE INDEX IF NOT EXISTS daily_reports_date_idx ON daily_reports(date);
CREATE INDEX IF NOT EXISTS daily_reports_user_date_idx ON daily_reports(user_id, date);

-- updated_atを自動更新する関数（オプション）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_atを自動更新するトリガー
CREATE TRIGGER update_daily_reports_updated_at 
  BEFORE UPDATE ON daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

