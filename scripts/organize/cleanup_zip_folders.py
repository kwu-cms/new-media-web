#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
zipフォルダ内の学籍番号フォルダを整理し、mediaフォルダのみを残して学籍番号名にリネームするスクリプト
"""

import os
import shutil
import sys
from pathlib import Path
import re

# パス設定（プロジェクトルートからの相対パス）
SCRIPT_DIR = Path(__file__).parent.parent.parent
ZIP_DIR = SCRIPT_DIR / "assets" / "presentations" / "zip"

def find_media_folder(student_folder):
    """学籍番号フォルダ内のmediaフォルダを検索"""
    # ppt/media を探す
    ppt_media = student_folder / "ppt" / "media"
    if ppt_media.exists() and ppt_media.is_dir():
        return ppt_media
    
    # 直接 media フォルダを探す
    media = student_folder / "media"
    if media.exists() and media.is_dir():
        return media
    
    # 再帰的に media フォルダを探す
    for media_folder in student_folder.rglob("media"):
        if media_folder.is_dir():
            return media_folder
    
    return None

def cleanup_student_folder(student_id, student_folder):
    """学籍番号フォルダを整理"""
    print(f"\n処理中: {student_id}")
    
    # mediaフォルダを検索
    media_folder = find_media_folder(student_folder)
    
    if not media_folder:
        print(f"  ⚠️  mediaフォルダが見つかりません: {student_folder}")
        return False
    
    print(f"  ✓ mediaフォルダを発見: {media_folder}")
    
    # 一時的な場所にmediaフォルダを移動
    temp_media = student_folder.parent / f"temp_{student_id}_media"
    shutil.move(str(media_folder), str(temp_media))
    print(f"  ✓ mediaフォルダを一時的に移動")
    
    # 学籍番号フォルダ内のすべてのファイル・フォルダを削除
    for item in student_folder.iterdir():
        if item.name.startswith("temp_"):
            continue
        try:
            if item.is_dir():
                shutil.rmtree(item)
                print(f"  ✓ フォルダを削除: {item.name}")
            else:
                item.unlink()
                print(f"  ✓ ファイルを削除: {item.name}")
        except Exception as e:
            print(f"  ✗ 削除エラー ({item.name}): {e}")
    
    # 学籍番号名のフォルダを作成してmediaを移動
    new_media_folder = student_folder / student_id
    temp_media.rename(new_media_folder)
    print(f"  ✓ mediaフォルダを {student_id}/{student_id} にリネーム")
    
    return True

def main():
    # ディレクトリの確認
    if not ZIP_DIR.exists():
        print(f"エラー: {ZIP_DIR} が見つかりません")
        sys.exit(1)
    
    # 学籍番号フォルダを検索（7桁の数字）
    student_folders = []
    for item in ZIP_DIR.iterdir():
        if item.is_dir() and re.match(r'^\d{7}$', item.name):
            student_folders.append((item.name, item))
    
    if not student_folders:
        print("学籍番号フォルダが見つかりません")
        sys.exit(1)
    
    print(f"見つかった学籍番号フォルダ: {len(student_folders)}個")
    print(f"{'='*50}")
    
    success_count = 0
    failed_count = 0
    
    for student_id, student_folder in sorted(student_folders):
        try:
            if cleanup_student_folder(student_id, student_folder):
                success_count += 1
            else:
                failed_count += 1
        except Exception as e:
            print(f"  ✗ エラー: {e}")
            failed_count += 1
    
    print(f"\n{'='*50}")
    print(f"処理完了:")
    print(f"  成功: {success_count}個")
    print(f"  失敗: {failed_count}個")
    print(f"{'='*50}\n")
    
    # 最終的な構造を確認
    print("最終的な構造:")
    for student_id, student_folder in sorted(student_folders):
        media_path = student_folder / student_id
        if media_path.exists():
            file_count = len(list(media_path.rglob("*"))) - len(list(media_path.rglob("*/")))
            print(f"  {student_id}/{student_id}/ - {file_count}個のファイル")

if __name__ == "__main__":
    main()
