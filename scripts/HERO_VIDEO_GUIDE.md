# Hero動画処理手順書

Heroセクションで動画を再生するための動画処理手順です。

## 前提条件

- ffmpegがインストールされていること
  - macOS: `brew install ffmpeg`
  - Ubuntu: `sudo apt-get install ffmpeg`
  - 確認: `which ffmpeg`

## 手順

### 1. 動画ファイルの準備（5分）

1. 動画ファイルを以下のフォルダに配置します：
   ```
   assets/movies/
   ```

2. 対応フォーマット: `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`, `.m4v`

### 2. スクリプトの実行（10-20分）

プロジェクトルートから以下のコマンドを実行：

```bash
python3 scripts/convert/process_hero_videos.py
```

スクリプトは自動的に以下を実行します：
1. 動画ファイルを検索（`assets/movies/` から読み込み）
2. 1920x1080にリサイズ（アスペクト比を維持し、余白を追加）
3. MP4形式に変換（H.264コーデック）
4. Web用に最適化（faststartフラグ）
5. 最大60秒に切り詰め（設定可能）
6. サムネイル画像を生成
7. `assets/hero/videos/` に処理済み動画を配置
8. `assets/hero/thumbnails/` にサムネイルを配置

**重要**: 元の動画ファイルは `assets/movies/` にそのまま残ります（非破壊処理）

### 3. Excelファイルの設定（5分）

1. `data/students.xlsx` を開く
2. 「設定」シートを作成（存在しない場合）
3. 「Hero動画パス」列を追加
4. 動画ファイル名を入力（例: `video1.mp4`）

**設定シートの例**:
```
| Hero画像パス | Hero動画パス |
|-------------|-------------|
| hero-bg.jpg | video1.mp4  |
```

### 4. ウェブサイトの確認（5分）

1. ウェブサイトをリロード
2. Heroセクションで動画が自動再生されることを確認
3. 動画は自動的にループ再生されます

## 動画設定のカスタマイズ

`scripts/convert/process_hero_videos.py` の以下の変数を変更することで設定を調整できます：

```python
VIDEO_WIDTH = 1920      # 幅（px）
VIDEO_HEIGHT = 1080     # 高さ（px）
VIDEO_BITRATE = "5000k" # ビットレート
VIDEO_FPS = 30          # フレームレート
MAX_DURATION = 60       # 最大再生時間（秒、0の場合は無制限）
```

## トラブルシューティング

### ffmpegが見つからない場合

**症状**: `エラー: ffmpegが見つかりません`

**対処法**:
```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt-get install ffmpeg

# 確認
which ffmpeg
```

### 動画が表示されない場合

**症状**: Heroセクションに動画が表示されない

**対処法**:
1. Excelファイルの「設定」シートに「Hero動画パス」が正しく設定されているか確認
2. ブラウザのコンソールでエラーを確認（F12キー）
3. 動画ファイルが `assets/hero/videos/` に存在するか確認
4. 動画ファイルのパスが正しいか確認

### 動画のサイズが大きすぎる場合

**症状**: 動画の読み込みが遅い

**対処法**:
1. `VIDEO_BITRATE` を下げる（例: `"3000k"`）
2. `MAX_DURATION` を短くする（例: `30`）
3. 動画の解像度を下げる（例: `VIDEO_WIDTH = 1280`, `VIDEO_HEIGHT = 720`）

### 動画がループしない場合

**症状**: 動画が1回再生されたら止まる

**対処法**:
- HTMLの `<video>` タグに `loop` 属性が設定されているか確認
- ブラウザの自動再生ポリシーを確認（一部のブラウザではユーザー操作が必要）

## パフォーマンス最適化

- **ファイルサイズ**: 1ファイルあたり10-20MB以下を推奨
- **再生時間**: 30-60秒程度が最適
- **フォーマット**: MP4（H.264）が最も互換性が高い
- **ビットレート**: 5000k以下を推奨

## 注意事項

- **非破壊処理**: 元の動画ファイルは `assets/movies/` にそのまま残ります。処理済み動画は `assets/hero/videos/` に別途作成されます
- **自動再生**: 動画は `muted` 属性で自動再生されます（音声なし）
- **ループ**: 動画は自動的にループ再生されます
- **モバイル**: `playsinline` 属性により、モバイルデバイスでもインライン再生されます
- **ストレージ**: 処理済み動画と元の動画の両方が保存されるため、ストレージ容量に注意してください

## 複数動画の処理

複数の動画を一度に処理する場合：

```bash
# 1. すべての動画ファイルをmoviesフォルダに配置
cp /path/to/videos/*.mp4 assets/movies/

# 2. スクリプトを実行
python3 scripts/convert/process_hero_videos.py

# 3. 結果を確認
ls assets/hero/videos/*.mp4
ls assets/hero/thumbnails/*.jpg
```

## 手動処理

スクリプトが使用できない場合の手動処理手順：

1. **動画をリサイズ・変換**
   ```bash
   ffmpeg -i input.mp4 -vf scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2 -c:v libx264 -preset medium -crf 23 -b:v 5000k -movflags +faststart output.mp4
   ```

2. **動画ファイルを配置**
   - `assets/hero/videos/` フォルダに配置

3. **Excelファイルを更新**
   - 「設定」シートの「Hero動画パス」列にファイル名を入力
