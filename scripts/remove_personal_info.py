#!/usr/bin/env python3
"""
Git filter-repo用のスクリプト: data/students.jsonから個人情報（name, nameEn）を削除
"""
import json
import sys

def remove_personal_info(content):
    """JSONファイルからnameとnameEnフィールドを削除"""
    if not content.strip():
        return content
    
    try:
        data = json.loads(content)
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    item.pop('name', None)
                    item.pop('nameEn', None)
        elif isinstance(data, dict):
            data.pop('name', None)
            data.pop('nameEn', None)
        
        return json.dumps(data, ensure_ascii=False, indent=2) + '\n'
    except (json.JSONDecodeError, TypeError):
        # JSONでない場合はそのまま返す
        return content

if __name__ == '__main__':
    content = sys.stdin.read()
    result = remove_personal_info(content)
    sys.stdout.write(result)
