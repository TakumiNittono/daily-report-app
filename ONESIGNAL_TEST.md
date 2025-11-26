# プッシュ通知の動作確認方法

## ✅ 現在の実装状況

**実装は完了しています！** 以下の設定が完了すれば、プッシュ通知が動作します。

## 🔧 必要な設定

### 1. OneSignalダッシュボードでの設定（必須）

1. **OneSignalダッシュボードにログイン**
   - [https://app.onesignal.com/](https://app.onesignal.com/)

2. **アプリ設定を確認**
   - Settings → Platforms → Web Push
   - **Site URL**: `https://daily-report-takumi.vercel.app`（VercelのURL）
   - **Default Notification Icon**: `https://daily-report-takumi.vercel.app/icon.svg`

3. **Service Worker設定**
   - Service Worker Path: `/OneSignalSDKWorker.js`
   - このファイルは既に`public/OneSignalSDKWorker.js`に配置済み

### 2. Vercelでの環境変数設定（必須）

Vercelダッシュボードで以下を設定：
```
NEXT_PUBLIC_ONESIGNAL_APP_ID=7e5bd516-02a5-480b-b074-c639af8947a0
```

### 3. デプロイと動作確認

1. **Vercelにデプロイ**
   - GitHubにプッシュすると自動デプロイ

2. **本番環境でアクセス**
   - `https://daily-report-takumi.vercel.app`にアクセス
   - 通知許可のプロンプトが表示される
   - 「許可」をクリック

3. **OneSignalダッシュボードで確認**
   - Audience → All Users
   - 自分のデバイスが登録されているか確認（ステータス: Subscribed）

4. **テスト通知を送信**
   - Messages → New Push
   - タイトルと本文を入力
   - Send Messageをクリック

## 📱 プッシュ通知が来る条件

✅ 以下の条件をすべて満たす必要があります：

1. ✅ **HTTPS環境**（Vercelは自動でHTTPS）
2. ✅ **通知許可**（ユーザーが許可する必要がある）
3. ✅ **Service Worker登録**（OneSignalが自動で登録）
4. ✅ **OneSignalダッシュボードでの設定完了**
5. ✅ **環境変数が正しく設定されている**

## 🧪 テスト方法

### 方法1: OneSignalダッシュボードから送信

1. OneSignalダッシュボード → Messages → New Push
2. 通知タイトルと本文を入力
3. Audienceを選択（全ユーザー、または特定のユーザー）
4. Send Messageをクリック
5. 数秒以内に通知が届く

### 方法2: ブラウザで確認

1. ブラウザの開発者ツールを開く（F12）
2. Consoleタブで以下を入力：
   ```javascript
   OneSignal.showSlidedownPrompt()
   ```
3. 通知許可プロンプトが表示される

## ❌ 通知が来ない場合のチェックリスト

- [ ] Vercelにデプロイされているか
- [ ] 環境変数`NEXT_PUBLIC_ONESIGNAL_APP_ID`が設定されているか
- [ ] OneSignalダッシュボードでサイトURLが正しく設定されているか
- [ ] ブラウザで通知を許可しているか
- [ ] OneSignalダッシュボードでデバイスが「Subscribed」状態か
- [ ] HTTPSでアクセスしているか（http://は不可）

## 📝 重要な注意点

1. **開発環境（localhost）では動作しません**
   - 本番環境（Vercel）でのみ動作します
   - 現在の実装では、localhostの場合は初期化をスキップしています

2. **通知許可が必要**
   - ユーザーが通知を許可しないと、通知は届きません
   - 一度許可すれば、その後は自動的に通知が届きます

3. **ブラウザが閉じていても通知が届く**
   - Service Workerがバックグラウンドで動作
   - アプリを閉じていても通知を受信可能

## 🎯 実際に動作するか確認するには

1. **Vercelにデプロイ**
   ```bash
   git add .
   git commit -m "Add OneSignal push notification"
   git push origin main
   ```

2. **Vercelで環境変数を設定**
   - `NEXT_PUBLIC_ONESIGNAL_APP_ID=7e5bd516-02a5-480b-b074-c639af8947a0`

3. **本番環境でアクセスして通知を許可**

4. **OneSignalダッシュボードからテスト通知を送信**

これで確実にプッシュ通知が届きます！

