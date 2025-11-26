# 環境変数の設定ガイド

## セキュリティについて

**重要な注意事項：**
- 機密情報（APIキー、トークンなど）は**絶対に**コードに直接書かないでください
- すべての機密情報は環境変数として管理してください
- `.env.local`ファイルは`.gitignore`に含まれているため、Gitにコミットされません

## 必要な環境変数

### 1. 開発環境（`.env.local`ファイルを作成）

プロジェクトルートに`.env.local`ファイルを作成し、以下の内容を記述してください：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OneSignal設定（プッシュ通知）
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_onesignal_app_id
```

### 2. Vercel本番環境

Vercelダッシュボードで環境変数を設定：

1. Vercelプロジェクトの「Settings」→「Environment Variables」を開く
2. 以下の環境変数を追加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ONESIGNAL_APP_ID`
3. 各環境（Production, Preview, Development）に適用するよう選択

## 環境変数の取得方法

### Supabase設定

1. [Supabase Dashboard](https://app.supabase.com/)にログイン
2. プロジェクトを選択
3. 「Settings」→「API」を開く
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### OneSignal設定

1. [OneSignal Dashboard](https://app.onesignal.com/)にログイン
2. アプリを選択
3. 「Settings」→「Keys & IDs」を開く
   - **OneSignal App ID** → `NEXT_PUBLIC_ONESIGNAL_APP_ID`

## セキュリティチェック

### ✅ 確認事項

- [ ] `.env.local`が`.gitignore`に含まれている
- [ ] コードに機密情報が直接書かれていない
- [ ] 環境変数の値が正しく設定されている
- [ ] Vercelの環境変数が設定されている

### ⚠️ 注意事項

1. **`.env.local`ファイルをGitにコミットしない**
   - `.gitignore`で除外されていることを確認
   - 誤ってコミットしてしまった場合は、Git履歴から削除が必要

2. **環境変数の命名規則**
   - クライアント側で使用する変数は`NEXT_PUBLIC_`で始める
   - サーバー側のみで使用する変数は`NEXT_PUBLIC_`を付けない

3. **本番環境での設定**
   - 開発環境と本番環境で異なる値を使用する場合がある
   - Vercelで環境ごとに異なる値を設定可能

