#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
年度管理スクリプト

年度ごとの個人情報表示制御を管理するためのスクリプトです。
新年度の追加、発表会後の設定変更などを行います。

使用方法:
    # 新年度を追加
    python scripts/manage_year.py add-year --year 2026 --presentation-date 2027-01-27

    # 発表会後に個人情報を非表示にする
    python scripts/manage_year.py hide-info --year 2025

    # 設定を確認
    python scripts/manage_year.py show-config
"""

import json
import argparse
from datetime import datetime
from pathlib import Path


CONFIG_FILE = Path('data/config.json')


def load_config():
    """設定ファイルを読み込む"""
    if not CONFIG_FILE.exists():
        # 設定ファイルが存在しない場合は初期設定を作成
        config = {
            "currentYear": datetime.now().year,
            "years": []
        }
        save_config(config)
        return config
    
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_config(config):
    """設定ファイルを保存する"""
    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    print(f'設定ファイルを保存しました: {CONFIG_FILE}')


def add_year(year, presentation_date, hide_after_date=None):
    """新年度を追加する"""
    config = load_config()
    
    # 日付の検証
    try:
        presentation_dt = datetime.strptime(presentation_date, '%Y-%m-%d')
    except ValueError:
        print(f'エラー: 発表会日の形式が不正です: {presentation_date}')
        print('正しい形式: YYYY-MM-DD (例: 2027-01-27)')
        return False
    
    # hide_after_dateが指定されていない場合は、発表会日の翌日を設定
    if hide_after_date is None:
        from datetime import timedelta
        hide_after_dt = presentation_dt + timedelta(days=1)
        hide_after_date = hide_after_dt.strftime('%Y-%m-%d')
    
    # 既存の年度設定を確認
    existing_year = next((y for y in config['years'] if y['year'] == year), None)
    if existing_year:
        print(f'警告: {year}年度の設定が既に存在します。')
        response = input('上書きしますか？ (y/N): ')
        if response.lower() != 'y':
            print('キャンセルしました。')
            return False
    
    # 年度設定を作成
    year_config = {
        "year": year,
        "presentationDate": presentation_date,
        "hidePersonalInfoAfter": hide_after_date,
        "hidePersonalInfo": False,  # 発表会前は表示
        "dataFile": "students.json" if year == config.get('currentYear', year) else f"archive/students_{year}.json"
    }
    
    # 既存の設定を更新または追加
    if existing_year:
        index = config['years'].index(existing_year)
        config['years'][index] = year_config
        print(f'{year}年度の設定を更新しました。')
    else:
        config['years'].append(year_config)
        print(f'{year}年度の設定を追加しました。')
    
    # 現在年度を更新
    if year > config.get('currentYear', 0):
        config['currentYear'] = year
        print(f'現在年度を{year}に更新しました。')
    
    # 年度でソート
    config['years'].sort(key=lambda x: x['year'])
    
    save_config(config)
    return True


def hide_info(year):
    """指定年度の個人情報を非表示にする"""
    config = load_config()
    
    year_config = next((y for y in config['years'] if y['year'] == year), None)
    if not year_config:
        print(f'エラー: {year}年度の設定が見つかりません。')
        return False
    
    year_config['hidePersonalInfo'] = True
    print(f'{year}年度の個人情報を非表示に設定しました。')
    
    save_config(config)
    return True


def show_config():
    """設定を表示する"""
    config = load_config()
    
    print('\n=== 年度管理設定 ===')
    print(f'現在年度: {config.get("currentYear", "未設定")}')
    print(f'\n年度別設定:')
    
    if not config.get('years'):
        print('  設定がありません。')
    else:
        for year_config in config['years']:
            print(f'\n  {year_config["year"]}年度:')
            print(f'    発表会日: {year_config.get("presentationDate", "未設定")}')
            print(f'    非表示開始日: {year_config.get("hidePersonalInfoAfter", "未設定")}')
            print(f'    個人情報非表示: {year_config.get("hidePersonalInfo", False)}')
            print(f'    データファイル: {year_config.get("dataFile", "未設定")}')
    
    print()


def archive_year(year):
    """年度のデータをアーカイブに移動する"""
    config = load_config()
    
    year_config = next((y for y in config['years'] if y['year'] == year), None)
    if not year_config:
        print(f'エラー: {year}年度の設定が見つかりません。')
        return False
    
    # アーカイブディレクトリを作成
    archive_dir = Path('data/archive')
    archive_dir.mkdir(parents=True, exist_ok=True)
    
    # データファイルを移動
    current_file = Path(f'data/{year_config["dataFile"]}')
    if current_file.exists():
        archive_file = archive_dir / f'students_{year}.json'
        if archive_file.exists():
            response = input(f'{archive_file}が既に存在します。上書きしますか？ (y/N): ')
            if response.lower() != 'y':
                print('キャンセルしました。')
                return False
        
        import shutil
        shutil.move(str(current_file), str(archive_file))
        print(f'データファイルをアーカイブに移動しました: {archive_file}')
        
        # 設定を更新
        year_config['dataFile'] = f'archive/students_{year}.json'
        save_config(config)
    else:
        print(f'警告: データファイルが見つかりません: {current_file}')
    
    return True


def main():
    parser = argparse.ArgumentParser(description='年度管理スクリプト')
    subparsers = parser.add_subparsers(dest='command', help='コマンド')
    
    # 新年度追加コマンド
    add_parser = subparsers.add_parser('add-year', help='新年度を追加')
    add_parser.add_argument('--year', type=int, required=True, help='年度 (例: 2026)')
    add_parser.add_argument('--presentation-date', required=True, help='発表会日 (YYYY-MM-DD形式)')
    add_parser.add_argument('--hide-after-date', help='個人情報非表示開始日 (YYYY-MM-DD形式、省略時は発表会日の翌日)')
    
    # 個人情報非表示コマンド
    hide_parser = subparsers.add_parser('hide-info', help='個人情報を非表示にする')
    hide_parser.add_argument('--year', type=int, required=True, help='年度')
    
    # 設定表示コマンド
    subparsers.add_parser('show-config', help='設定を表示')
    
    # アーカイブコマンド
    archive_parser = subparsers.add_parser('archive', help='年度データをアーカイブに移動')
    archive_parser.add_argument('--year', type=int, required=True, help='年度')
    
    args = parser.parse_args()
    
    if args.command == 'add-year':
        add_year(args.year, args.presentation_date, args.hide_after_date)
    elif args.command == 'hide-info':
        hide_info(args.year)
    elif args.command == 'show-config':
        show_config()
    elif args.command == 'archive':
        archive_year(args.year)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
