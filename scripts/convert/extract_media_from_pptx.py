#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PPTXファイルからmediaフォルダを抽出し、学籍番号フォルダに整理するスクリプト
本番ファイル: assets/presentations/master/*.pptx
出力先: assets/zip/学籍番号/
"""

import os
import re
import shutil
import sys
import zipfile
from pathlib import Path

# パス設定（プロジェクトルートからの相対パス）
SCRIPT_DIR = Path(__file__).parent.parent.parent
MASTER_DIR = SCRIPT_DIR / "assets" / "presentations" / "master"
ZIP_DIR = SCRIPT_DIR / "assets" / "zip"
TEMP_DIR = SCRIPT_DIR / "assets" / "presentations" / "temp_zip"
EXCEL_FILE = SCRIPT_DIR / "data" / "students.xlsx"

def extract_student_id_from_filename(filename):
    """ファイル名から学籍番号を抽出（7桁の数字）"""
    matches = re.findall(r'\d{7}', filename)
    if matches:
        return matches[0]
    return None

def get_student_ids_from_excel():
    """Excelファイルから学籍番号と氏名のマッピングを取得"""
    try:
        import openpyxl
        wb = openpyxl.load_workbook(EXCEL_FILE)
        ws = wb.active
        
        student_map = {}
        for row in ws.iter_rows(min_row=2, values_only=True):
            if row and len(row) > 3:
                student_id = str(row[2]).strip() if row[2] else None
                name = str(row[3]).strip() if row[3] else None
                if student_id and name:
                    student_map[student_id] = name
        
        return student_map
    except Exception as e:
        print(f"Excel読み込みエラー: {e}")
        return {}

def find_student_id_by_name(filename, student_map):
    """ファイル名に含まれる氏名から学籍番号を検索"""
    for student_id, name in student_map.items():
        if name in filename or name.replace('　', '') in filename.replace('　', ''):
            return student_id
    return None

def extract_media_from_pptx(pptx_path, student_id):
    """PPTXファイルからmediaフォルダを抽出"""
    try:
        # 一時ディレクトリを作成
        temp_extract_dir = TEMP_DIR / student_id
        temp_extract_dir.mkdir(parents=True, exist_ok=True)
        
        # PPTXファイルをZIPとして展開
        with zipfile.ZipFile(pptx_path, 'r') as zip_ref:
            zip_ref.extractall(temp_extract_dir)
        
        # ppt/mediaフォルダを探す
        media_folder = temp_extract_dir / "ppt" / "media"
        
        if not media_folder.exists():
            # 別の場所を探す
            for media_path in temp_extract_dir.rglob("media"):
                if media_path.is_dir():
                    media_folder = media_path
                    break
        
        if not media_folder.exists() or not media_folder.is_dir():
            print(f"  ✗ mediaフォルダが見つかりません")
            shutil.rmtree(temp_extract_dir, ignore_errors=True)
            return False
        
        # 学籍番号フォルダを作成
        student_folder = ZIP_DIR / student_id
        student_folder.mkdir(parents=True, exist_ok=True)
        
        # mediaフォルダの内容を学籍番号フォルダにコピー
        for item in media_folder.iterdir():
            dest = student_folder / item.name
            if item.is_dir():
                if dest.exists():
                    shutil.rmtree(dest)
                shutil.copytree(item, dest)
            else:
                if dest.exists():
                    dest.unlink()
                shutil.copy2(item, dest)
        
        # 一時ファイルを削除
        shutil.rmtree(temp_extract_dir, ignore_errors=True)
        
        return True
    except Exception as e:
        print(f"  ✗ 抽出エラー: {e}")
        # 一時ファイルをクリーンアップ
        temp_extract_dir = TEMP_DIR / student_id
        if temp_extract_dir.exists():
            shutil.rmtree(temp_extract_dir, ignore_errors=True)
        return False

def main():
    # ディレクトリの確認
    if not MASTER_DIR.exists():
        print(f"エラー: {MASTER_DIR} が見つかりません")
        print(f"本番PPTXファイルを {MASTER_DIR} に配置してください")
        sys.exit(1)
    
    # 出力ディレクトリの作成
    ZIP_DIR.mkdir(parents=True, exist_ok=True)
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    
    # Excelから学生情報を取得
    student_map = get_student_ids_from_excel()
    if student_map:
        print(f"Excelから {len(student_map)} 名の学生情報を読み込みました\n")
    
    # PPTXファイルを検索
    pptx_files = list(MASTER_DIR.glob("*.pptx"))
    ppt_files = list(MASTER_DIR.glob("*.ppt"))
    all_files = pptx_files + ppt_files
    
    # 一時ファイルを除外
    all_files = [f for f in all_files if not f.name.startswith("~$")]
    
    print(f"見つかったプレゼンテーションファイル: {len(all_files)}個\n")
    
    if len(all_files) == 0:
        print("処理するファイルがありません。")
        return
    
    extracted_count = 0
    failed_count = 0
    
    # 各PPTXファイルからmediaを抽出
    for pptx_file in all_files:
        # ファイル名から学籍番号を抽出
        student_id = extract_student_id_from_filename(pptx_file.name)
        
        # 学籍番号が見つからない場合は、氏名から検索
        if not student_id:
            student_id = find_student_id_by_name(pptx_file.name, student_map)
            if student_id:
                print(f"⚠️  氏名から学籍番号を検出: {pptx_file.name} → {student_id}")
            else:
                print(f"⚠️  スキップ: {pptx_file.name} (学籍番号が見つかりません)")
                failed_count += 1
                continue
        
        print(f"処理中: {pptx_file.name} → {student_id}/")
        
        if extract_media_from_pptx(pptx_file, student_id):
            # ファイル数をカウント
            student_folder = ZIP_DIR / student_id
            file_count = len(list(student_folder.rglob("*"))) - len(list(student_folder.rglob("*/")))
            print(f"  ✓ 抽出完了: {file_count}個のファイル")
            extracted_count += 1
        else:
            failed_count += 1
    
    # 一時ディレクトリをクリーンアップ
    if TEMP_DIR.exists():
        try:
            shutil.rmtree(TEMP_DIR)
            print(f"\n✓ 一時ファイルをクリーンアップしました")
        except Exception as e:
            print(f"\n⚠️  一時ファイルのクリーンアップでエラー: {e}")
    
    print(f"\n{'='*50}")
    print(f"処理完了:")
    print(f"  成功: {extracted_count}個")
    print(f"  失敗: {failed_count}個")
    print(f"{'='*50}\n")
    
    # 最終的な構造を確認
    student_folders = sorted([d for d in ZIP_DIR.iterdir() if d.is_dir()])
    if student_folders:
        print("抽出された画像フォルダ:")
        for student_folder in student_folders:
            file_count = len(list(student_folder.rglob("*"))) - len(list(student_folder.rglob("*/")))
            print(f"  {student_folder.name}/ - {file_count}個のファイル")

if __name__ == "__main__":
    main()
