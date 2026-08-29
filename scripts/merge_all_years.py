#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
2020年度から2025年度までのデータを統合するスクリプト
"""

import json
from pathlib import Path


def load_json_file(file_path):
    """JSONファイルを読み込む"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def merge_all_years():
    """全年度のデータを統合"""
    base_dir = Path('data')
    archive_dir = base_dir / 'archive'
    
    all_students = []
    global_id = 1
    
    # 年度順に処理（2020→2025）
    years = [2020, 2021, 2022, 2023, 2024, 2025]
    
    for year in years:
        if year == 2025:
            # 2025年度は data/students.json
            json_file = base_dir / 'students.json'
        else:
            # 2020-2024年度は data/archive/students_[年度].json
            json_file = archive_dir / f'students_{year}.json'
        
        if json_file.exists():
            students = load_json_file(json_file)
            # idを全体通し番号に更新
            for student in students:
                student['id'] = global_id
                global_id += 1
            all_students.extend(students)
            print(f'✓ {year}年度: {len(students)}件を追加')
        else:
            print(f'⚠ {year}年度のファイルが見つかりません: {json_file}')
    
    return all_students


def main():
    """メイン処理"""
    print('2020年度から2025年度までのデータを統合します...\n')
    
    all_students = merge_all_years()
    
    # 統合JSONファイルを保存
    output_file = Path('data/students_all_years.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_students, f, ensure_ascii=False, indent=2)
    
    print(f'\n完了: 合計{len(all_students)}件のデータを統合しました。')
    print(f'保存先: {output_file}')
    
    # 年度別の件数を表示
    print('\n年度別件数:')
    year_counts = {}
    for student in all_students:
        year = student['grade']
        year_counts[year] = year_counts.get(year, 0) + 1
    
    for year in sorted(year_counts.keys()):
        print(f'  {year}年度: {year_counts[year]}件')


if __name__ == '__main__':
    main()
