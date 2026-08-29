#!/bin/bash

# このスクリプトは、各画像にoverlay.pngを重ねて新しいフォルダに出力します

OVERLAY_FILE="/Users/takawo/Library/CloudStorage/Dropbox/260126卒業研究発表_資料ウェブサイト/docs/design/1x/overlay.png"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/overlayed"

cd "$SCRIPT_DIR"

# overlay.pngが存在するか確認
if [ ! -f "$OVERLAY_FILE" ]; then
    echo "エラー: $OVERLAY_FILE が見つかりません"
    exit 1
fi

# 出力フォルダを作成
mkdir -p "$OUTPUT_DIR"

# ImageMagickがインストールされているか確認
if ! command -v magick &> /dev/null; then
    echo "エラー: ImageMagickがインストールされていません"
    exit 1
fi

# 各JPGファイルにoverlayを適用（_overlay.jpgで終わるファイルは除外）
for img in 1522074_ページ_*.jpg; do
    # _overlay.jpgで終わるファイルはスキップ
    if [[ "$img" == *_overlay.jpg ]]; then
        continue
    fi
    
    if [ -f "$img" ]; then
        # 出力ファイル名: 元のファイル名をそのまま使用
        output="$OUTPUT_DIR/$img"
        
        echo "処理中: $img -> $output"
        
        # overlayを重ねる（中央配置）- compositeコマンドでシンプルに重ねる
        composite -gravity center "$OVERLAY_FILE" "$img" "$output"
        
        if [ $? -eq 0 ]; then
            echo "✓ 完了: $output"
        else
            echo "✗ エラー: $img の処理に失敗しました"
        fi
    fi
done

echo ""
echo "すべての処理が完了しました。出力先: $OUTPUT_DIR"
