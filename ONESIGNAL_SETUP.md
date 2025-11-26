# OneSignalプッシュ通知セットアップガイド

## ✅ 実装済みの機能

1. **OneSignal SDKの統合**
   - `react-onesignal`パッケージをインストール済み
   - `OneSignalInit`コンポーネントで初期化
   - 環境変数からApp IDを取得

2. **Service Workerファイル**
   - `public/OneSignalSDKWorker.js`を作成済み

3. **環境変数設定**
   - `NEXT_PUBLIC_ONESIGNAL_APP_ID`を使用

## 🔧 OneSignalダッシュボードでの設定（必須）

### 1. サイト設定

1. [OneSignalダッシュボード](https://app.onesignal.com/)にログイン
2. アプリを選択（または新規作成）
3. **Settings** → **Platforms** → **Web Push** を開く

### 2. サイトURLの設定

以下のサイトURLを設定：
- **Site URL**: `https://daily-report-takumi.vercel.app`（本番環境のURL）
- **Default Notification Icon URL**: `https://daily-report-takumi.vercel.app/icon.svg`

### 3. Service Workerの設定

OneSignalダッシュボードで以下の設定を確認：

- **Service Worker Path**: `/OneSignalSDKWorker.js`
- **Service Worker Name**: `OneSignalSDKWorker.js`

### 4. 許可するドメイン

OneSignalダッシュボードで以下を許可：
- `https://daily-report-takumi.vercel.app`
- （開発用に）`http://localhost:3000`（オプション）

## 📱 動作確認の手順

### ステップ1: 本番環境でアクセス

1. Vercelにデプロイ（`https://daily-report-takumi.vercel.app`）
2. ブラウザでアクセス
3. 通知許可のプロンプトが表示される
4. 「許可」をクリック

### ステップ2: OneSignalダッシュボードで確認

1. **Audience** → **All Users** を開く
2. 自分のデバイスが登録されているか確認
3. ステータスが「Subscribed」になっていることを確認

### ステップ3: テスト通知を送信

1. **Messages** → **New Push** をクリック
2. 通知タイトルと本文を入力
3. **Audience** で送信先を選択（全ユーザー、または特定のユーザー）
4. **Send Message** をクリック

### ステップ4: 通知の受信確認

- デバイスで通知が届くことを確認
- ブラウザが閉じていても通知が届く（バックグラウンド通知）

## 🛠️ トラブルシューティング

### 通知が届かない場合

1. **通知許可の確認**
   - ブラウザの設定で通知が許可されているか確認
   - Chrome: 設定 → プライバシーとセキュリティ → サイトの設定 → 通知

2. **Service Workerの確認**
   - DevTools → Application → Service Workers
   - `OneSignalSDKWorker.js`が登録されているか確認

3. **OneSignalダッシュボードでの確認**
   - Audienceで自分のデバイスが登録されているか
   - ステータスが「Subscribed」か

4. **HTTPS環境での確認**
   - プッシュ通知はHTTPS必須（localhostは例外）
   - 本番環境（Vercel）でテスト

5. **ブラウザの対応確認**
   - Chrome、Edge、Firefox、Safari（macOS/iOS）で動作
   - 古いブラウザでは動作しない場合あり

## 📝 今後の拡張機能

### 管理者からの通知送信機能

将来的に、管理者がアプリ内から通知を送信できる機能を追加可能：

1. OneSignal REST APIを使用
2. 管理者画面に通知送信フォームを追加
3. サーバー側でAPI経由で通知を送信

## ✅ チェックリスト

- [ ] OneSignalダッシュボードでサイトURLを設定
- [ ] Service Workerパスを設定
- [ ] 本番環境（Vercel）にデプロイ
- [ ] 環境変数`NEXT_PUBLIC_ONESIGNAL_APP_ID`をVercelに設定
- [ ] ブラウザで通知を許可
- [ ] OneSignalダッシュボードでデバイスが登録されていることを確認
- [ ] テスト通知を送信して動作確認

