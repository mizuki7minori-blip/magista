from datetime import datetime, timedelta, timezone
from pathlib import Path
import json
import random
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]

# Three lanes: one card each, rotated daily. Images/details are resolved client-side
# from Scryfall so the repository does not depend on a fragile third-party image URL.
LANES = [
    ("🏆 大会注目", [
        ("一つの指輪", "The One Ring", "強力な防御能力とドローを両立する代表的なアーティファクト。競技シーンでの採用動向を追いたい1枚。"),
        ("黙示録、シェオルドレッド", "Sheoldred, the Apocalypse", "カードを引くこととライフのやり取りを強く意識させる人気クリーチャー。採用環境の変化に注目。"),
        ("敏捷なこそ泥、ラガバン", "Ragavan, Nimble Pilferer", "軽量ながら大きなリターンを狙える人気クリーチャー。フォーマットごとの採用状況を確認したい1枚。"),
        ("オークの弓使い", "Orcish Bowmasters", "相手のドローに反応して盤面へ影響を与える人気カード。メタゲームとの関係を追いやすい1枚。"),
    ]),
    ("🃏 カード注目", [
        ("稲妻", "Lightning Bolt", "1マナで3点を与えられる代表的な火力。古典的なカードが各フォーマットでどう使われるかを確認。"),
        ("完全なる統一、アトラクサ", "Atraxa, Grand Unifier", "戦場に出たときの大量アドバンテージが魅力の大型クリーチャー。多色戦略との相性に注目。"),
        ("死の飢えのタイタン、クロクサ", "Kroxa, Titan of Death’s Hunger", "手札と墓地の両方に干渉できる伝説のクリーチャー。墓地利用戦略との組み合わせをチェック。"),
        ("霊気貯蔵器", "Aetherflux Reservoir", "呪文を連続して唱える戦略で大きなリターンを狙えるアーティファクト。コンボ系デッキの動向と相性が良い。"),
    ]),
    ("💬 コミュニティ", [
        ("対抗呪文", "Counterspell", "2マナで呪文を打ち消す青の定番カード。フォーマットごとの採用枚数や評価を見比べやすい1枚。"),
        ("剣を鍬に", "Swords to Plowshares", "非常に軽いクリーチャー除去。相手にライフを与えるデメリットと引き換えに高い効率を持つ。"),
        ("エスパーの歩哨", "Esper Sentinel", "相手の非クリーチャー呪文に反応してカードアドバンテージを狙える人気カード。"),
        ("魔力の墓所", "Mana Crypt", "高速マナ加速として知られるカード。フォーマットやルール変更による評価の変化も追いやすい。"),
    ]),
]

# Pick from Japanese-language paper printings across the Scryfall card catalog.
# The original editorial pool remains the offline fallback, not the primary source.
RANDOM_LANES = [
    ("🎲 クリーチャー", "lang:ja game:paper t:creature -is:token"),
    ("🎲 インスタント・ソーサリー", "lang:ja game:paper (t:instant or t:sorcery)"),
    ("🎲 その他のカード", "lang:ja game:paper (t:artifact or t:enchantment or t:planeswalker or t:land) -t:basic"),
]
HISTORY_PATH = ROOT / "pickup-history.json"
today = datetime.now(timezone(timedelta(hours=9))).date()
rng = random.SystemRandom()

try:
    history = json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
    if not isinstance(history, list):
        history = []
except (OSError, ValueError):
    history = []

# Keep enough history to make daily repeats unlikely without retaining it forever.
history = [
    row for row in history
    if isinstance(row, dict)
    and isinstance(row.get("date"), str)
    and 0 <= (today - datetime.fromisoformat(row["date"]).date()).days <= 30
] if all(isinstance(row, dict) and isinstance(row.get("date"), str)
         and len(row["date"]) == 10 for row in history) else []
recent_ids = {value for row in history for value in row.get("ids", [])}
recent_names = {value for row in history for value in row.get("en", [])}
today_ids = []
today_names = []


def image_url(data):
    image = data.get("image_uris") or {}
    if not image:
        face = next((f for f in data.get("card_faces", []) if f.get("image_uris")), {})
        image = face.get("image_uris") or {}
    return image.get("normal") or image.get("large") or ""


def make_card(data, label):
    if data.get("lang") != "ja" or not data.get("id"):
        return None
    faces = data.get("card_faces") or []
    primary = faces[0] if faces else data
    japanese_name = data.get("printed_name") or primary.get("printed_name")
    english_name = data.get("name")
    url = image_url(data)
    if not japanese_name or not english_name or not url.startswith("https://"):
        return None
    type_line = primary.get("printed_type_line") or primary.get("type_line") or "MTGカード"
    rules_text = (primary.get("printed_text") or data.get("printed_text") or "").replace("\n", " ")
    if len(rules_text) > 100:
        rules_text = rules_text[:100].rstrip() + "…"
    desc = f"{type_line}。{rules_text}" if rules_text else f"{type_line}。画像からカードを確認できます。"
    return {
        "label": label, "name": japanese_name, "ja": japanese_name,
        "en": english_name, "desc": desc,
        "card_id": data["id"], "oracle_id": data.get("oracle_id", ""),
        "image_url": url, "updated": today.isoformat()
    }


def fetch_random(query):
    url = "https://api.scryfall.com/cards/random?" + urlencode({"q": query})
    req = Request(url, headers={
        "User-Agent": "MAGSTA-Pickup/2.0 (https://magsta.jp)",
        "Accept": "application/json;q=0.9,*/*;q=0.8"
    })
    with urlopen(req, timeout=10) as response:
        return json.load(response)


cards = []
for index, (label, query) in enumerate(RANDOM_LANES):
    choice = None
    # Bounded retries: never force requests if Scryfall is unavailable or rate-limiting.
    for attempt in range(3):
        try:
            data = fetch_random(query)
            proposal = make_card(data, label)
            if proposal:
                key = proposal["oracle_id"] or proposal["en"]
                if key not in recent_ids and proposal["en"] not in recent_names and proposal["en"] not in today_names:
                    choice = proposal
                    break
        except Exception as error:
            print(f"Scryfall lookup unavailable ({label}): {error}")
            break
        finally:
            time.sleep(0.15)
    if choice is None:
        fallback_label, pool = LANES[index]
        candidates = [row for row in pool if row[1] not in recent_names and row[1] not in today_names]
        if not candidates:
            candidates = [row for row in pool if row[1] not in today_names] or pool
        ja, en, desc = rng.choice(candidates)
        choice = {
            "label": fallback_label, "name": ja, "ja": ja,
            "en": en, "desc": desc, "updated": today.isoformat()
        }
    choice["rank"] = index + 1
    cards.append(choice)
    today_names.append(choice["en"])
    if choice.get("oracle_id"):
        today_ids.append(choice["oracle_id"])

(ROOT / "pickup-data.json").write_text(
    json.dumps(cards, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
history = [row for row in history if row["date"] != today.isoformat()]
history.append({"date": today.isoformat(), "ids": today_ids, "en": today_names})
HISTORY_PATH.write_text(json.dumps(history, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Updated {len(cards)} pickup cards for {today.isoformat()} (Scryfall + offline fallback)")

# Keep the small editorial pool for browsers that cannot reach the live Scryfall API.
pool = [
    {"label": label, "cards": [
        {"label": label, "name": name, "ja": name, "en": en, "desc": desc}
        for name, en, desc in lane
    ]}
    for label, lane in LANES
]
(ROOT / "pickup-pool.json").write_text(
    json.dumps(pool, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
