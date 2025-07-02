# Dify Sync

![defy-sync log](./logo.png)

Dify-Syncは、Difyナレッジベースをダウンロードしたりアップロードしたりするためのコマンドラインツールです。

## 機能

- **双方向同期**: ローカルファイルをDifyにアップロード、またはDifyからドキュメントをダウンロード
- **インタラクティブUI**: キーボード操作可能なターミナルベースのインターフェース
- **進捗追跡**: アップロード・ダウンロードのリアルタイム進捗表示
- **ファイル選択**: ファイルとドキュメントを選択するためのマルチセレクトインターフェース
- **エラーハンドリング**: 包括的なエラー処理とロギング

## インストール

```bash
npm install -g @takada-at/dify-sync
```

## 設定

1. コマンドラインでの設定:
defy-syncコマンドを実行し、SettingsメニューからDIFYのAPI KEYなどを設定します。

2. 環境変数を設定:
```
DIFY_API_URL=https://api.dify.ai/v1/
DIFY_API_KEY=your_api_key_here
DIFY_DATASET_ID=your_dataset_id
LOG_LEVEL=info
```

### 環境変数

- `DIFY_API_URL` - Dify APIエンドポイント（`/v1/`で終わる必要があります）
- `DIFY_API_KEY` - DifyのデータセットAPIキー
- `DIFY_DATASET_ID` - 対象のデータセットID
- `LOG_LEVEL` - ログレベル（info, debug, error, warn）

## 使い方

### インタラクティブモード

ターミナルUIを使用するインタラクティブモードでアプリケーションを実行:

```bash
# 開発モード
npm start

# ウォッチモード
npm run dev

# ビルド済みバージョン
npm run build
dify-sync
```

### コマンドラインモード

CLIは直接アップロード・ダウンロード操作をサポートしています:

```bash
# ディレクトリからファイルをアップロード
dify-sync --upload ./my-files

# ディレクトリにドキュメントをダウンロード
dify-sync --download ./downloads

# ダウンロード時に既存ファイルを強制的に上書き
dify-sync --download ./downloads --force

# 特定のデータセットIDを使用（環境変数を上書き）
dify-sync --upload ./files --dataset-id your-dataset-id

# 複数のオプションを組み合わせる
dify-sync --upload ./files --dataset-id abc123 --force
```

### CLIオプション

- `-u, --upload <path>` - 指定したパスからファイルを再帰的にアップロード
- `-d, --download <path>` - 指定したパスにファイルをダウンロード
- `-f, --force` - 既存ファイルを確認なしに強制的に上書き
- `--dataset-id <id>` - DifyデータセットIDを指定（DIFY_DATASET_ID環境変数を上書き）

**注記**: `--dataset-id`オプションを使用すると、`.env`ファイルを変更せずに異なるデータセットで作業できます。これは複数のDifyデータセットを扱う場合やCI/CD環境で特に便利です。

## コマンド

### 開発

- `npm start` - tsxでアプリケーションを直接実行（開発に推奨）
- `npm run dev` - ファイル監視モードで実行（tsx watch）
- `npm run build` - TypeScriptをdist/内のJavaScriptにビルド
- `npm run typecheck` - TypeScriptの型チェックを実行

### テスト

- `npm test` - テストを一度実行
- `npm run test:watch` - ウォッチモードでテストを実行
- `npm run test:coverage` - カバレッジレポート付きでテストを実行

### コード品質

- `npm run format` - Prettierでコードをフォーマット
- `npm run format:check` - コードフォーマットをチェック

## 動作の仕組み

アプリケーションは以下の操作が可能なインタラクティブなターミナルインターフェースを提供します：

1. **ファイルのアップロード**: Difyナレッジベースにアップロードするローカルファイルを選択
2. **ドキュメントのダウンロード**: Difyからダウンロードしてローカルファイルとして保存するドキュメントを選択
3. **進捗の追跡**: アップロード/ダウンロードの進捗をリアルタイムで監視

### ナビゲーション

- **矢印キー**でメニューを移動
- **スペースキー**でファイルを選択/選択解除
- **Enter**で選択を確定
- **Ctrl+C**で終了

## アーキテクチャ

使用技術：
- **React Ink** - ターミナルUIフレームワーク
- **TypeScript** - 型安全な開発
- **Axios** - Dify API用のHTTPクライアント
- **Commander** - CLI引数解析

アプリケーションはデータアクセスにリポジトリパターンを採用した関数型プログラミングアプローチに従っています。

## API統合

Dify APIエンドポイントと統合：
- ドキュメントの作成と管理
- データセット操作
- ドキュメントセグメントの取得

## ライセンス

MIT