#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import argparse
import re
import json
import html

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "templates"
DRAFTS = ROOT / "drafts"
RSS_CACHE = ROOT / "rss-cache.json"

DAY_CONFIG = {
    0: ("monday", "週間ニュース", "news", "ニュース"),
    1: ("tuesday", "フォーマット別メタゲーム", "deck", "デッキ・環境"),
    2: ("wednesday", "今週の注目カード", "card", "新カード"),
    3: ("thursday", "市場・カード動向", "card", "新カード"),
    4: ("friday", "週末注目情報", "tournament", "大会"),
    5: ("saturday", "大会・デッキ速報", "tournament", "大会"),
    6: ("sunday", "今週のMAGSTAまとめ", "news", "ニュース"),
}


def load_candidates(category, limit=6):
    if not RSS_CACHE.exists():
        return []
    try:
        payload = json.loads(RSS_CACHE.read_text(encoding="utf-8"))
    except Exception:
        return []

    preferred = {
        "news": {"news", "tournament", "deck"},
        "deck": {"deck", "tournament", "news"},
        "card": {"card", "deck", "news"},
        "tournament": {"tournament", "deck", "news"},
    }.get(category, {"news", "deck", "tournament"})

    items = []
    for item in payload.get("items", []):
        if item.get("categoryKey") not in preferred:
            continue
        title = item.get("translatedTitle") or item.get("title") or ""
        link = item.get("link") or ""
        source = item.get("sourceName") or "外部情報"
        published = (item.get("pubDate") or "")[:10]
        summary = item.get("summary", {})
        summary_text = summary.get("text") if isinstance(summary, dict) else ""
        if not summary_text:
            summary_text = re.sub(r"<[^>]+>", " ", item.get("description") or "")
            summary_text = re.sub(r"\\s+", " ", html.unescape(summary_text)).strip()
        if not title or not link:
            continue
        items.append({
            "title": title.strip(),
            "link": link,
            "source": source,
            "published": published,
            "summary": summary_text[:240].strip(),
        })
        if len(items) >= limit:
            break
    return items


FORMAT_KEYWORDS = {
    "Standard": ("standard", "スタンダード"),
    "Pioneer": ("pioneer", "パイオニア"),
    "Modern": ("modern", "モダン"),
    "Legacy": ("legacy", "レガシー"),
    "Vintage": ("vintage", "ヴィンテージ"),
    "Commander": ("commander", "統率者"),
    "Pauper": ("pauper", "パウパー"),
}

def item_formats(item):
    haystack = (item.get("title", "") + " " + item.get("summary", "")).lower()
    found = []
    for name, keywords in FORMAT_KEYWORDS.items():
        if any(keyword.lower() in haystack for keyword in keywords):
            found.append(name)
    return found

def brief_item(item):
    title = html.escape(item.get("title", ""))
    link = html.escape(item.get("link", ""), quote=True)
    source = html.escape(item.get("source", "外部情報"))
    summary = re.sub(r"\\s+", " ", item.get("summary", "")).strip()
    if len(summary) > 150:
        summary = summary[:147].rstrip() + "…"
    summary = html.escape(summary)
    return (
        f'<a href="{link}" rel="noopener noreferrer">{title}</a>'
        f'（{source}）'
        + (f' — {summary}' if summary else '')
    )

def build_section_drafts(topic, category):
    items = load_candidates(category, limit=10)
    if not items:
        return {}

    if topic == "フォーマット別メタゲーム":
        def select(names):
            picked = [x for x in items if set(item_formats(x)) & set(names)]
            return picked[:3]

        main_formats = select({"Standard", "Pioneer", "Modern"})
        eternal = select({"Legacy", "Vintage"})
        casual = select({"Commander", "Pauper"})

        def prose(selected, fallback):
            if not selected:
                return fallback
            return " / ".join(brief_item(x) for x in selected)

        return {
            "1": "直近のRSSでは大会結果・新セット後の構築記事が中心。まず大会実績のある情報を優先し、個別デッキ記事は補助材料として確認します。",
            "2": prose(main_formats, "Standard / Pioneer / Modern の一次情報を追加確認して更新。"),
            "3": prose(eternal, "Legacy / Vintage の有力な直近候補はRSS内で不足。公式・大会結果を追加確認して更新。"),
            "4": prose(casual, "Commander / Pauper の候補を追加確認して更新。"),
            "5": "候補記事の中から、大会結果で複数回確認できるデッキや新セット由来の採用カードを優先してピックアップします。",
            "6": "RSSの話題量だけで環境トップとは判断せず、大会順位・採用数・複数イベントでの再現性を確認してから評価します。",
        }

    top = items[:4]
    joined = " / ".join(brief_item(x) for x in top)
    return {
        "1": joined,
        "2": "上記候補を一次情報で確認し、重要度の高いものから整理します。",
        "3": "関連フォーマットへの影響を確認して追記します。",
        "4": "採用デッキ・カード・大会結果のつながりを確認して追記します。",
        "5": "公開前に数値・カード名・日付を一次情報で再確認します。",
        "6": "確認できた事実とMAGSTA編集部の考察を分けて記載します。",
    }

