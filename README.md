# 2025年度 ニューメディア研究ゼミ 卒業研究閲覧ウェブサイト

## 🌐 公開URL

- **GitHub Pages**: https://kwu-cms.github.io/new-media-web/
- **GitHubリポジトリ**: https://github.com/kwu-cms/new-media-web

## 概要

このウェブサイトは、2025年度ニューメディア研究ゼミの4年生が行った卒業研究を閲覧できる静的ウェブサイトです。JSONファイルから学生データを読み込み、各学生の題目、画像、レポート（PDF）、プレゼンテーション資料（PDF）を表示します。

## ファイル構成

```
/
├── index.html              # メインページ（学生一覧）
├── student.html            # 個別学生詳細ページ
├── css/
│   └── style.css          # スタイルシート
├── js/
│   ├── main.js            # メインロジック（JSON読み込み、一覧表示、Hero動画管理）
│   ├── student.js         # 学生詳細ページ用スクリプト（PDFビューアー）
│   ├── hero-shader.js     # Hero動画用WebGLシェーダーエフェクト
│   └── random-text.umd.js # ランダムテキストアニメーションライブラリ
├── data/
│   ├── students.xlsx      # 学生データExcelファイル（ここに配置）
│   ├── students.json      # 学生データJSONファイル（自動生成、優先的に使用）
│   ├── config.json        # 年度別個人情報表示制御設定ファイル
│   └── hero-texts.json    # Heroセクション用テキストデータ
├── assets/
│   ├── images/            # 学生の画像ファイル（学籍番号別フォルダ）
│   │   └── QR_449023.png  # QRコード画像
│   ├── reports/
│   │   └── pdf/           # レポートPDFファイル
│   ├── presentations/
│   │   └── master/
│   │       └── pdf/       # プレゼンテーションPDFファイル
│   └── hero/
│       └── videos/        # Heroセクション用動画ファイル
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions自動デプロイ設定
├── scripts/               # 管理用Pythonスクリプト
└── README.md              # このファイル
```

## セットアップ手順

### 1. Excelファイルの準備

`data/students.xlsx` ファイルを作成し、以下の列を含めてください：

**詳細な項目一覧は [docs/EXCEL項目一覧.md](docs/EXCEL項目一覧.md) を参照してください。**

### 1-1. JSONファイルの生成（推奨）

ExcelファイルをJSONファイルに変換することで、読み込み速度が向上します：

```bash
python3 scripts/excel/convert_excel_to_json.py
```

これにより `data/students.json` が生成されます。ウェブサイトはJSONファイルを優先的に読み込み、存在しない場合はExcelファイルを読み込みます。

#### 必須項目
- **No**: 学生番号（1, 2, 3...）
- **所属学年**: メデ4
- **学籍番号**: 1522008など
- **氏名**: 岩舩　愛など
- **氏名英字**: AI IWAFUNEなど

#### 推奨項目
- **題目** または **研究題目**: 卒業研究の題目
- **画像パス** または **画像**: 画像ファイル名（例: `student1.jpg`）またはカンマ区切りの複数ファイル
- **レポートパス** または **レポート**: Wordファイル名（例: `report1.docx`）またはカンマ区切りの複数ファイル
- **プレゼンパス** または **プレゼン** または **プレゼンテーション**: PPTXファイル名（例: `presentation1.pptx`）またはカンマ区切りの複数ファイル

### 2. ファイルの配置

1. **画像ファイル**: `assets/images/学籍番号/` フォルダに配置（例: `assets/images/1522008/image6.png`）
2. **レポートPDFファイル**: `assets/reports/pdf/` フォルダに配置（ファイル名: `学籍番号.pdf`）
3. **プレゼン資料PDFファイル**: `assets/presentations/master/pdf/` フォルダに配置（ファイル名: `学籍番号.pdf`）
4. **Hero動画ファイル**: `assets/hero/videos/` フォルダに配置（オプション）

### 3. ローカルサーバーの起動

ブラウザのセキュリティ制限により、ローカルファイルを直接開くことはできません。以下のいずれかの方法でローカルサーバーを起動してください：

#### Python 3を使用する場合

```bash
cd "/Users/takawo/Library/CloudStorage/Dropbox/260126卒業研究発表_資料ウェブサイト"
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` にアクセス

#### Node.jsを使用する場合

```bash
# http-serverをインストール（初回のみ）
npm install -g http-server

# サーバーを起動
cd "/Users/takawo/Library/CloudStorage/Dropbox/260126卒業研究発表_資料ウェブサイト"
http-server -p 8000
```

ブラウザで `http://localhost:8000` にアクセス

#### VS CodeのLive Server拡張機能を使用する場合

1. VS Codeでこのフォルダを開く
2. `index.html` を右クリック
3. "Open with Live Server" を選択

## 使用方法

1. メインページ（`index.html`）で学生一覧を確認
   - カード表示と表表示を切り替え可能
   - タグによるフィルタリング機能
   - Heroセクションに動画背景とランダムテキスト表示
2. 学生カードをクリックして詳細ページへ遷移
3. 詳細ページで以下を確認・閲覧：
   - 基本情報（学籍番号、氏名、氏名英字）
   - 卒業研究題目
   - 研究タグ（技術・手法、ジャンル・形式、テーマ・領域に分類）
   - プレゼンテーション資料（PDFビューアーで表示、ページ送り、ズーム機能付き）
   - レポート（PDFビューアーで表示、見開き表示対応）

## 機能

### データ管理
- ✅ ExcelファイルまたはJSONファイルからの自動データ読み込み（JSON優先）
- ✅ ExcelからJSONへの自動変換スクリプト（`scripts/excel/convert_excel_to_json.py`）
- ✅ ローカルストレージによるデータキャッシュ

