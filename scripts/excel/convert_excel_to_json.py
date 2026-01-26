#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ExcelファイルをJSONファイルに変換するスクリプト

使用方法:
    python3 scripts/excel/convert_excel_to_json.py

出力:
    data/students.json
"""

import json
import os
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("エラー: openpyxlがインストールされていません。")
    print("インストール方法: pip install openpyxl")
    sys.exit(1)

# プロジェクトルートのパス
PROJECT_ROOT = Path(__file__).parent.parent.parent
EXCEL_FILE = PROJECT_ROOT / 'data' / 'students.xlsx'
JSON_FILE = PROJECT_ROOT / 'data' / 'students.json'


def convert_excel_to_json():
    """ExcelファイルをJSONファイルに変換"""
    
    # Excelファイルの存在確認
    if not EXCEL_FILE.exists():
        print(f"エラー: Excelファイルが見つかりません: {EXCEL_FILE}")
        sys.exit(1)
    
    print(f"Excelファイルを読み込んでいます: {EXCEL_FILE}")
    
    # Excelファイルを開く
    try:
        workbook = openpyxl.load_workbook(EXCEL_FILE, data_only=True)
        worksheet = workbook.active
        
        # ヘッダー行を取得
        headers = []
        for cell in worksheet[1]:
            headers.append(cell.value if cell.value else '')
        
        # データ行を取得
        students_data = []
        for row in worksheet.iter_rows(min_row=2, values_only=False):
            # 空行をスキップ
            if not any(cell.value for cell in row):
                continue
            
            # 行データを辞書に変換
            row_data = {}
            for i, cell in enumerate(row):
                header = headers[i] if i < len(headers) else f'Column{i+1}'
                value = cell.value if cell.value else ''
                row_data[header] = value
            
            # タグを配列に変換
            tag_string = row_data.get('タグ', '') or row_data.get('キーワード', '')
            tags = [tag.strip() for tag in str(tag_string).split(',') if tag.strip()]
            
            # 正規化されたデータ構造
            student = {
                'id': row_data.get('No', ''),
                'grade': row_data.get('所属学年', ''),
                'studentId': row_data.get('学籍番号', ''),
                'name': row_data.get('氏名', ''),
                'nameEn': row_data.get('氏名英字', ''),
                'title': row_data.get('題目', '') or row_data.get('研究題目', ''),
                'imagePath': row_data.get('画像パス', '') or row_data.get('画像', ''),
                'reportPath': row_data.get('レポートパス', '') or row_data.get('レポート', ''),
                'presentationPath': row_data.get('プレゼンパス', '') or row_data.get('プレゼン', '') or row_data.get('プレゼンテーション', ''),
                'heroVideo': row_data.get('hero動画', '') or row_data.get('Hero動画', '') or row_data.get('Hero Video', ''),
                'tags': tags
            }
            
            students_data.append(student)
        
        # JSONファイルに書き出し
        print(f"JSONファイルに書き出しています: {JSON_FILE}")
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(students_data, f, ensure_ascii=False, indent=2)
        
        print(f"✓ 変換完了: {len(students_data)}件の学生データをJSONファイルに出力しました")
        print(f"  出力先: {JSON_FILE}")
        
    except Exception as e:
        print(f"エラー: Excelファイルの読み込みに失敗しました: {e}")
        sys.exit(1)


if __name__ == '__main__':
    convert_excel_to_json()
