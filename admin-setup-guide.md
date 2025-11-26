# 管理者ページへのアクセス方法

## 手順1: 現在のユーザーIDを取得

1. アプリにログインした状態で、ブラウザの開発者ツール（F12）を開く
2. Consoleタブで以下のコードを実行：

```javascript
// SupabaseクライアントからユーザーIDを取得
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const { data: { user } } = await supabase.auth.getUser();
console.log('ユーザーID:', user.id);
console.log('メールアドレス:', user.email);
```

または、Supabaseダッシュボードで確認：
1. Supabaseダッシュボードにログイン
2. Authentication > Users を開く
3. 管理者にしたいユーザーのUUIDをコピー

## 手順2: 管理者テーブルにユーザーを追加

SupabaseのSQLエディタで以下のSQLを実行してください：

```sql
-- ユーザーIDを管理者に追加
-- 'YOUR_USER_ID_HERE' の部分を実際のユーザーIDに置き換えてください
INSERT INTO admins (user_id) 
VALUES ('YOUR_USER_ID_HERE')
ON CONFLICT (user_id) DO NOTHING;
```

例：
```sql
INSERT INTO admins (user_id) 
VALUES ('123e4567-e89b-12d3-a456-426614174000')
ON CONFLICT (user_id) DO NOTHING;
```

## 手順3: 管理者ページにアクセス

1. ブラウザでアプリにログインしていることを確認
2. 以下のいずれかの方法でアクセス：
   - 一般画面のヘッダーに「管理者画面」リンクが表示されるので、それをクリック
   - 直接 `/admin` にアクセス（例: `http://localhost:3000/admin`）

## 確認方法

管理者として登録されているか確認するSQL：

```sql
-- 現在の管理者一覧を確認
SELECT 
  a.id,
  a.user_id,
  a.created_at,
  u.email
FROM admins a
LEFT JOIN auth.users u ON a.user_id = u.id;
```

## トラブルシューティング

- 管理者ページにアクセスできない場合：
  1. 管理者テーブルに正しく追加されているか確認
  2. ログアウトして再度ログインしてみる
  3. ブラウザのキャッシュをクリア

- エラーが表示される場合：
  1. SupabaseのSQLエディタで `supabase-admin-setup.sql` が正しく実行されているか確認
  2. ブラウザのコンソールでエラーメッセージを確認

