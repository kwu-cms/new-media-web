#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
zipフォルダ内の構造を平坦化するスクリプト
zip > 学籍番号フォルダ > 学籍番号フォルダ > 画像ファイル
を
zip > 学籍番号フォルダ > 画像ファイル
に変更
"""

import os
import shutil
import sys
from pathlib import Path
import re

# パス設定
ZIP_DIR = Path("assets/presentations/zip")

def flatten_student_folder(student_id, student_folder):
    """学籍番号フォルダ内の構造を平坦化"""
    print(f"\n処理中: {student_id}")
    
    # 内側の学籍番号フォルダを探す
    inner_folder = student_folder / student_id
    
    if not inner_folder.exists() or not inner_folder.is_dir():
        print(f"  ⚠️  内側の学籍番号フォルダが見つかりません: {inner_folder}")
        return False
    
    print(f"  ✓ 内側のフォルダを発見: {inner_folder}")
    
    # 内側のフォルダ内のすべてのファイル・フォルダを親フォルダに移動
    moved_count = 0
    for item in inner_folder.iterdir():
        try:
            dest = student_folder / item.name
            # 既に同名のファイル・フォルダが存在する場合はスキップ
            if dest.exists():
                print(f"  ⚠️  スキップ（既に存在）: {item.name}")
                continue
            
            shutil.move(str(item), str(dest))
            moved_count += 1
            print(f"  ✓ 移動: {item.name}")
        except Exception as e:
            print(f"  ✗ 移動エラー ({item.name}): {e}")
    
    # 内側のフォルダを削除
    try:
        inner_folder.rmdir()
        print(f"  ✓ 内側のフォルダを削除: {student_id}/{student_id}")
    except Exception as e:
        print(f"  ✗ フォルダ削除エラー: {e}")
        # フォルダが空でない場合は強制削除
        try:
            shutil.rmtree(inner_folder)
            print(f"  ✓ フォルダを強制削除")
        except Exception as e2:
            print(f"  ✗ 強制削除も失敗: {e2}")
            return False
    
    print(f"  ✓ 完了: {moved_count}個のアイテムを移動")
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
            if flatten_student_folder(student_id, student_folder):
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
        files = list(student_folder.iterdir())
        file_count = len([f for f in files if f.is_file()])
        dir_count = len([f for f in files if f.is_dir()])
        print(f"  {student_id}/ - {file_count}個のファイル, {dir_count}個のフォルダ")

if __name__ == "__main__":
    main()
