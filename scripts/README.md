# スクリプト一覧

このディレクトリには、卒業研究発表資料ウェブサイトの管理用Pythonスクリプトが整理されています。

## ディレクトリ構造

```
scripts/
├── convert/          # ファイル変換スクリプト
├── excel/            # Excel操作スクリプト
├── organize/         # フォルダ整理スクリプト
└── utils/            # ユーティリティ/メインスクリプト
```

## 使用方法

すべてのスクリプトはプロジェクトルートから実行してください。

```bash
# プロジェクトルートから実行
python3 scripts/convert/convert_reports.py
python3 scripts/excel/create_excel_template.py
```

## スクリプト一覧

### convert/ - ファイル変換スクリプト

- **convert_reports.py**: WordレポートをPDFに変換し、学籍番号でリネーム
- **convert_presentations.py**: PPTXプレゼンテーションをPDFに変換し、学籍番号でリネーム
- **convert_presentations_to_pdf.py**: PPTXをPDFに変換（別バージョン）
- **extract_media_from_pptx.py**: PPTXファイルからメディアファイルを抽出
- **process_final_presentations.py**: ⭐ **本番PPTXファイル処理** - 本番のPPTXファイルを一括処理（PDF変換、リネーム、Excel更新）
- **process_hero_videos.py**: ⭐ **Hero動画処理** - Heroセクション用動画の最適化（リサイズ、フォーマット変換、サムネイル生成）

### excel/ - Excel操作スクリプト

- **create_excel_template.py**: Excel雛形ファイルを作成
- **update_excel_paths.py**: Excelファイルのプレゼンパスとレポートパスを自動設定
- **update_excel_with_images.py**: Excelファイルの画像パス列を更新

### organize/ - フォルダ整理スクリプト

- **cleanup_zip_folders.py**: zipフォルダ内の学籍番号フォルダを整理
- **flatten_zip_folders.py**: zipフォルダの階層構造をフラット化

### utils/ - ユーティリティ/メインスクリプト

- **process_presentations.py**: PPTXファイル処理の全工程を自動実行

## 本番プレゼンテーション処理（重要）

本番のPPTXファイルを15-30分で処理する場合は、以下を参照してください：

**詳細手順書**: [`FINAL_PRESENTATION_GUIDE.md`](./FINAL_PRESENTATION_GUIDE.md)

## Hero動画処理

Heroセクションで動画を再生する場合は、以下を参照してください：

**詳細手順書**: [`HERO_VIDEO_GUIDE.md`](./HERO_VIDEO_GUIDE.md)

**クイックスタート**:
```bash
# 1. 動画ファイルを配置
cp /path/to/videos/*.mp4 assets/movies/

# 2. スクリプトを実行
python3 scripts/convert/process_hero_videos.py

# 3. Excelの設定シートに「Hero動画パス」を追加
```

**クイックスタート**:
```bash
# 1. 本番PPTXファイルを配置
cp /path/to/final/*.pptx assets/presentations/final_input/

# 2. スクリプトを実行
python3 scripts/convert/process_final_presentations.py

# 3. 結果を確認
ls assets/presentations/rehearsal/pdf/*.pdf
```

## 注意事項

- すべてのスクリプトはプロジェクトルートからの相対パスを使用しています
- スクリプトは`Path(__file__).parent.parent.parent`でプロジェクトルートを自動検出します
- 実行前に必要なディレクトリ（`data/`, `assets/`など）が存在することを確認してください
- 本番処理スクリプトは、ファイル名に学籍番号（7桁の数字）が含まれている必要があります
