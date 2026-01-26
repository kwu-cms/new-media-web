#!/usr/bin/env python3
"""
画像のサイズを固定するスクリプト
Pillowを使用して画像をリサイズします

処理内容:
- フォーマットをPNGに統一
- サイズを1280x1080に統一
- アスペクト比が異なる場合はレターボックス（左右に黒帯）で中央配置
- 10KB以下のファイルは削除
"""

import os
from pathlib import Path
from PIL import Image

# 設定
TARGET_WIDTH = 1280  # 目標幅（px）
TARGET_HEIGHT = 1080  # 目標高さ（px）
OUTPUT_FORMAT = 'PNG'  # PNGに統一
MIN_FILE_SIZE = 10 * 1024  # 10KB（バイト）

def resize_image(input_path, output_path, target_width, target_height, output_format='PNG'):
    """
    画像をリサイズしてレターボックス形式で中央配置
    
    Args:
        input_path: 入力画像のパス
        output_path: 出力画像のパス
        target_width: 目標幅
        target_height: 目標高さ
        output_format: 出力フォーマット
    """
    try:
        img = Image.open(input_path)
        
        # 元のサイズを取得
        original_size = img.size
        original_format = img.format
        
        # アスペクト比を保持してリサイズ
        # 目標サイズ内に収まるようにスケール
        ratio = min(target_width / original_size[0], target_height / original_size[1])
        new_width = int(original_size[0] * ratio)
        new_height = int(original_size[1] * ratio)
        
        # リサイズ
        resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # 固定サイズのキャンバスを作成（黒背景）
        if resized_img.mode == 'RGBA':
            canvas = Image.new('RGBA', (target_width, target_height), (0, 0, 0, 255))
        else:
            # RGBに変換してから黒背景のキャンバスを作成
            if resized_img.mode != 'RGB':
                resized_img = resized_img.convert('RGB')
            canvas = Image.new('RGB', (target_width, target_height), (0, 0, 0))
        
        # 中央に配置（レターボックス）
        x_offset = (target_width - new_width) // 2
        y_offset = (target_height - new_height) // 2
        
        if resized_img.mode == 'RGBA':
            canvas.paste(resized_img, (x_offset, y_offset), resized_img)
        else:
            canvas.paste(resized_img, (x_offset, y_offset))
        
        # PNGとして保存
        canvas.save(output_path, format=output_format, optimize=True)
        
        return True, original_size, canvas.size
    except Exception as e:
        return False, None, str(e)

def main():
    """メイン処理"""
    images_dir = Path("assets/images")
    
    if not images_dir.exists():
        print(f"エラー: {images_dir} が存在しません")
        return
    
    print("画像のリサイズ処理を開始します")
    print(f"目標サイズ: {TARGET_WIDTH}x{TARGET_HEIGHT}px")
    print(f"出力フォーマット: {OUTPUT_FORMAT}")
    print(f"最小ファイルサイズ: {MIN_FILE_SIZE // 1024}KB（それ以下は削除）")
    print("=" * 80)
    
    total_files = 0
    success_count = 0
    error_count = 0
    deleted_count = 0
    
    # 各学生フォルダを処理
    for student_dir in sorted(images_dir.iterdir()):
        if not student_dir.is_dir():
            continue
        
        student_id = student_dir.name
        if not student_id.isdigit():
            continue
        
        print(f"\n{student_id}:")
        
        # 画像ファイルを処理
        for img_file in sorted(os.listdir(student_dir)):
            # SVGはスキップ（ベクター画像のため）
            if img_file.lower().endswith('.svg'):
                continue
            
            if not img_file.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                continue
            
            input_path = student_dir / img_file
            
            # ファイルサイズを確認
            file_size = input_path.stat().st_size
            if file_size < MIN_FILE_SIZE:
                print(f"  🗑️  {img_file}: {file_size // 1024}KB（削除）")
                input_path.unlink()
                deleted_count += 1
                continue
            
            # 出力ファイル名を決定（PNGに統一）
            base_name = Path(img_file).stem
            output_path = student_dir / f"{base_name}.png"
            
            total_files += 1
            success, original_size, result = resize_image(
                input_path, 
                output_path, 
                TARGET_WIDTH, 
                TARGET_HEIGHT,
                OUTPUT_FORMAT
            )
            
            if success:
                success_count += 1
                # 元のファイルと出力ファイルが異なる場合は元のファイルを削除
                if input_path != output_path:
                    input_path.unlink()
                print(f"  ✓ {img_file}: {original_size[0]}x{original_size[1]} → {result[0]}x{result[1]} ({output_path.name})")
            else:
                error_count += 1
                print(f"  ✗ {img_file}: エラー - {result}")
    
    print("\n" + "=" * 80)
    print(f"処理完了:")
    print(f"  成功: {success_count}/{total_files}")
    print(f"  エラー: {error_count}/{total_files}")
    print(f"  削除（10KB以下）: {deleted_count}")

if __name__ == '__main__':
    main()
