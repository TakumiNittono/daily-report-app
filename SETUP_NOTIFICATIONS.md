# 通知機能のセットアップ手順

## エラーが発生している場合

コンソールに以下のエラーが表示されている場合：
```
column notifications.user_id does not exist
```

これは、`notifications`テーブルがまだ作成されていないことを示しています。

## 解決方法

### ステップ1: Supabaseにログイン

1. [Supabase Dashboard](https://app.supabase.com/) にログインします
2. プロジェクトを選択します

### ステップ2: SQLエディタを開く

1. 左サイドバーから「SQL Editor」をクリックします
2. 「New query」をクリックして新しいクエリを作成します

### ステップ3: SQLファイルを実行

1. プロジェクト内の `supabase-notifications-setup.sql` ファイルを開きます
2. ファイルの内容をすべてコピーします
3. SupabaseのSQLエディタに貼り付けます
4. 「RUN」ボタンをクリックして実行します

### ステップ4: 実行結果を確認

- 「Success. No rows returned」と表示されれば成功です
- エラーが表示された場合は、エラーメッセージを確認してください

### ステップ5: アプリをリロード

- ブラウザでアプリをリロードしてください
- エラーが解消されているはずです

## 確認方法

SQLが正しく実行されたか確認するには：

1. Supabaseダッシュボードで「Table Editor」を開きます
2. `notifications`テーブルが表示されることを確認します
3. テーブルの構造を確認します（以下のカラムが存在することを確認）:
   - `id` (UUID)
   - `user_id` (UUID)
   - `title` (TEXT)
   - `body` (TEXT)
   - `is_read` (BOOLEAN)
   - `created_at` (TIMESTAMP)

## トラブルシューティング

### エラー: "relation already exists"

テーブルが既に存在する場合、以下の方法で確認できます：

1. Supabaseの「Table Editor」で `notifications` テーブルを確認
2. テーブルが存在するが、`user_id` カラムがない場合:
   - テーブルを削除してから、SQLを再実行
   - または、以下のSQLでカラムを追加:
   ```sql
   ALTER TABLE notifications 
   ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
   ```

### エラー: "permission denied"

RLSポリシーの問題の場合：

1. テーブルが作成されていることを確認
2. RLSポリシーが正しく作成されていることを確認
3. 必要に応じて、SQLファイルのRLSポリシー部分を再実行

