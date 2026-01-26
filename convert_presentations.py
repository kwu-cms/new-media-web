#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
プレゼンテーションファイルをPDFに変換し、学籍番号でリネームするスクリプト
"""

import os
import re
import subprocess
import sys
from pathlib import Path

# パス設定
PRESENTATIONS_DIR = Path("assets/presentations")
EXCEL_FILE = Path("data/students.xlsx")

def check_libreoffice():
    """LibreOfficeが利用可能か確認"""
    for cmd in ['libreoffice', 'soffice']:
        try:
            result = subprocess.run(['which', cmd], capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip()
        except:
            pass
    return None

def convert_pptx_to_pdf_libreoffice(pptx_path, output_dir):
    """LibreOfficeを使用してPPTXをPDFに変換"""
    libreoffice_path = check_libreoffice()
    if not libreoffice_path:
        return False
    
    try:
        # LibreOfficeで変換（--headless: GUIなし、--convert-to: 変換形式、--outdir: 出力ディレクトリ）
        cmd = [
            libreoffice_path,
            '--headless',
            '--convert-to', 'pdf',
            '--outdir', str(output_dir),
            str(pptx_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        return result.returncode == 0
    except Exception as e:
        print(f"LibreOffice変換エラー: {e}")
        return False

def extract_student_id_from_filename(filename):
    """ファイル名から学籍番号を抽出（7桁の数字）"""
    # ファイル名内の7桁の数字を検索
    matches = re.findall(r'\d{7}', filename)
    if matches:
        return matches[0]  # 最初に見つかった7桁の数字を返す
    return None

def get_student_ids_from_excel():
    """Excelファイルから学籍番号と氏名のマッピングを取得"""
    try:
        import openpyxl
        wb = openpyxl.load_workbook(EXCEL_FILE)
        ws = wb.active
        
        student_map = {}
        # ヘッダー行をスキップして2行目から読み込み
        for row in ws.iter_rows(min_row=2, values_only=True):
            if row and len(row) > 3:
                student_id = str(row[2]).strip() if row[2] else None  # 学籍番号
                name = str(row[3]).strip() if row[3] else None  # 氏名
                if student_id and name:
                    student_map[student_id] = name
        
        return student_map
    except Exception as e:
        print(f"Excel読み込みエラー: {e}")
        return {}

def find_student_id_by_name(filename, student_map):
    """ファイル名に含まれる氏名から学籍番号を検索"""
    for student_id, name in student_map.items():
        # 氏名の一部がファイル名に含まれているか確認
        if name in filename or name.replace('　', '') in filename.replace('　', ''):
            return student_id
    return None

def main():
    # ディレクトリの確認
    if not PRESENTATIONS_DIR.exists():
        print(f"エラー: {PRESENTATIONS_DIR} が見つかりません")
        sys.exit(1)
    
    # LibreOfficeの確認
    libreoffice_path = check_libreoffice()
    if not libreoffice_path:
        print("エラー: LibreOfficeが必要です")
        print("インストール方法: brew install --cask libreoffice")
        sys.exit(1)
    
    print(f"LibreOfficeを使用して変換します: {libreoffice_path}\n")
    
    # Excelから学生情報を取得
    student_map = get_student_ids_from_excel()
    print(f"Excelから {len(student_map)} 名の学生情報を読み込みました\n")
    
    # ファイル一覧を取得（rehearsalフォルダも含む）
    pptx_files = list(PRESENTATIONS_DIR.rglob("*.pptx"))
    ppt_files = list(PRESENTATIONS_DIR.rglob("*.ppt"))
    all_files = pptx_files + ppt_files
    
    # 一時ファイルを除外
    all_files = [f for f in all_files if not f.name.startswith("~$")]
    
    print(f"見つかったプレゼンテーションファイル: {len(all_files)}個\n")
    
    if len(all_files) == 0:
        print("変換するファイルがありません。")
        return
    
    converted_files = []
    
    # PPTX/PPTファイルをPDFに変換
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
                continue
        
        pdf_name = f"{student_id}.pdf"
        pdf_path = PRESENTATIONS_DIR / pdf_name
        
        # 既にPDFが存在する場合は確認
        if pdf_path.exists():
            print(f"⚠️  {pdf_name} は既に存在します。上書きしますか？ (y/N): ", end="")
            # 自動実行のため、デフォルトで上書き
            overwrite = True
            if not overwrite:
                print("スキップ")
                continue
        
        print(f"変換中: {pptx_file.name} → {pdf_name}")
        
        success = convert_pptx_to_pdf_libreoffice(pptx_file, PRESENTATIONS_DIR)
        if success:
            # LibreOfficeは元のファイル名でPDFを作成するので、リネームが必要
            original_pdf = PRESENTATIONS_DIR / (pptx_file.stem + ".pdf")
            if original_pdf.exists():
                if pdf_path.exists() and pdf_path != original_pdf:
                    pdf_path.unlink()  # 既存のPDFを削除
                original_pdf.rename(pdf_path)
                converted_files.append((pptx_file, pdf_path, student_id))
                print(f"  ✓ PDF変換完了: {pdf_name}")
            else:
                print(f"  ✗ PDFファイルが見つかりません")
        else:
            print(f"  ✗ 変換失敗")
    
    # PPTXファイルを学籍番号でリネーム
    print(f"\n{'='*50}")
    print("PPTXファイルをリネーム中...")
    print(f"{'='*50}\n")
    
    for pptx_file, pdf_path, student_id in converted_files:
        new_pptx_name = f"{student_id}.pptx"
        new_pptx_path = PRESENTATIONS_DIR / new_pptx_name
        
        if pptx_file.name != new_pptx_name:
            print(f"リネーム: {pptx_file.name} → {new_pptx_name}")
            if new_pptx_path.exists() and new_pptx_path != pptx_file:
                print(f"  ⚠️  {new_pptx_name} は既に存在します。スキップします。")
            else:
                try:
                    pptx_file.rename(new_pptx_path)
                    print(f"  ✓ リネーム完了")
                except Exception as e:
                    print(f"  ✗ リネームエラー: {e}")
    
    # 既存のPDFファイルも処理（rehearsalフォルダ内のPDFなど）
    existing_pdfs = list(PRESENTATIONS_DIR.rglob("*.pdf"))
    for pdf_file in existing_pdfs:
        student_id = extract_student_id_from_filename(pdf_file.name)
        if not student_id:
            student_id = find_student_id_by_name(pdf_file.name, student_map)
        
        if student_id:
            new_pdf_name = f"{student_id}.pdf"
            new_pdf_path = PRESENTATIONS_DIR / new_pdf_name
            if pdf_file.name != new_pdf_name and pdf_file.parent == PRESENTATIONS_DIR:
                print(f"\nリネーム: {pdf_file.name} → {new_pdf_name}")
                if new_pdf_path.exists() and new_pdf_path != pdf_file:
                    print(f"  ⚠️  {new_pdf_name} は既に存在します。スキップします。")
                else:
                    try:
                        pdf_file.rename(new_pdf_path)
                        print(f"  ✓ リネーム完了")
                    except Exception as e:
                        print(f"  ✗ リネームエラー: {e}")
    
    print(f"\n{'='*50}")
    print(f"変換完了: {len(converted_files)}個のファイル")
    print(f"{'='*50}\n")
    
    # 変換されたPDFファイルの一覧を表示
    final_pdfs = sorted(PRESENTATIONS_DIR.glob("*.pdf"))
    if final_pdfs:
        print("変換されたPDFファイル:")
        for pdf_file in final_pdfs:
            print(f"  - {pdf_file.name}")

if __name__ == "__main__":
    main()
