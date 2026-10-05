#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import argparse
import re

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "templates"
DRAFTS = ROOT / "drafts"

DAY_CONFIG = {
    0: ("monday", "週間ニュース", "news", "ニュース"),
    1: ("tuesday", "フォーマット別メタゲーム", "deck", "デッキ・環境"),
    2: ("wednesday", "今週の注目カード", "card", "新カード"),
    3: ("thursday", "市場・カード動向", "card", "新カード"),
    4: ("friday", "週末注目情報", "tournament", "大会"),
    5: ("saturday", "大会・デッキ速報", "tournament", "大会"),
    6: ("sunday", "今週のMAGSTAまとめ", "news", "ニュース"),
}

def jp_date(d):
    return f"{d.year}.{d.month:02d}.{d.day:02d}"

def title_for(d, topic):
    return f"【{d.month}月{d.day}日】{topic}"

def slug_for(topic):
    mapping = {
        "週間ニュース": "weekly-news",
        "フォーマット別メタゲーム": "metagame",
        "今週の注目カード": "featured-card",
        "市場・カード動向": "market",
        "週末注目情報": "weekend",
        "大会・デッキ速報": "tournament",
        "今週のMAGSTAまとめ": "weekly-roundup",
    }
    return mapping[topic]

def generate(target):
    weekday_slug, topic, category, category_label = DAY_CONFIG[target.weekday()]
    template_path = TEMPLATES / f"article-{weekday_slug}.html"
    if not template_path.exists():
        raise SystemExit(f"Template not found: {template_path}")

    title = title_for(target, topic)
    filename = f"article-{slug_for(topic)}-{target.isoformat()}.html"
    output = DRAFTS / filename
    DRAFTS.mkdir(exist_ok=True)

    if output.exists():
        print(f"Draft already exists: {output.relative_to(ROOT)}")
        return output

    content = template_path.read_text(encoding="utf-8")
    replacements = {
        "{{TITLE}}": title,
        "{{DATE_DISPLAY}}": jp_date(target),
        "{{DATE}}": target.isoformat(),
        "{{LEAD}}": f"{target.month}月{target.day}日の{topic}をMAGSTA編集部が整理します。公開前に最新情報と出典を確認してください。",
        "{{EDITOR_COMMENT}}": "TODO: 確認できた事実と編集部の分析を分けて記載。",
    }
    for key, value in replacements.items():
        content = content.replace(key, value)

    content = re.sub(r"\{\{SECTION_(\d+)\}\}", r"TODO: この項目の情報を調査して記載。", content)
    content = re.sub(r"\{\{SOURCE_URL_(\d+)\}\}", "#", content)
    content = re.sub(r"\{\{SOURCE_NAME_(\d+)\}\}", r"TODO: 出典\1", content)

    draft_note = (
        '<div class="notice"><b>下書きプレビュー</b><br>'
        'このページは自動生成された翌日用の下書きです。調査・校閲後、'
        f'<code>{filename}</code> としてルートへ移動して公開してください。</div>'
    )
    content = content.replace('<div class="article-body">', '<div class="article-body">\n' + draft_note, 1)

    output.write_text(content, encoding="utf-8")
    print(f"Created: {output.relative_to(ROOT)}")
    print(f"Target weekday: {weekday_slug} / category: {category} ({category_label})")
    return output

def main():
    parser = argparse.ArgumentParser(description="Generate the next MAGSTA editorial draft.")
    parser.add_argument("--date", help="Target date in YYYY-MM-DD. Defaults to tomorrow in Asia/Tokyo.")
    args = parser.parse_args()

    if args.date:
        target = datetime.strptime(args.date, "%Y-%m-%d").date()
    else:
        now = datetime.now(ZoneInfo("Asia/Tokyo"))
        target = (now + timedelta(days=1)).date()

    generate(target)

if __name__ == "__main__":
    main()
