# PushAlert設定ガイド

## 1. 環境変数の設定

### ローカル開発環境（`.env.local`）

```bash
NEXT_PUBLIC_PUSHALERT_WIDGET_ID=7d31b1ce0e2fdb36d3af902d5d1e4278
```

### Vercel環境変数

1. Vercelダッシュボードでプロジェクトを選択
2. 「Settings」→「Environment Variables」
3. 以下の変数を追加：
   - **Name**: `NEXT_PUBLIC_PUSHALERT_WIDGET_ID`
   - **Value**: `7d31b1ce0e2fdb36d3af902d5d1e4278`
   - **Environments**: Production, Preview, Development

## 2. サービスワーカーファイル（sw.js）の設定

PushAlertダッシュボードから`sw.js`ファイルをダウンロードして、`public/`ディレクトリに配置してください。

**注意**: 現在、next-pwaが生成した`sw.js`が存在しています。PushAlertのサービスワーカーと統合する必要がある場合は、以下のいずれかの方法を選択してください：

### 方法1: PushAlertのsw.jsを優先（推奨）

1. PushAlertダッシュボードから`sw.js`をダウンロード
2. `public/sw.js`をPushAlertのファイルで上書き
3. next-pwaの設定を調整（開発環境でのみ有効化するなど）

### 方法2: 両方を統合

PushAlertとnext-pwaのService Workerを統合する必要がある場合は、カスタムService Workerを作成してください。

## 3. 動作確認

1. 本番環境（Vercel）にデプロイ
2. ログイン画面で「プッシュ通知を許可する」ボタンをクリック
3. 通知許可ダイアログが表示されることを確認

## 4. トラブルシューティング

### 通知許可ダイアログが表示されない場合

- ブラウザの開発者ツール（F12）のコンソールを確認
- `NEXT_PUBLIC_PUSHALERT_WIDGET_ID`環境変数が正しく設定されているか確認
- PushAlertのスクリプトが正しく読み込まれているか確認（Network タブ）

### Service Workerのエラーが発生する場合

- PushAlertの`sw.js`ファイルが正しく配置されているか確認
- ブラウザの開発者ツール（F12）→ Application → Service Workers でService Workerの状態を確認

