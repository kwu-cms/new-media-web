#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用されていないファイルを削除するスクリプト
- students.jsonで指定されていない画像ファイル
- PPTXファイル（PDFに変換済み）
- 画像フォルダ内の動画・音声ファイル
- assets/movies/フォルダ
- 使用されていないhero/thumbnails/
"""

import json
import os
from pathlib import Path

# パス設定
SCRIPT_DIR = Path(__file__).parent.parent
ASSETS_DIR = SCRIPT_DIR / "assets"
STUDENTS_JSON = SCRIPT_DIR / "data" / "students.json"

# students.jsonを読み込む
with open(STUDENTS_JSON, 'r', encoding='utf-8') as f:
    students_data = json.load(f)

# 使用されているファイルを収集
used_images = {}
used_videos = set()

for student in students_data:
    student_id = student['studentId']
    # 使用されている画像（カンマ区切りの場合もある）
    if student.get('imagePath'):
        images = [img.strip() for img in student['imagePath'].split(',')]
        used_images[student_id] = images
    # 使用されている動画
    if student.get('heroVideo'):
        used_videos.add(student['heroVideo'])

print("=== 使用されているファイル ===")
print(f"画像: {used_images}")
print(f"動画: {used_videos}")
print()

deleted_count = 0
deleted_size = 0

# 1. 各学生フォルダ内の使用されていない画像ファイルを削除
print("=== 1. 使用されていない画像ファイルを削除 ===")
for student_id, used_imgs in used_images.items():
    student_image_dir = ASSETS_DIR / "images" / student_id
    if not student_image_dir.exists():
        continue
    
    for img_file in student_image_dir.iterdir():
        if img_file.is_file():
            # 画像ファイルのみを対象（.png, .jpg, .jpeg, .svg, .gif）
            if img_file.suffix.lower() in ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp']:
                if img_file.name not in used_imgs:
                    size = img_file.stat().st_size
                    print(f"  削除: {img_file.relative_to(SCRIPT_DIR)} ({size / 1024 / 1024:.2f} MB)")
                    img_file.unlink()
                    deleted_count += 1
                    deleted_size += size

# 2. PPTXファイルを削除
print("\n=== 2. PPTXファイルを削除 ===")
pptx_dirs = [
    ASSETS_DIR / "presentations" / "master" / "pptx",
    ASSETS_DIR / "presentations" / "rehearsal" / "pptx",
]

for pptx_dir in pptx_dirs:
    if not pptx_dir.exists():
        continue
    for pptx_file in pptx_dir.glob("*.pptx"):
        size = pptx_file.stat().st_size
        print(f"  削除: {pptx_file.relative_to(SCRIPT_DIR)} ({size / 1024 / 1024:.2f} MB)")
        pptx_file.unlink()
        deleted_count += 1
        deleted_size += size

# 3. 画像フォルダ内の動画・音声ファイルを削除
print("\n=== 3. 画像フォルダ内の動画・音声ファイルを削除 ===")
media_extensions = ['.mov', '.MOV', '.mp4', '.m4a', '.wdp']
for student_dir in (ASSETS_DIR / "images").iterdir():
    if not student_dir.is_dir():
        continue
    for media_file in student_dir.iterdir():
        if media_file.is_file() and media_file.suffix in media_extensions:
            size = media_file.stat().st_size
            print(f"  削除: {media_file.relative_to(SCRIPT_DIR)} ({size / 1024 / 1024:.2f} MB)")
            media_file.unlink()
            deleted_count += 1
            deleted_size += size

# 4. assets/movies/フォルダを削除
print("\n=== 4. assets/movies/フォルダを削除 ===")
movies_dir = ASSETS_DIR / "movies"
if movies_dir.exists():
    total_size = sum(f.stat().st_size for f in movies_dir.rglob('*') if f.is_file())
    print(f"  削除: {movies_dir.relative_to(SCRIPT_DIR)} ({total_size / 1024 / 1024:.2f} MB)")
    import shutil
    shutil.rmtree(movies_dir)
    deleted_count += 1
    deleted_size += total_size

# 5. 使用されていないhero/thumbnails/のサムネイルを削除
print("\n=== 5. 使用されていないhero/thumbnails/を削除 ===")
thumbnails_dir = ASSETS_DIR / "hero" / "thumbnails"
if thumbnails_dir.exists():
    # videos_info.jsonで使用されている動画名を取得
    videos_info_json = ASSETS_DIR / "hero" / "videos" / "videos_info.json"
    used_thumbnail_names = set()
    if videos_info_json.exists():
        with open(videos_info_json, 'r', encoding='utf-8') as f:
            videos_info = json.load(f)
            for video_info in videos_info:
                if 'processed' in video_info:
                    # 動画名からサムネイル名を推測（例: 1522008.mp4 -> 1522008.jpg）
                    video_name = video_info['processed']
                    base_name = Path(video_name).stem
                    used_thumbnail_names.add(f"{base_name}.jpg")
    
    # 実際に使用されている動画名からもサムネイル名を生成
    for video_name in used_videos:
        base_name = Path(video_name).stem
        used_thumbnail_names.add(f"{base_name}.jpg")
    
    for thumb_file in thumbnails_dir.glob("*.jpg"):
        if thumb_file.name not in used_thumbnail_names:
            size = thumb_file.stat().st_size
            print(f"  削除: {thumb_file.relative_to(SCRIPT_DIR)} ({size / 1024:.2f} KB)")
            thumb_file.unlink()
            deleted_count += 1
            deleted_size += size

# 6. rehearsal/pdf/フォルダを削除（master/pdfがあれば不要）
print("\n=== 6. rehearsal/pdf/フォルダを削除 ===")
rehearsal_pdf_dir = ASSETS_DIR / "presentations" / "rehearsal" / "pdf"
master_pdf_dir = ASSETS_DIR / "presentations" / "master" / "pdf"

if rehearsal_pdf_dir.exists() and master_pdf_dir.exists():
    # master/pdfに存在するファイルを確認
    master_pdfs = {f.name for f in master_pdf_dir.glob("*.pdf")}
    
    # rehearsal/pdf内のファイルを確認
    rehearsal_pdfs = list(rehearsal_pdf_dir.glob("*.pdf"))
    
    if rehearsal_pdfs:
        total_size = sum(f.stat().st_size for f in rehearsal_pdfs)
        print(f"  削除: {rehearsal_pdf_dir.relative_to(SCRIPT_DIR)} ({total_size / 1024 / 1024:.2f} MB)")
        import shutil
        shutil.rmtree(rehearsal_pdf_dir)
        deleted_count += len(rehearsal_pdfs)
        deleted_size += total_size

print("\n=== 削除完了 ===")
print(f"削除ファイル数: {deleted_count}")
print(f"削除サイズ: {deleted_size / 1024 / 1024:.2f} MB")
