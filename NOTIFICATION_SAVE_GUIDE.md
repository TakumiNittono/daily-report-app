# PushAlertの通知をアプリ内に表示する方法

## 問題

PushAlertで通知を送信しても、アプリ内の「お知らせ」タブに表示されない場合があります。

## 解決方法

### 方法1: 管理者画面から通知を作成（推奨・最も確実）

1. **管理者画面にアクセス**
   - アプリにログイン後、ヘッダーの「管理者画面」リンクをクリック
   - または、`/admin` に直接アクセス

2. **通知作成フォームを使用**
   - 管理者画面の上部に「お知らせを作成」フォームが表示されます
   - PushAlertで送信した通知と同じ内容を入力:
     - **タイトル**: 通知のタイトル
     - **本文**: 通知の内容
     - **リンクURL**: 通知をクリックしたときに遷移するURL（オプション）

3. **全ユーザーに通知を送信**
   - 「全ユーザーに通知を送信」ボタンをクリック
   - すべてのユーザーの「お知らせ」タブに通知が表示されます

### 方法2: 自動保存（実装済み・動作確認が必要）

Service WorkerとNotificationSyncコンポーネントにより、PushAlertから通知を受信したときに自動的にデータベースに保存される仕組みが実装されています。

**動作確認方法:**
1. PushAlertダッシュボードから通知を送信
2. ブラウザのコンソール（F12）を開く
3. 以下のログが表示されることを確認:
   - `[Custom SW] Push notification received`
   - `Received push notification from service worker`
   - `✅ Notification saved to database`

**もし自動保存が動作しない場合:**
- ブラウザのコンソールでエラーを確認
- Service Workerが正しく登録されているか確認
- 方法1（管理者画面からの手動作成）を使用してください

## 動作確認のポイント

### 1. データベーステーブルの確認
- Supabaseで `notifications` テーブルが作成されているか確認
- `supabase-notifications-setup.sql` を実行済みか確認

### 2. Service Workerの確認
- ブラウザのDevTools > Application > Service Workers
- `sw.js` が正しく登録されているか確認
- エラーがないか確認

### 3. 通知の表示確認
- アプリの「お知らせ」タブを確認
- 通知が表示されているか確認
- 未読数バッジが表示されているか確認

## トラブルシューティング

### 通知が自動的に保存されない場合

1. **Service Workerの登録を確認**
   ```javascript
   // ブラウザのコンソールで実行
   navigator.serviceWorker.getRegistration().then(reg => {
     console.log('Service Worker:', reg);
   });
   ```

2. **プッシュ通知のテスト**
   - PushAlertダッシュボードからテスト通知を送信
   - ブラウザのコンソールでログを確認

3. **手動での保存**
   - 管理者画面から通知を作成する方法を使用（最も確実）

### 通知が表示されない場合

1. **データベースの確認**
   - SupabaseのTable Editorで `notifications` テーブルを確認
   - 通知データが保存されているか確認

2. **RLSポリシーの確認**
   - `supabase-notifications-setup.sql` が正しく実行されているか確認
   - RLSポリシーが正しく設定されているか確認

3. **ブラウザのリロード**
   - ページをリロードして、最新の通知を取得

## 今後の改善

- [ ] PushAlert Webhookの実装（通知送信時に自動的にデータベースに保存）
- [ ] 通知の自動保存の改善（Service Workerとの連携強化）
- [ ] 通知フィルター機能（日付、キーワードなど）

