-- todosテーブルの作成
CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS（Row Level Security）を有効化
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- 自分のデータのみ閲覧可能なポリシー
CREATE POLICY "Users can view their own todos"
  ON todos
  FOR SELECT
  USING (auth.uid() = user_id);

-- 自分のデータのみ追加可能なポリシー
CREATE POLICY "Users can insert their own todos"
  ON todos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のデータのみ更新可能なポリシー
CREATE POLICY "Users can update their own todos"
  ON todos
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 自分のデータのみ削除可能なポリシー
CREATE POLICY "Users can delete their own todos"
  ON todos
  FOR DELETE
  USING (auth.uid() = user_id);

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS todos_user_id_idx ON todos(user_id);
CREATE INDEX IF NOT EXISTS todos_created_at_idx ON todos(created_at);

