from datetime import date
from pathlib import Path
import json

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
    ("🆕 新カード", [
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

day = date.today().toordinal()
cards = []
for i, (label, pool) in enumerate(LANES):
    name, en, desc = pool[(day + i) % len(pool)]
    cards.append({
        "rank": i + 1,
        "label": label,
        "name": name,
        "ja": name,
        "en": en,
        "desc": desc,
        "updated": date.today().isoformat()
    })

(ROOT / "pickup-data.json").write_text(
    json.dumps(cards, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8"
)
print(f"Updated {len(cards)} daily pickup cards for {date.today().isoformat()}")
