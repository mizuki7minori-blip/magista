from datetime import date
from pathlib import Path
import json
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]

# A curated pool keeps the automatic picks relevant to MAGSTA. The script
# rotates three cards every week and refreshes their live Scryfall price data.
CARDS = [
    ("Mox Amber", "モックス・アンバー", "🏆 今週の注目", "軽量マナ加速として幅広いデッキで使われる定番カード。相場と需要の動きを追いたい1枚。", "注目度 ★★★★★"),
    ("Force of Will", "意思の力", "📈 値動き注目", "長く需要が続く代表的なカード。版・Foilによる価格差にも注目。", "注目度 ★★★★☆"),
    ("Cloud, Midgar Mercenary", "ミッドガルの傭兵、クラウド", "💎 隠れ注目", "FINAL FANTASY関連カードの需要とコレクション性をチェックしたい1枚。", "注目度 ★★★★☆"),
    ("Sol Ring", "太陽の指輪", "📈 値動き注目", "統率者で定番のマナ加速。印刷仕様による価格差が大きく、相場チェック向き。", "注目度 ★★★★☆"),
    ("The One Ring", "一つの指輪", "🏆 今週の注目", "高い人気とコレクション需要を持つ代表的なカード。仕様違いも含めて注目。", "注目度 ★★★★★"),
    ("Mana Crypt", "魔力の墓所", "💎 隠れ注目", "強力なマナ加速として知られるカード。版ごとの相場変化を追いたい1枚。", "注目度 ★★★★☆"),
    ("Orcish Bowmasters", "オークの弓使い", "📈 値動き注目", "多くの環境で意識される人気カード。需要と再録情報による価格変化をチェック。", "注目度 ★★★★☆"),
    ("Sheoldred, the Apocalypse", "黙示録、シェオルドレッド", "🏆 今週の注目", "スタンダード以外でも高い知名度を持つ人気カード。仕様ごとの相場を追いたい。", "注目度 ★★★★☆"),
    ("Ragavan, Nimble Pilferer", "敏捷なこそ泥、ラガバン", "💎 隠れ注目", "モダンなどで知られる人気カード。需要と供給の変化に注目。", "注目度 ★★★★☆"),
    ("Esper Sentinel", "エスパーの歩哨", "📈 値動き注目", "統率者などで使われる人気クリーチャー。コレクター需要も含めてチェック。", "注目度 ★★★★☆"),
    ("Dockside Extortionist", "波止場の恐喝者", "💎 隠れ注目", "統率者人気の高いカード。禁止・再録などのニュースが相場に影響しやすい。", "注目度 ★★★★☆"),
    ("Jeweled Lotus", "宝石の睡蓮", "🏆 今週の注目", "統率者向けの代表的なカード。高額カードとして市場動向を追いやすい。", "注目度 ★★★★★"),
]


def fetch_card(name: str):
    url = "https://api.scryfall.com/cards/named?exact=" + urllib.parse.quote(name)
    req = urllib.request.Request(url, headers={"User-Agent": "MAGSTA-weekly-pickup/1.0"})
    with urllib.request.urlopen(req, timeout=20) as response:
        return json.load(response)


def money(value):
    if not value:
        return "—"
    return f"${float(value):,.2f}"


def build_card(item, rank, scryfall):
    en, ja, label, reason, rating = item
    prices = scryfall.get("prices", {})
    price = prices.get("usd") or prices.get("usd_foil")
    return {
        "rank": rank,
        "en": en,
        "ja": ja,
        "label": label,
        "reason": reason,
        "rating": rating,
        "price": money(price),
        "updated": date.today().isoformat(),
        "image": (scryfall.get("image_uris") or {}).get("normal", ""),
        "scryfall_url": scryfall.get("scryfall_uri", ""),
    }


def render_jp(cards):
    cards_html = []
    for c in cards:
        featured = " pickup-featured" if c["rank"] == 1 else ""
        cards_html.append(f'''<article class="pickup-card{featured}"><div class="pickup-rank">{c["rank"]:02d}</div><div class="pickup-label">{c["label"]}</div><div class="pickup-symbol">{c["en"][0]}</div><div class="pickup-info"><h3>{c["ja"]}</h3><p>{c["reason"]}</p><div class="pickup-meta"><span>{c["rating"]}</span><span>{c["price"]} →</span></div></div></article>''')
    return "\n".join(cards_html)


def render_en(cards):
    cards_html = []
    for c in cards:
        featured = " pickup-featured" if c["rank"] == 1 else ""
        cards_html.append(f'''<article class="pickup-card{featured}"><div class="pickup-rank">{c["rank"]:02d}</div><div class="pickup-label">{c["label"]}</div><div class="pickup-symbol">{c["en"][0]}</div><div class="pickup-info"><h3>{c["en"]}</h3><p>{c["reason"]}</p><div class="pickup-meta"><span>{c["rating"]}</span><span>{c["price"]} →</span></div></div></article>''')
    return "\n".join(cards_html)


def replace_between(text, start_marker, end_marker, replacement):
    start = text.index(start_marker) + len(start_marker)
    end = text.index(end_marker, start)
    return text[:start] + replacement + text[end:]


def main():
    # Rotate the curated pool by ISO week. Every Saturday run therefore gets a
    # new set while remaining deterministic and reproducible.
    week = date.today().isocalendar().week
    selected = [CARDS[(week * 3 + i) % len(CARDS)] for i in range(3)]
    cards = []
    for rank, item in enumerate(selected, 1):
        try:
            data = fetch_card(item[0])
        except Exception as exc:
            print(f"Warning: Scryfall lookup failed for {item[0]}: {exc}")
            data = {"prices": {}}
        cards.append(build_card(item, rank, data))

    (ROOT / "pickup-data.json").write_text(json.dumps(cards, ensure_ascii=False, indent=2), encoding="utf-8")

    jp_path = ROOT / "index.html"
    jp = jp_path.read_text(encoding="utf-8")
    jp = replace_between(jp, '<!-- WEEKLY_PICKUP_START -->', '<!-- WEEKLY_PICKUP_END -->', render_jp(cards))
    jp = jp.replace('2026.08.22 更新', f'{date.today().strftime("%Y.%m.%d")} 更新')
    jp_path.write_text(jp, encoding="utf-8")

    en_path = ROOT / "en/index.html"
    en = en_path.read_text(encoding="utf-8")
    en = replace_between(en, '<!-- WEEKLY_PICKUP_START -->', '<!-- WEEKLY_PICKUP_END -->', render_en(cards))
    en = en.replace('Updated Aug. 22, 2026', f'Updated {date.today().strftime("%b. %d, %Y")}')
    en_path.write_text(en, encoding="utf-8")

    print("Updated weekly pickup cards:")
    for c in cards:
        print(f"{c['rank']}. {c['ja']} / {c['price']}")


if __name__ == "__main__":
    main()
