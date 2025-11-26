# Vercelへのデプロイ手順

## 1. GitHubにプッシュ（まだの場合）

```bash
# 変更をステージング
git add .

# コミット
git commit -m "Add PWA support and admin features"

# GitHubにプッシュ（まだリモートがない場合）
# git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## 2. Vercelアカウント作成・ログイン

1. [Vercel](https://vercel.com)にアクセス
2. 「Sign Up」をクリック
3. GitHubアカウントでログイン（推奨）

## 3. プロジェクトをインポート

1. Vercelダッシュボードで「Add New...」→「Project」をクリック
2. 「Import Git Repository」を選択
3. GitHubリポジトリを選択（まだプッシュしていない場合は先にプッシュ）
4. 「Import」をクリック

## 4. 環境変数の設定

Vercelのプロジェクト設定画面で、以下の環境変数を追加：

```
NEXT_PUBLIC_SUPABASE_URL=あなたのSupabaseプロジェクトURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのSupabaseアノンキー
```

**設定手順：**
1. プロジェクトをインポート後、「Settings」→「Environment Variables」を開く
2. 「Add New」をクリック
3. 上記の2つの環境変数を追加
4. 各環境（Production, Preview, Development）に適用するよう選択

## 5. ビルド設定の確認

Vercelは自動的にNext.jsプロジェクトを検出しますが、以下を確認：

- **Framework Preset:** Next.js
- **Build Command:** `npm run build`（自動検出）
- **Output Directory:** `.next`（自動検出）
- **Install Command:** `npm install`（自動検出）

## 6. デプロイ

1. 「Deploy」ボタンをクリック
2. デプロイが完了するまで待つ（通常1-3分）
3. デプロイ完了後、Vercelが自動的にURLを発行（例: `https://your-app.vercel.app`）

## 7. カスタムドメインの設定（オプション）

1. Vercelダッシュボードで「Settings」→「Domains」を開く
2. ドメイン名を入力（例: `app.yourdomain.com`）
3. DNSレコードを追加：
   - **CNAMEレコード**を追加
   - 名前: `app`（サブドメイン名）
   - 値: `cname.vercel-dns.com.`
4. Vercelが自動的にSSL証明書を発行（数分かかる場合あり）

## 8. 動作確認

デプロイ後、以下を確認：

1. ✅ アプリが正常に表示される
2. ✅ ログイン機能が動作する
3. ✅ Supabaseとの接続が正常
4. ✅ PWAが動作する（HTTPS必須）
5. ✅ Service Workerが登録される

## トラブルシューティング

### ビルドエラーが出る場合

- 環境変数が正しく設定されているか確認
- Vercelのログを確認（デプロイ画面の「Logs」タブ）

### Supabase接続エラー

- 環境変数の値が正しいか確認
- Supabaseの「Settings」→「API」でURLとキーを再確認

### PWAが動作しない

- HTTPSでアクセスしているか確認（Vercelは自動的にHTTPS）
- ブラウザの開発者ツールでService Workerを確認

## 自動デプロイ

GitHubにプッシュすると、Vercelが自動的にデプロイします：

- **mainブランチへのプッシュ** → 本番環境にデプロイ
- **その他のブランチへのプッシュ** → プレビュー環境にデプロイ

## 追加の設定（必要に応じて）

### PWAのアイコンファイル

本番環境でPNGアイコンを使用する場合は、以下を追加：

1. `public/icon-192x192.png`を作成
2. `public/icon-512x512.png`を作成
3. `manifest.json`を更新してPNGアイコンを指定

