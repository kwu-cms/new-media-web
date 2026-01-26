#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
レポートファイルをPDFに変換し、学籍番号でリネームするスクリプト
"""

import os
import re
import subprocess
import sys
from pathlib import Path

# パス設定
REPORTS_DIR = Path("assets/reports")
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

def convert_docx_to_pdf_libreoffice(docx_path, output_dir):
    """LibreOfficeを使用してWordをPDFに変換"""
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
            str(docx_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        return result.returncode == 0
    except Exception as e:
        print(f"LibreOffice変換エラー: {e}")
        return False

def convert_docx_to_pdf_docx2pdf(docx_path, pdf_path):
    """docx2pdfライブラリを使用してWordをPDFに変換"""
    try:
        from docx2pdf import convert
        convert(str(docx_path), str(pdf_path))
        return True
    except ImportError:
        print("docx2pdfライブラリがインストールされていません")
        return False
    except Exception as e:
        print(f"docx2pdf変換エラー: {e}")
        return False

def extract_student_id_from_filename(filename):
    """ファイル名から学籍番号を抽出"""
    # ファイル名の先頭から学籍番号（7桁の数字）を抽出
    match = re.match(r'^(\d{7})', filename)
    if match:
        return match.group(1)
    return None

def get_student_ids_from_excel():
    """Excelファイルから学籍番号のリストを取得"""
    try:
        import openpyxl
        wb = openpyxl.load_workbook(EXCEL_FILE)
        ws = wb.active
        
        student_ids = []
        # ヘッダー行をスキップして2行目から読み込み
        for row in ws.iter_rows(min_row=2, values_only=True):
            if row and len(row) > 2 and row[2]:  # 3列目が学籍番号
                student_ids.append(str(row[2]).strip())
        
        return student_ids
    except Exception as e:
        print(f"Excel読み込みエラー: {e}")
        return []

def main():
    # ディレクトリの確認
    if not REPORTS_DIR.exists():
        print(f"エラー: {REPORTS_DIR} が見つかりません")
        sys.exit(1)
    
    # 変換方法の確認
    use_libreoffice = check_libreoffice() is not None
    
    if not use_libreoffice:
        print("LibreOfficeが見つかりません。docx2pdfを試します...")
        try:
            import docx2pdf
            use_docx2pdf = True
        except ImportError:
            print("エラー: LibreOfficeまたはdocx2pdfが必要です")
            print("インストール方法:")
            print("  LibreOffice: brew install --cask libreoffice")
            print("  docx2pdf: pip3 install docx2pdf")
            sys.exit(1)
    else:
        use_docx2pdf = False
        print(f"LibreOfficeを使用して変換します")
    
    # ファイル一覧を取得
    files = list(REPORTS_DIR.glob("*.docx"))
    # 一時ファイルを除外
    files = [f for f in files if not f.name.startswith("~$")]
    
    print(f"\n見つかったWordファイル: {len(files)}個\n")
    
    converted_files = []
    
    # WordファイルをPDFに変換
    for docx_file in files:
        student_id = extract_student_id_from_filename(docx_file.name)
        if not student_id:
            print(f"⚠️  スキップ: {docx_file.name} (学籍番号が見つかりません)")
            continue
        
        pdf_name = f"{student_id}.pdf"
        pdf_path = REPORTS_DIR / pdf_name
        
        # 既にPDFが存在する場合はスキップ
        if pdf_path.exists():
            print(f"✓ 既に存在: {pdf_name}")
            converted_files.append((docx_file, pdf_path, student_id))
            continue
        
        print(f"変換中: {docx_file.name} → {pdf_name}")
        
        if use_libreoffice:
            success = convert_docx_to_pdf_libreoffice(docx_file, REPORTS_DIR)
            if success:
                # LibreOfficeは元のファイル名でPDFを作成するので、リネームが必要
                original_pdf = REPORTS_DIR / (docx_file.stem + ".pdf")
                if original_pdf.exists():
                    original_pdf.rename(pdf_path)
                    converted_files.append((docx_file, pdf_path, student_id))
                    print(f"  ✓ 変換完了")
                else:
                    print(f"  ✗ PDFファイルが見つかりません")
            else:
                print(f"  ✗ 変換失敗")
        else:
            success = convert_docx_to_pdf_docx2pdf(docx_file, pdf_path)
            if success:
                converted_files.append((docx_file, pdf_path, student_id))
                print(f"  ✓ 変換完了")
            else:
                print(f"  ✗ 変換失敗")
    
    # 既存のPDFファイルも処理
    existing_pdfs = list(REPORTS_DIR.glob("*.pdf"))
    for pdf_file in existing_pdfs:
        student_id = extract_student_id_from_filename(pdf_file.name)
        if student_id:
            new_pdf_name = f"{student_id}.pdf"
            new_pdf_path = REPORTS_DIR / new_pdf_name
            if pdf_file.name != new_pdf_name:
                print(f"\nリネーム: {pdf_file.name} → {new_pdf_name}")
                if new_pdf_path.exists():
                    print(f"  ⚠️  {new_pdf_name} は既に存在します。スキップします。")
                else:
                    pdf_file.rename(new_pdf_path)
                    print(f"  ✓ リネーム完了")
    
    print(f"\n{'='*50}")
    print(f"変換完了: {len(converted_files)}個のファイル")
    print(f"{'='*50}\n")
    
    # 元のWordファイルを削除するか確認（オプション）
    if converted_files:
        print("元のWordファイルを削除しますか？ (y/N): ", end="")
        # 自動実行のため、デフォルトで削除しない
        delete_original = False
        if delete_original:
            for docx_file, _, _ in converted_files:
                try:
                    docx_file.unlink()
                    print(f"削除: {docx_file.name}")
                except Exception as e:
                    print(f"削除エラー ({docx_file.name}): {e}")
        else:
            print("スキップ（Wordファイルは保持されます）")

if __name__ == "__main__":
    main()
