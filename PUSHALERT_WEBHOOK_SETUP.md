# PushAlert Webhook自動化セットアップガイド

## 📋 概要

PushAlert Webhookを使用して、通知が送信されたときに自動的にデータベースに保存する機能を実装します。

## 🔧 セットアップ手順

### 1. Vercelへのデプロイ確認

まず、アプリがVercelにデプロイされていることを確認してください。

```
https://your-app-name.vercel.app
```

### 2. WebhookエンドポイントのURLを確認

WebhookエンドポイントのURLは以下の形式です：

```
https://your-app-name.vercel.app/api/pushalert-webhook
```

### 3. PushAlertダッシュボードでWebhookを設定

1. **PushAlertダッシュボードにログイン**
   - https://pushalert.co/dashboard にアクセス

2. **SettingsまたはIntegrationセクションを開く**
   - ダッシュボードの左サイドバーから「Settings」または「Integration」を選択
   - 「Webhooks」または「API Integration」セクションを探す

3. **Webhook URLを設定**
   - Webhook URLフィールドに以下を入力：
     ```
     https://your-app-name.vercel.app/api/pushalert-webhook
     ```
   - 実際のドメイン名に置き換えてください

4. **通知イベントを選択**
   - 送信したい通知イベントを選択
   - 例: `notification.sent`, `notification.delivered` など

5. **保存**
   - 「Save」または「Update」ボタンをクリック

### 4. Webhookのテスト

1. **PushAlertからテスト通知を送信**
   - PushAlertダッシュボードからテスト通知を送信

2. **Vercelのログを確認**
   - Vercel Dashboard > Functions タブでログを確認
   - または、ブラウザのコンソールで確認

3. **アプリで通知を確認**
   - アプリの「お知らせ」タブで通知が表示されるか確認

## 🔍 トラブルシューティング

### Webhookが呼ばれない場合

1. **PushAlertの設定を確認**
   - Webhook URLが正しく設定されているか確認
   - イベントが選択されているか確認

2. **エンドポイントの動作確認**
   - ブラウザで以下のURLにアクセス：
     ```
     https://your-app-name.vercel.app/api/pushalert-webhook
     ```
   - 正常な場合は、メッセージが表示されます

3. **Vercelのログを確認**
   - Vercel Dashboard > Functions タブでエラーを確認
   - エラーメッセージを確認して、問題を特定

### Webhookのデータ形式が異なる場合

PushAlertのWebhookデータ形式が異なる場合は、`app/api/pushalert-webhook/route.ts` の `parsePushAlertWebhook` 関数を調整してください。

実際のWebhookデータを確認するには、Vercelのログを見るか、一時的にデータベースに保存して確認できます。

## 📝 Webhookデータ形式のカスタマイズ

PushAlertのWebhookデータ形式に応じて、`parsePushAlertWebhook` 関数を調整してください：

```typescript
function parsePushAlertWebhook(body: any): any {
  // PushAlertの実際のデータ形式に応じて調整
  // 例: body.custom_field など
  
  return {
    id: body.id,
    title: body.title,
    body: body.body,
    url: body.url,
    // ... 他のフィールド
  }
}
```

## 🔐 セキュリティ

### Webhookの認証（推奨）

PushAlertがWebhook認証をサポートしている場合、認証を実装することをお勧めします。

1. **シークレットキーを環境変数に設定**
   ```bash
   # .env.local
   PUSHALERT_WEBHOOK_SECRET=your-secret-key
   ```

2. **認証を実装**
   - `app/api/pushalert-webhook/route.ts` で認証を追加

### IPアドレス制限

PushAlertのIPアドレスを確認し、必要に応じてIPアドレス制限を実装できます。

## 📊 ログとモニタリング

### ログの確認方法

1. **Vercel Dashboard**
   - Functions タブでログを確認

2. **アプリケーションログ**
   - コンソールログを確認
   - `console.log('PushAlert Webhook received:', ...)` で確認

### 通知数の確認

SupabaseのTable Editorで `notifications` テーブルを確認し、通知が正しく保存されているか確認してください。

## ✅ 確認事項

- [ ] Vercelにデプロイされている
- [ ] WebhookエンドポイントのURLが正しい
- [ ] PushAlertダッシュボードでWebhookが設定されている
- [ ] テスト通知を送信して動作確認
- [ ] アプリの「お知らせ」タブで通知が表示される

## 📚 参考資料

- PushAlert公式ドキュメント: https://pushalert.co/help
- PushAlertサポート: サポートチームに連絡

## ⚠️ 注意事項

- PushAlertがWebhookを提供していない場合は、この方法は使用できません
- その場合は、手動作成（管理者画面）またはAPI経由の定期取得を検討してください

