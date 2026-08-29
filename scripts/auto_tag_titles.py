#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
題目からキーワードマッチングでタグを自動付与するスクリプト

表現技法とテーマの両方からタグを付与する。
"""

import json
from pathlib import Path


JSON_FILE = Path('data/students_all_years.json')

# 表現技法タグ
TECHNIQUE_TAGS = [
    ('AIモデリング', ['AIを用いた', 'AIモデリング']),
    ('TouchDesigner', ['TouchDesigner']),
    ('ティラノビルダー', ['ティラノビルダー']),
    ('Unity', ['Unity']),
    ('Blender', ['Blender']),
    ('Live2D', ['Live2D', 'Cubism Editor', 'フェイストラッキング']),
    ('音声合成', ['音声合成', '合成音声']),
    ('デジタル音楽', ['サンプリング', '楽曲制作', '楽曲']),
    ('デジタルイラスト', ['主線なしイラスト', '似顔絵', '落書き', '絵日記']),
    ('デジタルファブリケーション', ['3Dプリンタ', '3Dプリント']),
    ('VR', ['VR', '仮想空間', 'VRアバター', 'VRアート']),
    ('AR', ['AR', '3DCGxAR']),
    ('3Dモデリング', ['3DCG', '3Dモデル', 'リアルタイムCG', 'ローポリ', '質感表現']),
    ('ピクセルアート', ['ピクセルアート', 'ドット絵', 'ジェネラティブ・ピクセル', '動くピクセル']),
    ('プログラミング', ['プログラミング', 'コーディング', 'プライベートコーディング', 'デジタル制作']),
    ('モーショングラフィックス', ['モーショングラフィックス', 'モーション・ダイアリー']),
    ('シネマグラフ', ['シネマグラフ']),
    ('コマ撮り', ['コマ撮り']),
    ('作字', ['作字', 'オノマトペ']),
    ('ZINE', ['ZINE']),
    ('絵本', ['絵本', 'デジタル絵本']),
    ('アニメーション制作', ['アニメーション制作', 'アニメーション作品', '線画のアニメーション', 'コマ撮りアニメーション', '個人によるアニメーション']),
    ('映像制作', ['映像作品', '映像演出', '映像', 'ミュージックビデオ', '動画日記', 'ダンスパフォーマンス', 'Drawing Music']),
    ('ゲーム開発', ['ゲーム制作', 'ゲーム開発', 'インディーゲーム', '個人ゲーム', 'ノベルゲーム', 'ノベル形式', 'アクションゲーム', 'アドベンチャーゲーム', 'ホラーゲーム']),
    ('ウェブ制作', ['ウェブサイト', 'WEB', 'web']),
    ('アプリ開発', ['アプリをつくる', 'アプリ']),
    ('SNS', ['SNS']),
    ('ブロックチェーン', ['ブロックチェーン']),
    ('ジェネラティブ', ['ジェネラティブ']),
    ('タイポグラフィ', ['言葉遊び', 'レトロポップ']),
    ('体験型メディア', ['体験型', 'インタラクティブ', 'エンタラクティブ']),
]

# テーマタグ
THEME_TAGS = [
    ('キャラクターデザイン', ['キャラクターデザイン', 'キャラクター属性', 'キャラクター化', '魔法少女キャラクター', 'キャラクターをデザイン', 'キャラクター関係性', 'KAWAII', '武器表現', '自作キャラクター', 'アバター']),
    ('VTuber', ['Vtuber', 'VTuber', 'Vtuber文化', 'VTuber文化', '自己キャラクター化']),
    ('空間デザイン', ['空間デザイン', '公共空間', '空間デザイン要素']),
    ('UI・UXデザイン', ['UI・UX', 'UIデザイン', 'UXデザイン']),
    ('グラフィックデザイン', ['グラフィックデザイン', 'グラフィック制作', 'グラフィックの省略化', '2D/3DCG']),
    ('ファッション', ['ファッション']),
    ('世界観', ['世界観', '残響旧街路', 'もちこの大冒険', 'KAWAII\'S POP', 'Fantastical', '生きた街中']),
    ('物語', ['物語', '物語制作', '物語体験', 'to be continued', '私たちまた出逢えるよ', '揺らぐぬくもり']),
    ('シナリオ', ['シナリオ', '恋愛要素']),
    ('イラスト', ['イラスト', 'イラストレーション', '線画', '主線なしイラスト', '似顔絵', '落書き', 'シンプルイラスト']),
    ('マンガ', ['マンガ', 'エッセイマンガ', '絵日記']),
    ('メディアアート', ['メディアアート', 'デジタルアート', 'Kaleidos', 'VRアート']),
    ('体験のデザイン', ['体験のデザイン', '体験型メディアアート', '展示']),
    ('文化研究', ['文化', 'Vtuber文化', 'VTuber文化', '鑑賞方法']),
    ('音楽', ['音楽', '楽曲', 'サンプリング']),
    ('記憶', ['記憶', '思い出', 'モーション・ダイアリー']),
    ('感情', ['感情', 'ココロ', 'ぬくもり']),
    ('社会', ['社会', '聴覚障がい', '安心して暮らせる', 'withコロナ', 'コロナ', 'アンドロイドと人間', '境界']),
    ('自然', ['自然をモチーフ', 'Butterfly Effect', '木々']),
    ('身体表現', ['身体表現', '身体']),
    ('日常', ['日常', '生活の＋1', '日記', '700の落書き', '習慣化', '継続']),
    ('地域', ['岡本', 'てけてけ', 'Kobe', '街']),
    ('コミュニティ', ['つながり', 'コミュニティ', '公共']),
    ('アイデンティティ', ['個人としての私', 'アイデンティティ', '自己']),
    ('ブランディング', ['ブランド', '雑貨', '小商い', '好きなことで、生きていく', 'インターネット販売']),
    ('スポーツ', ['阪神タイガース', 'TORACO']),
    ('風景', ['風景']),
    ('デザイン研究', ['デザイン手法', 'デザイン技法', '表現方法', '表現の研究', '表現に関する', '技法の研究', '認識の変化', '情報伝達', '省略化', '翻訳する', 'デザイン保持']),
    ('スペキュラティブデザイン', ['スペキュラティブ']),
    ('ペルソナ分析', ['ペルソナ', '星川サラ']),
    ('Live配信', ['Live配信', '配信活動', '配信']),
    ('平面と立体', ['平面と立体', '平面から']),
    ('質感表現', ['質感', '音まど']),
    ('創作活動', ['創作活動', '制作活動', '制作の実践', '制作を通じ', '制作について', '制作実践', '個人制作', '個人による', '実践と考察', '実践の研究']),
    ('総合芸術', ['総合芸術']),
    ('ホラー', ['ホラー']),
    ('造形', ['ローポリ', '動物園', 'フィギュア']),
]

LEGACY_TAG_MAP = {
    'マンガ・アニメ': 'マンガ',
    'デザイン技法': 'デザイン研究',
    'UIデザイン': 'UI・UXデザイン',
    '映像': '映像制作',
    'ノベルゲーム': 'ゲーム開発',
    'アクションゲーム': 'ゲーム開発',
    'アドベンチャーゲーム': 'ゲーム開発',
    'Vtuber': 'VTuber',
}

ALL_RULES = TECHNIQUE_TAGS + THEME_TAGS


def normalize_tags(tags):
    """表記ゆれを統一し重複を除去"""
    normalized = []
    for tag in tags:
        if tag == 'Vtuber':
            tag = 'VTuber'
        tag = LEGACY_TAG_MAP.get(tag, tag)
        if tag not in normalized:
            normalized.append(tag)
    return normalized


def extract_tags(title, existing_tags=None):
    """題目から表現技法・テーマ両方のタグを抽出（既存タグは保持）"""
    tags = normalize_tags(list(existing_tags or []))

    for tag_name, keywords in ALL_RULES:
        if tag_name in tags:
            continue
        for keyword in sorted(keywords, key=len, reverse=True):
            if keyword in title:
                tags.append(tag_name)
                break

    return tags


def ensure_balance(tags, title):
    """表現技法・テーマの両方が付くよう不足分を補完"""
    technique_names = {t[0] for t in TECHNIQUE_TAGS}
    theme_names = {t[0] for t in THEME_TAGS}

    has_tech = any(t in technique_names for t in tags)
    has_theme = any(t in theme_names for t in tags)

    if not has_theme:
        if any(k in title for k in ('実践', '制作', '研究', '表現', 'デザイン', '作品')):
            if '創作活動' not in tags:
                tags.append('創作活動')

    if not has_tech:
        if 'サンプリング' in title or '楽曲' in title:
            if 'デジタル音楽' not in tags:
                tags.append('デジタル音楽')
        elif any(k in title for k in ('インターネット', '販売', '小商い', 'ウェブサイト')):
            if 'ウェブ制作' not in tags:
                tags.append('ウェブ制作')
        elif any(k in title for k in ('発信', '魅力')):
            if '映像制作' not in tags:
                tags.append('映像制作')
        elif 'イラスト' in title or '絵' in title or '似顔絵' in title or '落書き' in title:
            if 'デジタルイラスト' not in tags:
                tags.append('デジタルイラスト')
        elif any(k in title for k in ('Vtuber', 'VTuber', '配信')):
            if 'Live2D' not in tags:
                tags.append('Live2D')
        elif 'マンガ' in title:
            if 'デジタルイラスト' not in tags:
                tags.append('デジタルイラスト')
        elif 'コマ撮り' in title:
            if '造形' not in tags:
                tags.append('造形')
        elif any(k in title for k in ('空間', '公共')):
            if '3Dモデリング' not in tags:
                tags.append('3Dモデリング')
        elif 'ジェネラティブ' in title or 'ピクセル' in title:
            if 'プログラミング' not in tags:
                tags.append('プログラミング')
        elif 'キャラクター' in title:
            if 'デジタルイラスト' not in tags:
                tags.append('デジタルイラスト')

    return tags


def load_2025_manual_tags():
    """2025年度の手動タグを students.json から読み込む"""
    manual_file = Path('data/students.json')
    if not manual_file.exists():
        return {}
    with open(manual_file, 'r', encoding='utf-8') as f:
        students = json.load(f)
    return {
        s['studentId']: normalize_tags(s.get('tags', []))
        for s in students if s.get('studentId')
    }


def main():
    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        students = json.load(f)

    manual_2025 = load_2025_manual_tags()
    tagged_count = 0
    technique_counts = []
    theme_counts = []

    technique_names = {t[0] for t in TECHNIQUE_TAGS}
    theme_names = {t[0] for t in THEME_TAGS}

    for student in students:
        title = student['title']
        if student.get('grade') == 2025 and student.get('studentId') in manual_2025:
            existing = manual_2025[student['studentId']]
        else:
            existing = normalize_tags(student.get('tags') or [])

        new_tags = ensure_balance(
            normalize_tags(extract_tags(title, existing)),
            title
        )
        if new_tags != student.get('tags', []):
            tagged_count += 1
        student['tags'] = new_tags

        tech_n = sum(1 for t in new_tags if t in technique_names)
        theme_n = sum(1 for t in new_tags if t in theme_names)
        technique_counts.append(tech_n)
        theme_counts.append(theme_n)

    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(students, f, ensure_ascii=False, indent=2)

    avg_tags = sum(len(s['tags']) for s in students) / len(students)
    avg_tech = sum(technique_counts) / len(technique_counts)
    avg_theme = sum(theme_counts) / len(theme_counts)
    both = sum(1 for i in range(len(students)) if technique_counts[i] > 0 and theme_counts[i] > 0)

    print(f'✓ {len(students)}件を処理、{tagged_count}件のタグを更新しました')
    print(f'  平均タグ数: {avg_tags:.1f}件（表現技法 {avg_tech:.1f} / テーマ {avg_theme:.1f}）')
    print(f'  両方付与: {both}件 / {len(students)}件')
    print(f'  保存先: {JSON_FILE}')

    all_tags = {}
    for s in students:
        for tag in s.get('tags', []):
            all_tags[tag] = all_tags.get(tag, 0) + 1

    print('\n【表現技法】')
    for tag, count in sorted(all_tags.items(), key=lambda x: (-x[1], x[0])):
        if tag in technique_names:
            print(f'  {tag}: {count}件')

    print('\n【テーマ】')
    for tag, count in sorted(all_tags.items(), key=lambda x: (-x[1], x[0])):
        if tag in theme_names:
            print(f'  {tag}: {count}件')


if __name__ == '__main__':
    main()
