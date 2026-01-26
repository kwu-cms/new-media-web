#!/bin/bash
# ffmpegを使用して画像のサイズを固定するスクリプト

# 設定
TARGET_WIDTH=1200
TARGET_HEIGHT=""  # 空の場合はアスペクト比を保持
QUALITY=85

# 画像ディレクトリ
IMAGES_DIR="assets/images"

# ffmpegがインストールされているか確認
if ! command -v ffmpeg &> /dev/null; then
    echo "エラー: ffmpegがインストールされていません"
    echo "インストール方法: brew install ffmpeg"
    exit 1
fi

echo "画像のリサイズ処理を開始します（ffmpeg使用）"
echo "目標サイズ: 幅 ${TARGET_WIDTH}px"
if [ -n "$TARGET_HEIGHT" ]; then
    echo "高さ: ${TARGET_HEIGHT}px"
else
    echo "高さ: アスペクト比を保持"
fi
echo "============================================================"

# 各学生フォルダを処理
for student_dir in "$IMAGES_DIR"/*/; do
    if [ ! -d "$student_dir" ]; then
        continue
    fi
    
    student_id=$(basename "$student_dir")
    
    # 学籍番号かどうか確認
    if [[ ! "$student_id" =~ ^[0-9]+$ ]]; then
        continue
    fi
    
    echo ""
    echo "$student_id:"
    
    # 画像ファイルを処理
    for img_file in "$student_dir"*.{jpg,jpeg,png,gif,webp} 2>/dev/null; do
        if [ ! -f "$img_file" ]; then
            continue
        fi
        
        filename=$(basename "$img_file")
        output_file="$student_dir$filename"
        
        # サイズ指定を構築
        if [ -n "$TARGET_HEIGHT" ]; then
            scale_filter="scale=${TARGET_WIDTH}:${TARGET_HEIGHT}:force_original_aspect_ratio=decrease,pad=${TARGET_WIDTH}:${TARGET_HEIGHT}:(ow-iw)/2:(oh-ih)/2"
        else
            scale_filter="scale=${TARGET_WIDTH}:-1"
        fi
        
        # ffmpegでリサイズ
        if ffmpeg -i "$img_file" -vf "$scale_filter" -q:v "$QUALITY" -y "$output_file" 2>/dev/null; then
            echo "  ✓ $filename"
        else
            echo "  ✗ $filename: エラー"
        fi
    done
done

echo ""
echo "============================================================"
echo "処理完了"
