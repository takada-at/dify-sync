# Dify Sync ユーザーガイド

Dify Syncは、ローカルファイルとDifyナレッジベース間で双方向同期を行うCLIツールです。このガイドでは、基本的な使い方から応用的な使い方まで詳しく説明します。

## 目次

- [初期設定](#初期設定)
- [基本的な使い方](#基本的な使い方)
- [コマンドラインオプション](#コマンドラインオプション)
- [インタラクティブモード](#インタラクティブモード)
- [ファイルの選択](#ファイルの選択)
- [エラー処理](#エラー処理)
- [よくある質問](#よくある質問)

## 初期設定

### 1. 設定

最初に、Dify APIの設定を行います。dify-syncを起動し、SettingsからAPIキーやURLを設定します。

```bash
dify-sync
 🔄 DIFY SYNC • Knowledge Base Synchronization


 MAIN MENU

    📤 Upload files to Dify
    📥 Download files from Dify
  ❯ ⚙️ Settings (Configure API credentials and preferences)
    🚪 Exit
```

### 2. 環境変数の設定

また設定値は環境変数でも指定することができます。

```
DIFY_API_URL=https://api.dify.ai/v1/
DIFY_API_KEY=dataset-xxxxxxxxxxxxxxxxx
DIFY_DATASET_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

#### 設定値の取得方法

以下の手順で各設定値を取得してください。

1. DIFY_API_KEY - Difyのデータセット画面で「API」タブを開き、データセットAPIキーをコピーします。
2. DIFY_DATASET_ID - データセットのURLから取得するか、API画面で確認できます。`datasets/xxxxxxxx-xxxx-xxxx/documents` の `xxxxxxxx-xxxx-xxxx` の部分がデータセットのIDです。
3. DIFY_API_URL - 通常は `https://api.dify.ai/v1/`です。独自サーバーの場合は管理者から指定されたURLを設定してください。なお、通常は`/v1/`まで含みます。

## 基本的な使い方

### ファイルのアップロード

#### 方法1: インタラクティブモード

インタラクティブモードで起動し、メニューで「Upload files to Dify」を選択
```bash
dify-sync
 🔄 DIFY SYNC • Knowledge Base Synchronization


 MAIN MENU

  ❯ 📤 Upload files to Dify (Sync local files to your Dify knowledge base)
    📥 Download files from Dify
    ⚙️  Settings
    🚪 Exit
```
ディレクトリを選択
```
 🔄 DIFY SYNC • Knowledge Base Synchronization


  Select directory to upload:

  Recursive mode: ON (includes subdirectories)

   → . (current directory)
     docs
```
ファイルを選択してアップロード
```
  Select files to upload:

   ☑ file1.md  (1 KB)
   ☑ file2.md  (1 KB)
   ☑ sub/subdir_file.md  (1 B)

  Selected: 3 files
  Space: Select/Deselect, A: Select All, D: Deselect All, ↑↓: Navigate, Enter: Confirm, Esc: Cancel
```

#### 方法2: コマンドライン

```bash
# ディレクトリ内のすべてのファイルをアップロード（再帰的）
dify-sync --upload ./my-documents
```

### ファイルのダウンロード

#### 方法1: インタラクティブモード

インタラクティブモードで起動し、メニューで「Download files from Dify」を選択
```bash
dify-sync

 🔄 DIFY SYNC • Knowledge Base Synchronization


 MAIN MENU

    📤 Upload files to Dify
  ❯ 📥 Download files from Dify (Export documents from Dify to local storage)
    ⚙️  Settings
    🚪 Exit
```
ダウンロード先ディレクトリを選択
```
  Select download directory:

  Files will be downloaded to the selected directory

   → . (current directory)
     docs
```
ダウンロードするドキュメントを選択
```
  Select documents to download:

   ☑ sub/subdir_file.md  [completed]
     Words: 100 | Created: ...
   ☑ file1.md  [completed]
     Words: 100 | Created: ...

  Selected: 2 documents
```

#### 方法2: コマンドライン

```bash
# すべてのドキュメントをダウンロード
dify-sync --download ./downloads

# 既存ファイルを強制的に上書き
dify-sync --download ./downloads --force
```

## コマンドラインオプション

### 基本オプション

利用可能な主要オプションは以下の通りです。

| オプション | 短縮形 | 説明 | 例 |
|------------|--------|------|-----|
| `--upload` | `-u` | 指定パスからファイルをアップロード | `dify-sync -u ./docs` |
| `--download` | `-d` | 指定パスにファイルをダウンロード | `dify-sync -d ./backup` |
| `--force` | `-f` | 上書き確認をスキップ | `dify-sync -d ./backup -f` |
| `--help` | `-h` | ヘルプを表示 | `dify-sync -h` |
| `--version` | `-V` | バージョンを表示 | `dify-sync -V` |

### 使用例

```bash
# 基本的なアップロード
dify-sync --upload ./documents

# 基本的なダウンロード
dify-sync --download ./backup

# 強制上書きでダウンロード
dify-sync --download ./backup --force

# 複数オプションの組み合わせ
dify-sync --upload ./src --force
```

## インタラクティブモード

### メニュー操作

インタラクティブモードでは、以下のキーボード操作が利用できます：

#### メインメニュー操作

メインメニューでは以下のキー操作が可能です。

- ↑/↓ 矢印キー - オプション間の移動
- Enter - 選択の確定
- Ctrl+C - アプリケーションの終了

#### ディレクトリ選択操作

ディレクトリ選択画面では以下の操作ができます。

- ↑/↓ 矢印キー - ディレクトリ間の移動
- R キー - 再帰モードのオン/オフ切り替え
- Enter - ディレクトリの選択
- Esc - 前の画面に戻る

#### ファイル選択操作

ファイル選択画面では以下の操作が利用できます。

- ↑/↓ 矢印キー - ファイル間の移動
- スペースキー - ファイルの選択/選択解除
- A キー - 全選択
- D キー - 全選択解除
- Enter - 選択したファイルで処理開始
- Esc - 前の画面に戻る

### 画面の説明

#### アップロード画面
```
🔄 Dify Sync

Select an option:
→ Upload files to Dify    # ← 矢印でハイライト表示
  Download files from Dify
  Settings
  Exit
```

#### ディレクトリ選択画面
```
Select directory to upload:

Recursive mode: ON (includes subdirectories)  # ← Rキーで切り替え

→ . (current directory)
  docs/
  src/
  tests/

↑↓: Navigate, R: Toggle recursive mode, Enter: Select, Esc: Cancel
```

#### ファイル選択画面
```
Select files to upload:

☑ document1.md (1.2 KB)    # ← ☑は選択済み、☐は未選択
☑ document2.txt (856 B)
☐ image.png (45.3 KB)      # ← 現在のカーソル位置
☑ README.md (2.1 KB)

Selected: 3 files
Space: Select/Deselect, A: Select All, D: Deselect All, ↑↓: Navigate, Enter: Confirm, Esc: Cancel
```

## ファイルの選択

### サポートされるファイル形式

アップロード時に自動的に選択されるファイル形式は以下のとおりです。

- テキストファイル（.txt）
- Markdownファイル（.md）
- CSVファイル（.csv）
- JSONファイル（.json）

### ファイル名の処理

#### アップロード時
- 元のファイル名と拡張子が保持されます
- ディレクトリ構造も保持されます（例: `docs/api/guide.md`）

#### ダウンロード時
- Difyでのドキュメント名がそのまま使用されます
- ディレクトリ構造が含まれている場合は自動的に作成されます
- 危険な文字（`\?%*:|"<>`）はハイフン（`-`）に置換されます
