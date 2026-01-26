#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Excel雛形ファイル作成スクリプト
"""

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from pathlib import Path

# パス設定（プロジェクトルートからの相対パス）
SCRIPT_DIR = Path(__file__).parent.parent.parent
EXCEL_FILE = SCRIPT_DIR / "data" / "students.xlsx"

# ワークブックを作成
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "学生データ"

# ヘッダー行を定義
headers = [
    "No",
    "所属学年",
    "学籍番号",
    "氏名",
    "氏名英字",
    "題目",
    "画像パス",
    "レポートパス",
    "プレゼンパス"
]

# サンプルデータ（提供された学生リスト）
sample_data = [
    [1, "メデ4", "1522008", "岩舩　愛", "AI IWAFUNE", "", "", "", ""],
    [2, "メデ4", "1522012", "大塚　みずき", "MIZUKI OTSUKA", "", "", "", ""],
    [3, "メデ4", "1522014", "大西　夏羽", "NATSUHA ONISHI", "", "", "", ""],
    [4, "メデ4", "1522030", "小森　陽菜", "HINA KOMORI", "", "", "", ""],
    [5, "メデ4", "1522034", "阪口　芽唯", "MEI SAKAGUCHI", "", "", "", ""],
    [6, "メデ4", "1522036", "志方　小春紅", "KOHAKU SHIKATA", "", "", "", ""],
    [7, "メデ4", "1522047", "高橋　未奈", "MINA TAKAHASHI", "", "", "", ""],
    [8, "メデ4", "1522054", "西澤　黄以花", "KIIKA NISHIZAWA", "", "", "", ""],
    [9, "メデ4", "1522074", "山本　奈央", "NAO YAMAMOTO", "", "", "", ""],
]

# ヘッダー行を書き込み
header_fill = PatternFill(start_color="667eea", end_color="667eea", fill_type="solid")
header_font = Font(bold=True, color="FFFFFF", size=12)

for col_num, header in enumerate(headers, 1):
    cell = ws.cell(row=1, column=col_num, value=header)
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal="center", vertical="center")

# 列幅を調整
column_widths = {
    "A": 8,   # No
    "B": 12,  # 所属学年
    "C": 15,  # 学籍番号
    "D": 15,  # 氏名
    "E": 20,  # 氏名英字
    "F": 40,  # 題目
    "G": 30,  # 画像パス
    "H": 30,  # レポートパス
    "I": 30,  # プレゼンパス
}

for col_letter, width in column_widths.items():
    ws.column_dimensions[col_letter].width = width

# サンプルデータを書き込み
for row_num, row_data in enumerate(sample_data, 2):
    for col_num, value in enumerate(row_data, 1):
        cell = ws.cell(row=row_num, column=col_num, value=value)
        cell.alignment = Alignment(horizontal="left", vertical="center")
        
        # No列は中央揃え
        if col_num == 1:
            cell.alignment = Alignment(horizontal="center", vertical="center")

# ヘッダー行の高さを調整
ws.row_dimensions[1].height = 25

# 説明シートを追加
ws2 = wb.create_sheet("説明")
ws2.title = "説明"

instructions = [
    ["Excelファイル項目説明", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["列名", "説明", "例", "", "", "", "", "", ""],
    ["No", "学生番号（連番）", "1, 2, 3...", "", "", "", "", "", ""],
    ["所属学年", "所属学年", "メデ4", "", "", "", "", "", ""],
    ["学籍番号", "学生の学籍番号", "1522008", "", "", "", "", "", ""],
    ["氏名", "学生の氏名（日本語）", "岩舩　愛", "", "", "", "", "", ""],
    ["氏名英字", "学生の氏名（ローマ字）", "AI IWAFUNE", "", "", "", "", "", ""],
    ["題目", "卒業研究の題目", "AIを活用した画像認識システムの開発", "", "", "", "", "", ""],
    ["画像パス", "画像ファイル名（複数可、カンマ区切り）", "image1.jpg または image1.jpg,image2.jpg", "", "", "", "", "", ""],
    ["レポートパス", "Wordレポートファイル名（複数可、カンマ区切り）", "report.docx または report1.docx,report2.docx", "", "", "", "", "", ""],
    ["プレゼンパス", "PPTXプレゼン資料ファイル名（複数可、カンマ区切り）", "presentation.pptx または pres1.pptx,pres2.pptx", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["注意事項", "", "", "", "", "", "", "", ""],
    ["1. ファイル名に日本語や特殊文字を含めないことを推奨します", "", "", "", "", "", "", "", ""],
    ["2. 画像ファイルは assets/images/ フォルダに配置してください", "", "", "", "", "", "", "", ""],
    ["3. レポートファイルは assets/reports/ フォルダに配置してください", "", "", "", "", "", "", "", ""],
    ["4. プレゼン資料ファイルは assets/presentations/ フォルダに配置してください", "", "", "", "", "", "", "", ""],
    ["5. 複数のファイルを指定する場合は、カンマ区切りで入力してください", "", "", "", "", "", "", "", ""],
]

for row_num, row_data in enumerate(instructions, 1):
    for col_num, value in enumerate(row_data, 1):
        cell = ws2.cell(row=row_num, column=col_num, value=value)
        if row_num == 1:
            cell.font = Font(bold=True, size=14)
        elif row_num == 3:
            cell.font = Font(bold=True)
            cell.fill = PatternFill(start_color="E0E0E0", end_color="E0E0E0", fill_type="solid")

# 説明シートの列幅を調整
ws2.column_dimensions["A"].width = 20
ws2.column_dimensions["B"].width = 50
ws2.column_dimensions["C"].width = 50

# ファイルを保存
output_path = EXCEL_FILE
wb.save(output_path)
print(f"Excel雛形ファイルを作成しました: {output_path}")
print(f"学生データシートに {len(sample_data)} 名の学生データが含まれています。")
