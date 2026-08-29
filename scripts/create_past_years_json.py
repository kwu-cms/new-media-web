#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
過去年度の学生データをJSON形式に変換するスクリプト

タイトルと年度のみのデータを既存のフォーマットに合わせてJSONファイルを作成します。
"""

import json
from pathlib import Path


# 過去年度のデータ（年度とタイトルのリスト）
PAST_YEARS_DATA = {
    2024: [
        "3DCGxAR -キャラクターをデザインし、現実世界に召喚する-",
        "Blenderと3Dプリンタでつくる ローポリ動物園",
        "「ココロの拠り所」-感情にまつわる言葉から着想したマンガ制作-",
        "風景と一体になるピクセルアート",
        "TouchDesignerを用いた体験型メディアアートの制作とその展示",
        "デジタル制作と小商い「好きなことで、生きていく」方法の検討",
        "イラストとデジタルアートの融合 -プログラミングを用いた動くファッションデザイン制作-",
        "モーショングラフィックスにおける情報伝達の研究",
        "ジェネラティブ・ピクセルアート -動くピクセルアートに関する研究-",
        "阪神タイガースを題材にした女性向けウェブサイト「TORACO」の制作"
    ],
    2023: [
        "自分の生活の＋1になるようなアプリをつくる",
        "オノマトペと作字-質感や音まどを視覚化した表現の研究ー",
        "Live2Dの技術的な特性を活かしたVtuber用途モデル制作-キャラクターデザインからフェイストラッキングの実現まで一",
        "ブロックチェーンに繋ぎとめられる個人としての私",
        "3Dプリントを用いたコマ撮りアニメーション",
        "誰もが安心して暮らせる社会を提案する映像作品「生きた街中」",
        "生き生きと動くキャラクターを生み出す：Live2D Cubism Editorを用いたVtuberモデルの制作",
        "3DCGの質感表現を応用したグラフィックデザインの研究",
        "シンプルイラストを用いた個人によるアニメーション制作",
        "体験型インタラクティブデジタルアート「Kaleidos-Kobe」の制作について",
        "シネマグラフGIF作品『Fantastical』」の制作を通じて"
    ],
    2022: [
        "仮想空間での「描き方」―VRアートの制作",
        "音楽を描く―Drawing Music―",
        "思い出をテーマにしたアニメーション作品「to be continued.」の制作",
        "リアルタイムCGとイラストレーションの融合",
        "スマホ制作による線画のアニメーション『私たちまた出逢えるよ』",
        "『揺らぐぬくもりを抱きしめて。』―ZINE制作を通じて考えたこと―",
        "デジタル空間における3DCG作品の鑑賞方法についての研究",
        "「モーション・ダイアリー」―デジタル動画日記の制作―",
        "3DCGでKAWAIIを作る方法の研究―KAWAII'S POPパンダと回る不思議な世界―"
    ],
    2021: [
        "個人によるミュージックビデオ制作の実践",
        "アンドロイドと人間の境界・調和を主題としたインディーゲーム制作実践の研究",
        "『偉人絵日記』の制作を通じた、創作活動の継続と変化に関する考察～飽き性で怠惰な人間が1ヶ月間毎日似顔絵を描いてみた～",
        "2D/3DCGを融合させたグラフィックの省略化を目的とした技法の研究",
        "3DCG技術の習得による作り手の認識の変化に関する研究",
        "自作キャラクターの世界観を作る/拡げるための表現方法についての研究",
        "制作活動の習慣化と表現に関する研究 -「自分のための700の落書き」の実践を通じて"
    ],
    2020: [
        "主観的で曖昧な記憶に基にした3DCG表現に関する研究",
        "自分だけの、プライベートコーディングの実践",
        "「目で見て楽しむ」アニメーション制作―作品「聴覚障がいについて」を通じて",
        "VRアバター制作の実践と考察",
        "身体表現とリアルタイム映像・演出の融合に関する研究-ZOOMを用いたダンスパフォーマンスによる映像演出の可能性-",
        "SNSを通じたエッセイマンガの表現に関する研究と実践",
        "サンプリング以後の楽曲制作の実践",
        "インターネット販売を目的とした雑貨ブランドの実践",
        "学生の街としての岡本の魅力を発信する.―「てけてけ岡本」の制作を通じて―",
        "Butterfly Effect-自然をモチーフとしたエンタラクティブアート制作の実践-",
        "ドット絵によるデジタル絵本制作の実践",
        "言葉遊びを効果的に用いたデザインの実践-レトロポップなグラフィック制作を中心に-",
        "ARにおける平面と立体およびその認識に関する実践と研究―わたしたちは平面から何を読み取っているか？",
        "「つながりの場」としての公共空間デザインー木々の中で過ごす",
        '"withコロナ"をモチーフとした主線なしイラストによる物語制作'
    ]
}


def create_students_json(year, titles):
    """
    年度とタイトルリストから学生データのJSON配列を作成
    
    Args:
        year: 年度
        titles: タイトルのリスト
    
    Returns:
        学生データのリスト
    """
    students = []
    
    for idx, title in enumerate(titles, start=1):
        student = {
            "id": idx,
            "grade": year,
            "studentId": "",  # 学籍番号は不明のため空文字列
            "title": title,
            "imagePath": "",  # 画像パスは不明のため空文字列
            "reportPath": "",  # レポートパスは不明のため空文字列
            "presentationPath": "",  # プレゼンテーションパスは不明のため空文字列
            "heroVideo": "",  # ヒーロー動画は不明のため空文字列
            "tags": []  # タグは不明のため空配列
        }
        students.append(student)
    
    return students


def save_json_file(year, students_data):
    """
    JSONファイルを保存
    
    Args:
        year: 年度
        students_data: 学生データのリスト
    """
    # アーカイブディレクトリを作成
    archive_dir = Path('data/archive')
    archive_dir.mkdir(parents=True, exist_ok=True)
    
    # ファイルパス
    json_file = archive_dir / f'students_{year}.json'
    
    # JSONファイルに書き出し
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(students_data, f, ensure_ascii=False, indent=2)
    
    print(f'✓ {year}年度: {len(students_data)}件のデータを保存しました')
    print(f'  保存先: {json_file}')


def main():
    """メイン処理"""
    print('過去年度の学生データをJSON形式に変換します...\n')
    
    total_count = 0
    
    # 年度ごとに処理（新しい年度から順に）
    for year in sorted(PAST_YEARS_DATA.keys(), reverse=True):
        titles = PAST_YEARS_DATA[year]
        students_data = create_students_json(year, titles)
        save_json_file(year, students_data)
        total_count += len(students_data)
    
    print(f'\n完了: 合計{total_count}件のデータを処理しました。')
    print('\n次のステップ:')
    print('1. data/config.jsonに各年度の設定を追加してください')
    print('   (scripts/manage_year.py add-year コマンドを使用)')
    print('2. 必要に応じて各年度のデータに学籍番号やタグなどの情報を追加してください')


if __name__ == '__main__':
    main()
