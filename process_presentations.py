#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PPTXファイル処理メインスクリプト
全工程を自動実行します
"""

import sys
import subprocess
from pathlib import Path

# スクリプトのディレクトリ
SCRIPT_DIR = Path(__file__).parent

def run_script(script_name, description):
    """スクリプトを実行"""
    print(f"\n{'='*60}")
    print(f"{description}")
    print(f"{'='*60}\n")
    
    script_path = SCRIPT_DIR / script_name
    if not script_path.exists():
        print(f"エラー: {script_name} が見つかりません")
        return False
    
    try:
        result = subprocess.run(
            ['python3', str(script_path)],
            cwd=str(SCRIPT_DIR),
            check=True
        )
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"エラー: {script_name} の実行に失敗しました")
        print(f"エラー詳細: {e}")
        return False
    except Exception as e:
        print(f"予期しないエラー: {e}")
        return False

def main():
    print("="*60)
    print("PPTXファイル処理 - 全工程自動実行")
    print("="*60)
    
    # 工程1: PPTXをPDFに変換
    if not run_script('convert_presentations_to_pdf.py', '工程1: PPTXファイルをPDFに変換'):
        print("\n⚠️  PDF変換でエラーが発生しました。続行しますか？ (y/N): ", end="")
        response = input().strip().lower()
        if response != 'y':
            print("処理を中断しました。")
            sys.exit(1)
    
    # 工程2: Mediaフォルダを抽出
    if not run_script('extract_media_from_pptx.py', '工程2: Mediaフォルダを抽出'):
        print("\n⚠️  Media抽出でエラーが発生しました。続行しますか？ (y/N): ", end="")
        response = input().strip().lower()
        if response != 'y':
            print("処理を中断しました。")
            sys.exit(1)
    
    print("\n" + "="*60)
    print("全工程が完了しました！")
    print("="*60)
    print("\n出力ファイル:")
    print("  - PDFファイル: assets/presentations/*.pdf")
    print("  - 画像ファイル: assets/zip/学籍番号/*")

if __name__ == "__main__":
    main()
