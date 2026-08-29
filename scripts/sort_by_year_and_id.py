#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
年度ごとにIDでソートするスクリプト

各年度内でIDが小さい順に並ぶようにします。
"""

import json
from pathlib import Path
from collections import defaultdict


def load_json_file(file_path):
    """JSONファイルを読み込む"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def sort_by_year_and_id():
    """年度ごとにIDでソート"""
    base_dir = Path('data')
    archive_dir = base_dir / 'archive'
    
    # 年度ごとにデータをグループ化
    students_by_year = defaultdict(list)
    
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
            # 元のIDを保持したまま追加
            for student in students:
                # 元のIDをoriginalIdとして保存（既にidがあるのでそのまま使用）
                students_by_year[year].append(student)
            print(f'✓ {year}年度: {len(students)}件を読み込み')
        else:
            print(f'⚠ {year}年度のファイルが見つかりません: {json_file}')
    
    # 年度ごとにIDでソート
    all_students = []
    global_id = 1
    
    for year in sorted(years):
        year_students = students_by_year[year]
        # 各年度内でIDでソート（数値として比較）
        year_students_sorted = sorted(year_students, key=lambda x: int(x.get('id', 0)))
        
        # 全体通し番号を更新
        for student in year_students_sorted:
            student['id'] = global_id
            global_id += 1
        
        all_students.extend(year_students_sorted)
        print(f'✓ {year}年度: {len(year_students_sorted)}件をID順にソートして追加')
    
    return all_students


def main():
    """メイン処理"""
    print('年度ごとにIDでソートします...\n')
    
    all_students = sort_by_year_and_id()
    
    # 統合JSONファイルを保存
    output_file = Path('data/students_all_years.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_students, f, ensure_ascii=False, indent=2)
    
    print(f'\n完了: 合計{len(all_students)}件のデータを年度ごとにID順でソートしました。')
    print(f'保存先: {output_file}')
    
    # 年度別の件数とID範囲を表示
    print('\n年度別件数とID範囲:')
    year_info = {}
    for student in all_students:
        year = student['grade']
        if year not in year_info:
            year_info[year] = {'count': 0, 'min_id': student['id'], 'max_id': student['id']}
        year_info[year]['count'] += 1
        year_info[year]['min_id'] = min(year_info[year]['min_id'], student['id'])
        year_info[year]['max_id'] = max(year_info[year]['max_id'], student['id'])
    
    for year in sorted(year_info.keys()):
        info = year_info[year]
        print(f'  {year}年度: {info["count"]}件 (ID: {info["min_id"]}-{info["max_id"]})')


if __name__ == '__main__':
    main()