def candidate_block(category):
    items = load_candidates(category)
    if not items:
        return '<section class="notice"><b>自動収集候補</b><br>RSSキャッシュから候補を取得できませんでした。公開前に最新情報を確認してください。</section>'

    cards = []
    for item in items:
        safe_title = html.escape(item["title"])
        safe_link = html.escape(item["link"], quote=True)
        safe_source = html.escape(item["source"])
        safe_date = html.escape(item["published"])
        safe_summary = html.escape(item["summary"])
        cards.append(
            f'<li><a href="{safe_link}" rel="noopener noreferrer">{safe_title}</a>'
            f'<br><small>{safe_source} / {safe_date}</small>'
            + (f'<p>{safe_summary}</p>' if safe_summary else '') +
            '</li>'
        )
    return (
        '<section class="notice"><b>自動収集した記事候補</b><br>'
        'RSSキャッシュから関連度の高い候補を抽出しています。'
        '数値・大会結果・カード名は公開前に一次情報で再確認してください。'
        '<ul>' + ''.join(cards) + '</ul></section>'
    )

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

def generate(target, refresh=False):
    weekday_slug, topic, category, category_label = DAY_CONFIG[target.weekday()]
    template_path = TEMPLATES / f"article-{weekday_slug}.html"
    if not template_path.exists():
        raise SystemExit(f"Template not found: {template_path}")

    title = title_for(target, topic)
    filename = f"article-{slug_for(topic)}-{target.isoformat()}.html"
    output = DRAFTS / filename
    DRAFTS.mkdir(exist_ok=True)

    if output.exists() and not refresh:
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

    section_drafts = build_section_drafts(topic, category)
    for number, value in section_drafts.items():
        content = content.replace(f"{{{{SECTION_{number}}}}}", value)
    content = re.sub(r"\{\{SECTION_(\d+)\}\}", r"TODO: この項目の情報を調査して記載。", content)
    content = re.sub(r"\{\{SOURCE_URL_(\d+)\}\}", "#", content)
    content = re.sub(r"\{\{SOURCE_NAME_(\d+)\}\}", r"TODO: 出典\1", content)

    draft_note = (
        '<div class="notice"><b>下書きプレビュー</b><br>'
        'このページは自動生成された翌日用の下書きです。調査・校閲後、'
        f'<code>{filename}</code> としてルートへ移動して公開してください。</div>'
    )
    auto_candidates = candidate_block(category)
    content = content.replace('<div class="article-body">', '<div class="article-body">\n' + draft_note + '\n' + auto_candidates, 1)

    output.write_text(content, encoding="utf-8")
    print(f"Created: {output.relative_to(ROOT)}")
    print(f"Target weekday: {weekday_slug} / category: {category} ({category_label})")
    return output

def main():
    parser = argparse.ArgumentParser(description="Generate the next MAGSTA editorial draft.")
    parser.add_argument("--date", help="Target date in YYYY-MM-DD. Defaults to tomorrow in Asia/Tokyo.")
    parser.add_argument("--refresh", action="store_true", help="Regenerate an existing draft with the latest RSS cache.")
    args = parser.parse_args()

    if args.date:
        target = datetime.strptime(args.date, "%Y-%m-%d").date()
    else:
        now = datetime.now(ZoneInfo("Asia/Tokyo"))
        target = (now + timedelta(days=1)).date()

    generate(target, refresh=args.refresh)

if __name__ == "__main__":
    main()
