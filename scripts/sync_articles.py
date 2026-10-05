#!/usr/bin/env python3
from pathlib import Path
import html
import re
from datetime import date

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "article-data.js"
SITEMAP = ROOT / "sitemap.xml"

ARTICLE_GLOB = "article-*.html"
EXCLUDED = {"articles.html"}

def text_content(raw):
    raw = re.sub(r"<script[\s\S]*?</script>", "", raw, flags=re.I)
    raw = re.sub(r"<style[\s\S]*?</style>", "", raw, flags=re.I)
    raw = re.sub(r"<[^>]+>", " ", raw)
    return re.sub(r"\s+", " ", html.unescape(raw)).strip()

def first_match(pattern, raw, default=""):
    m = re.search(pattern, raw, flags=re.I | re.S)
    return html.unescape(m.group(1)).strip() if m else default

def infer_category(raw):
    tag = first_match(r'<span class="tag\s+([^"]+)"[^>]*>', raw).lower()
    if "limited" in tag or "リミテッド" in raw[:5000]:
        return "limited"
    if "tournament" in tag or "週末注目" in raw[:5000]:
        return "tournament"
    if "deck" in tag or "メタゲーム" in raw[:5000]:
        return "deck"
    return "news"

def infer_label(raw, category):
    label = first_match(r'<span class="tag[^"]*"[^>]*>(.*?)</span>', raw)
    label = text_content(label)
    if label:
        return label
    return {"news":"NEWS","tournament":"大会・環境","limited":"リミテッド","deck":"デッキ・環境"}.get(category, "NEWS")

def infer_date(path, raw):
    dt = first_match(r'<time[^>]+datetime="(\d{4}-\d{2}-\d{2})"', raw)
    if dt:
        return dt
    m = re.search(r"(20\d{2})-(\d{2})-(\d{2})", path.name)
    if m:
        return "-".join(m.groups())
    return date.today().isoformat()

def js_escape(value):
    return value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")

def article_record(path):
    raw = path.read_text(encoding="utf-8")
    title = first_match(r"<h1[^>]*>(.*?)</h1>", raw) or first_match(r"<title>(.*?)</title>", raw)
    title = text_content(title).replace("｜MAGSTA MTG", "").replace("｜MAGSTA", "").strip()
    desc = first_match(r'<meta\s+name="description"\s+content="([^"]*)"', raw)
    if not desc:
        desc = text_content(first_match(r'<p class="article-lead"[^>]*>(.*?)</p>', raw))
    category = infer_category(raw)
    label = infer_label(raw, category)
    published = infer_date(path, raw)
    return {
        "path": path.name,
        "category": category,
        "label": label,
        "title": title,
        "desc": desc,
        "date": published,
    }

def sync_article_data():
    content = DATA.read_text(encoding="utf-8")
    registered = set(re.findall(r'path:"([^"]+)"', content))
    records = []
    for path in sorted(ROOT.glob(ARTICLE_GLOB)):
        if path.name in EXCLUDED or path.name in registered:
            continue
        records.append(article_record(path))
    if not records:
        return False, []

    lines = []
    for r in records:
        lines.append(
            '  {path:"%s",category:"%s",label:"%s",title:"%s",desc:"%s",date:"%s"}'
            % tuple(js_escape(r[k]) for k in ("path","category","label","title","desc","date"))
        )
    insertion = ",\n" + ",\n".join(lines)
    content = re.sub(r"\n\];\s*$", insertion + "\n];\n", content)
    DATA.write_text(content, encoding="utf-8")
    return True, records

def sync_sitemap():
    content = SITEMAP.read_text(encoding="utf-8")
    known = set(re.findall(r"<loc>https://magsta\.jp/([^<]+)</loc>", content))
    additions = []
    for path in sorted(ROOT.glob(ARTICLE_GLOB)):
        if path.name in EXCLUDED or path.name in known:
            continue
        raw = path.read_text(encoding="utf-8")
        modified = infer_date(path, raw)
        additions.append(
            f'  <url><loc>https://magsta.jp/{path.name}</loc><lastmod>{modified}</lastmod>'
            f'<changefreq>weekly</changefreq><priority>0.8</priority></url>'
        )
    if not additions:
        return False, []
    content = content.replace("</urlset>", "\n".join(additions) + "\n</urlset>")
    SITEMAP.write_text(content, encoding="utf-8")
    return True, additions

def main():
    data_changed, records = sync_article_data()
    sitemap_changed, additions = sync_sitemap()
    if data_changed:
        print("article-data.js: added", ", ".join(r["path"] for r in records))
    else:
        print("article-data.js: already up to date")
    if sitemap_changed:
        print("sitemap.xml: added", len(additions), "URL(s)")
    else:
        print("sitemap.xml: already up to date")

if __name__ == "__main__":
    main()