### UI/UX機能
- ✅ レスポンシブデザイン（モバイル対応）
- ✅ カード表示と表表示の切り替え
- ✅ タグによるフィルタリング（技術・手法、ジャンル・形式、テーマ・領域に分類）
- ✅ Heroセクションの動画背景（WebGLシェーダーエフェクト対応）
- ✅ Heroセクションのランダムテキストアニメーション
- ✅ QRコード表示（発表資料・レポート閲覧用）
- ✅ スムーズスクロールとナビゲーション

### PDF表示機能
- ✅ PDF.jsを使用したブラウザ内PDFビューアー
- ✅ プレゼンテーション資料の単ページ表示（ページ送り、ズーム機能）
- ✅ レポートの見開き表示対応（2ページ目以降）
- ✅ キーボードショートカット対応（矢印キーでページ送り）

### その他の機能
- ✅ 年度別個人情報表示制御（`data/config.json`で年度ごとに管理）
- ✅ 氏名非表示機能（発表会後、年度ごとに自動的に個人情報を非表示）
- ✅ GitHub Actionsによる自動デプロイ（GitHub Pages）
- ✅ モバイルデバイスでのシェーダー効果自動無効化（パフォーマンス最適化）

### 年度管理機能
- ✅ 年度別設定ファイルによる個人情報表示制御（`data/config.json`）
- ✅ 年度更新用スクリプト（`scripts/manage_year.py`）
- ✅ 発表会日を設定すると自動的に個人情報を非表示
- ✅ 過去年度のデータをアーカイブに移動可能

詳細は [docs/個人情報保護と年度管理ガイド.md](docs/個人情報保護と年度管理ガイド.md) を参照してください。

## 注意事項

1. **ローカルサーバー必須**: ブラウザのセキュリティ制限により、`file://` プロトコルでは動作しません。必ずローカルサーバーを使用してください。

2. **JSONファイル必須**: `data/students.json` ファイルが必須です。Excelファイルから生成する場合は、`scripts/excel/convert_excel_to_json.py` を実行してください。

3. **ファイルパス**: JSONファイル内のファイルパスは、ファイル名のみを指定してください（例: `image6.png`）。フルパスは不要です。

4. **PDFファイル**: レポートとプレゼンテーション資料はPDF形式で配置してください。ブラウザ内でPDF.jsを使用して表示されます。

5. **画像ファイルの配置**: 画像ファイルは `assets/images/学籍番号/` フォルダに配置してください（例: `assets/images/1522008/image6.png`）。

6. **モバイル対応**: モバイルデバイスでは、パフォーマンス最適化のためWebGLシェーダー効果が自動的に無効化されます。通常の動画表示にフォールバックします。

7. **GitHub Pagesデプロイ**: `main`ブランチにpushすると、GitHub Actionsが自動的にデプロイを実行します。

## トラブルシューティング

### JSONファイルが読み込めない

- `data/students.json` が正しく配置されているか確認
- JSONファイルの形式が正しいか確認（JSON Lintなどで検証）
- ローカルサーバーが起動しているか確認
- ブラウザのコンソールでエラーメッセージを確認

### 画像が表示されない

- ファイルパスが正しいか確認（`assets/images/学籍番号/ファイル名`）
- JSONファイル内の`imagePath`が正しいか確認
- ファイルが正しいフォルダに存在するか確認
- ファイル名に日本語や特殊文字が含まれていないか確認

### PDFが表示されない

- PDFファイルが `assets/reports/pdf/` または `assets/presentations/master/pdf/` に存在するか確認
- JSONファイル内の`reportPath`または`presentationPath`が正しいか確認（例: `1522008.pdf`）
- ブラウザのコンソールでエラーメッセージを確認
- PDF.jsの読み込みエラーがないか確認

### Hero動画が表示されない

- 動画ファイルが `assets/hero/videos/` に存在するか確認
- JSONファイル内の`heroVideo`が正しいか確認（例: `1522008.mp4`）
- ブラウザが動画形式（MP4）をサポートしているか確認
- モバイルデバイスの場合、シェーダー効果は無効化されます（正常な動作）

### GitHub Pagesが更新されない

- GitHub Actionsのワークフローが成功しているか確認（リポジトリの「Actions」タブ）
- `main`ブランチにpushされているか確認
- GitHub Pagesの設定が正しいか確認（Settings > Pages）

## 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **UIフレームワーク**: Bootstrap 5.3.2
- **PDF表示**: PDF.js 3.11.174
- **WebGLシェーダー**: カスタム実装（hero-shader.js）
- **デプロイ**: GitHub Actions + GitHub Pages
- **データ形式**: JSON

## スクリプト

管理用のPythonスクリプトは `scripts/` ディレクトリにあります。詳細は [scripts/README.md](scripts/README.md) を参照してください。

主なスクリプト：
- `scripts/excel/convert_excel_to_json.py`: ExcelからJSONへの変換
- `scripts/convert/process_hero_videos.py`: Hero動画の最適化
- `scripts/convert/process_final_presentations.py`: プレゼンテーションPDF変換
- `scripts/manage_year.py`: ⭐ **年度管理スクリプト** - 年度ごとの個人情報表示制御を管理
- `scripts/cleanup_unused_files.py`: 不要ファイルの削除

### 年度管理スクリプトの使用例

```bash
# 設定を確認
python scripts/manage_year.py show-config

# 新年度を追加（2026年度、発表会日: 2027-01-27）
python scripts/manage_year.py add-year --year 2026 --presentation-date 2027-01-27

# 発表会後に個人情報を非表示にする
python scripts/manage_year.py hide-info --year 2025

# 年度データをアーカイブに移動
python scripts/manage_year.py archive --year 2025
```

## ライセンス

このプロジェクトは教育目的で作成されています。
