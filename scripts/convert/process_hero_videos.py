#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Heroセクション用動画処理スクリプト
動画ファイルを最適化し、統一されたサイズとフォーマットに変換
"""

import os
import subprocess
import sys
from pathlib import Path
import json

# パス設定（プロジェクトルートからの相対パス）
SCRIPT_DIR = Path(__file__).parent.parent.parent
INPUT_DIR = SCRIPT_DIR / "assets" / "movies"
OUTPUT_DIR = SCRIPT_DIR / "assets" / "hero" / "videos"
THUMBNAIL_DIR = SCRIPT_DIR / "assets" / "hero" / "thumbnails"

# 動画設定
VIDEO_WIDTH = 1920  # 幅（px）
VIDEO_HEIGHT = 1080  # 高さ（px）
VIDEO_BITRATE = "5000k"  # ビットレート
VIDEO_FPS = 30  # フレームレート
MAX_DURATION = 60  # 最大再生時間（秒、0の場合は無制限）

def check_ffmpeg():
    """ffmpegが利用可能か確認"""
    try:
        result = subprocess.run(['which', 'ffmpeg'], capture_output=True, text=True)
        if result.returncode == 0:
            return result.stdout.strip()
    except:
        pass
    return None

def get_video_info(video_path):
    """動画ファイルの情報を取得"""
    ffmpeg_path = check_ffmpeg()
    if not ffmpeg_path:
        return None
    
    try:
        cmd = [
            ffmpeg_path,
            '-i', str(video_path),
            '-hide_banner',
            '-f', 'null',
            '-'
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        
        info = {}
        output = result.stdout or ''
        
        for line in output.split('\n'):
            if 'Duration:' in line:
                # Duration: 00:01:23.45 形式から秒数を抽出
                try:
                    duration_str = line.split('Duration:')[1].split(',')[0].strip()
                    parts = duration_str.split(':')
                    if len(parts) == 3:
                        hours, minutes, seconds = map(float, parts)
                        info['duration'] = int(hours * 3600 + minutes * 60 + seconds)
                except:
                    pass
            elif 'Video:' in line:
                # Video: h264, 1920x1080 形式から解像度を抽出
                try:
                    if 'x' in line:
                        video_part = line.split('Video:')[1]
                        if ',' in video_part:
                            resolution = video_part.split(',')[1].strip().split()[0]
                            if 'x' in resolution:
                                width, height = map(int, resolution.split('x'))
                                info['width'] = width
                                info['height'] = height
                except:
                    pass
        
        return info if info else None
    except Exception as e:
        print(f"  エラー: 動画情報の取得に失敗: {e}")
        return None

def process_video(input_path, output_path, max_duration=None):
    """動画を処理（リサイズ、最適化、フォーマット変換）"""
    ffmpeg_path = check_ffmpeg()
    if not ffmpeg_path:
        return False
    
    try:
        # 出力ディレクトリを作成
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # ffmpegコマンドを構築
        cmd = [
            ffmpeg_path,
            '-i', str(input_path),
            '-vf', f'scale={VIDEO_WIDTH}:{VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,pad={VIDEO_WIDTH}:{VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2',
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            '-b:v', VIDEO_BITRATE,
            '-maxrate', VIDEO_BITRATE,
            '-bufsize', str(int(VIDEO_BITRATE.replace('k', '')) * 2) + 'k',
            '-r', str(VIDEO_FPS),
            '-c:a', 'aac',
            '-b:a', '192k',
            '-movflags', '+faststart',  # Web用に最適化
            '-y'  # 上書き許可
        ]
        
        # 最大再生時間の設定
        if max_duration and max_duration > 0:
            cmd.insert(-1, '-t')
            cmd.insert(-1, str(max_duration))
        
        cmd.append(str(output_path))
        
        # 変換実行
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        
        if result.returncode == 0:
            return True
        else:
            print(f"  エラー: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print(f"  タイムアウト: 変換に時間がかかりすぎています")
        return False
    except Exception as e:
        print(f"  エラー: {e}")
        return False

def generate_thumbnail(video_path, thumbnail_path, time_offset=1):
    """動画からサムネイル画像を生成"""
    ffmpeg_path = check_ffmpeg()
    if not ffmpeg_path:
        return False
    
    try:
        thumbnail_path.parent.mkdir(parents=True, exist_ok=True)
        
        cmd = [
            ffmpeg_path,
            '-i', str(video_path),
            '-ss', str(time_offset),
            '-vframes', '1',
            '-vf', f'scale={VIDEO_WIDTH}:{VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,pad={VIDEO_WIDTH}:{VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2',
            '-q:v', '2',
            '-y',
            str(thumbnail_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return result.returncode == 0
    except Exception as e:
        print(f"  サムネイル生成エラー: {e}")
        return False

def process_hero_videos():
    """Hero用動画を処理"""
    print("="*60)
    print("Heroセクション用動画処理")
    print("="*60)
    print()
    
    # ffmpegの確認
    ffmpeg_path = check_ffmpeg()
    if not ffmpeg_path:
        print("エラー: ffmpegが見つかりません")
        print("インストール方法:")
        print("  macOS: brew install ffmpeg")
        print("  Ubuntu: sudo apt-get install ffmpeg")
        return
    
    print(f"✓ ffmpeg: {ffmpeg_path}\n")
    
    # 入力ディレクトリの確認
    if not INPUT_DIR.exists():
        print(f"入力ディレクトリが見つかりません: {INPUT_DIR}")
        print(f"\n以下のフォルダに動画ファイルを配置してください:")
        print(f"  {INPUT_DIR}")
        return
    
    # 動画ファイルを検索
    video_extensions = {'.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.MP4', '.MOV', '.AVI', '.MKV', '.WEBM', '.M4V'}
    video_files = [f for f in INPUT_DIR.iterdir() if f.suffix in video_extensions and f.is_file()]
    
    if not video_files:
        print(f"動画ファイルが見つかりません: {INPUT_DIR}")
        print(f"\n以下のフォルダに動画ファイルを配置してください:")
        print(f"  {INPUT_DIR}")
        return
    
    print(f"見つかった動画ファイル: {len(video_files)}個\n")
    print(f"⚠️  注意: 元の動画ファイルは {INPUT_DIR} にそのまま残ります（非破壊処理）\n")
    
    # 出力ディレクトリの作成
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)
    
    success_count = 0
    failed_count = 0
    processed_videos = []
    
    for video_file in video_files:
        print(f"処理中: {video_file.name}")
        print("-" * 60)
        
        # 動画情報を取得
        info = get_video_info(video_file)
        if info:
            duration = info.get('duration', 0)
            width = info.get('width', 0)
            height = info.get('height', 0)
            print(f"  元のサイズ: {width}x{height}, 再生時間: {duration}秒")
        
        # 出力ファイル名（元のファイル名を保持、拡張子を.mp4に統一）
        output_name = video_file.stem + ".mp4"
        output_path = OUTPUT_DIR / output_name
        
        # 最大再生時間の決定
        max_duration = MAX_DURATION if MAX_DURATION > 0 else None
        if info and info.get('duration', 0) > 0:
            if max_duration and info['duration'] > max_duration:
                print(f"  ⚠️  再生時間が{max_duration}秒を超えています。{max_duration}秒に切り詰めます")
        
        # 動画を処理（元のファイルは変更しない）
        print(f"  → 変換中（元のファイルは保持されます）...")
        if process_video(video_file, output_path, max_duration):
            # ファイルサイズを確認
            original_size = video_file.stat().st_size / (1024 * 1024)  # MB
            new_size = output_path.stat().st_size / (1024 * 1024)  # MB
            print(f"  ✓ 変換完了: {output_path.name}")
            print(f"    元のファイル: {video_file.name} ({original_size:.2f}MB) - 保持されました")
            print(f"    処理済みファイル: {output_path.name} ({new_size:.2f}MB)")
            
            # サムネイルを生成
            thumbnail_path = THUMBNAIL_DIR / (video_file.stem + ".jpg")
            print(f"  → サムネイル生成中...")
            if generate_thumbnail(video_file, thumbnail_path):
                print(f"  ✓ サムネイル生成完了: {thumbnail_path.name}")
            
            processed_videos.append({
                'original': video_file.name,
                'processed': output_name,
                'thumbnail': thumbnail_path.name if thumbnail_path.exists() else None
            })
            success_count += 1
        else:
            print(f"  ✗ 変換に失敗しました")
            failed_count += 1
        
        print()
    
    # 結果サマリー
    print("="*60)
    print("処理完了")
    print("="*60)
    print(f"成功: {success_count}個")
    print(f"失敗: {failed_count}個")
    
    if processed_videos:
        print(f"\n処理された動画:")
        for video in processed_videos:
            print(f"  - {video['processed']}")
        
        # 動画情報をJSONファイルに保存
        info_file = OUTPUT_DIR / "videos_info.json"
        with open(info_file, 'w', encoding='utf-8') as f:
            json.dump(processed_videos, f, ensure_ascii=False, indent=2)
        print(f"\n動画情報を保存しました: {info_file}")
        
        print(f"\n出力先:")
        print(f"  元の動画（保持）: {INPUT_DIR}")
        print(f"  処理済み動画: {OUTPUT_DIR}")
        print(f"  サムネイル: {THUMBNAIL_DIR}")
        print(f"\n次のステップ:")
        print(f"1. Excelファイルの設定シートに「Hero動画パス」列を追加")
        print(f"2. 処理済み動画ファイル名を指定（例: video1.mp4）")
        print(f"3. ウェブサイトをリロードして確認")
        print(f"\n💡 元の動画ファイルは {INPUT_DIR} にそのまま残っています")
    else:
        print("\n処理されたファイルがありません。")
    
    print("="*60)

if __name__ == "__main__":
    try:
        process_hero_videos()
    except KeyboardInterrupt:
        print("\n\n処理が中断されました。")
        sys.exit(1)
    except Exception as e:
        print(f"\n予期しないエラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
