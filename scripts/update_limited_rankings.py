#!/usr/bin/env python3
# Centralized updater: keep previous snapshots when 17Lands is unavailable.
import html
import json
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SETS = {
    "fra": ("FRA", "リアリティ・フラクチャー"),
    "hob": ("HOB", "ホビット"),
    "msh": ("MSH", "マーベル・スーパー・ヒーローズ"),
    "sos": ("SOS", "ストリクスヘイヴンの秘密"),
    "tmt": ("TMT", "ティーンエイジ・ミュータント・ニンジャ・タートルズ"),
}
OUT = Path(__file__).resolve().parents[1] / "limited-ranking-data.json"
UA = "MAGSTA-Limited-Ranking-Updater/1.2"
PAIR_CODES = {"WU", "UB", "BR", "RG", "GW", "WB", "BG", "GU", "UR", "RW"}
JP_ARCH = {
    "WU": "白青（アゾリウス）", "UB": "青黒（ディミーア）", "BR": "黒赤（ラクドス）",
    "RG": "赤緑（グルール）", "GW": "緑白（セレズニア）", "WB": "白黒（オルゾフ）",
    "BG": "黒緑（ゴルガリ）", "GU": "緑青（シミック）", "UR": "青赤（イゼット）",
    "RW": "赤白（ボロス）",
}


def load_previous():
    try:
        return json.loads(OUT.read_text(encoding="utf-8"))
    except Exception:
        return {"sets": {}}


def fetch_text(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/json"})
    with urllib.request.urlopen(req, timeout=20) as res:
        return res.read().decode("utf-8", errors="replace")


def fetch_json(url):
    return json.loads(fetch_text(url))


def fetch_set(code):
    params = urllib.parse.urlencode({
        "expansion": code,
        "event_type": "PremierDraft",
        "time_period": "ALL_TIME",
    })
    urls = [
        f"https://www.17lands.com/api/card_data?{params}",
        f"https://www.17lands.com/card_ratings/data?expansion={code}&event_type=PremierDraft",
    ]
    last_error = None
    for url in urls:
        try:
            data = fetch_json(url)
            if isinstance(data, dict):
                data = data.get("data") or data.get("cards") or []
            if isinstance(data, list) and data:
                return data
        except Exception as exc:
            last_error = exc
    raise RuntimeError(last_error or "no data")


def normalized_ranking(rows):
    items = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        name = row.get("name") or row.get("card_name")
        wr = row.get("ever_drawn_win_rate")
        games = row.get("ever_drawn_game_count")
        if wr is None:
            wr = row.get("win_rate")
        if games is None:
            games = row.get("game_count")
        if not name or wr is None:
            continue
        try:
            wr = float(wr)
            if wr <= 1:
                wr *= 100
            games = int(games or 0)
        except (TypeError, ValueError):
            continue
        if games and games < 100:
            continue
        items.append({"name": name, "wr": round(wr, 1), "games": games})
    items.sort(key=lambda x: (x["wr"], x["games"]), reverse=True)
    return items[:60]


def clean_cell(value):
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def fetch_archetypes(code):
    url = f"https://www.17lands.com/deck_color_data?expansion={urllib.parse.quote(code)}&format=PremierDraft"
    page = fetch_text(url)
    rows = []
    for row_html in re.findall(r"<tr[^>]*>(.*?)</tr>", page, flags=re.I | re.S):
        cells = [clean_cell(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", row_html, flags=re.I | re.S)]
        if len(cells) < 4:
            continue
        match = re.search(r"\(([WUBRG]{2})\)", cells[0])
        if not match or match.group(1) not in PAIR_CODES:
            continue
        code_pair = match.group(1)
        try:
            wins = int(cells[1].replace(",", ""))
            games = int(cells[2].replace(",", ""))
            wr = float(cells[3].replace("%", ""))
        except ValueError:
            continue
        rows.append({"code": code_pair, "name": JP_ARCH[code_pair], "wins": wins, "games": games, "wr": wr})
    if not rows:
        raise RuntimeError("no archetype rows")
    rows.sort(key=lambda x: (x["wr"], x["games"]), reverse=True)
    return rows


def main():
    previous = load_previous()
    prev_sets = previous.get("sets", {})
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    output = {"generatedAt": now, "source": "17Lands PremierDraft", "sets": {}}

    for key, (code, name) in SETS.items():
        old = prev_sets.get(key, {"code": code, "name": name, "updatedAt": None, "ranking": [], "archetypes": []})
        ranking = old.get("ranking", [])
        archetypes = old.get("archetypes", [])
        updated = False

        try:
            rows = fetch_set(code)
            fresh = normalized_ranking(rows)
            if fresh:
                ranking = fresh
                updated = True
                print(f"{code}: updated {len(ranking)} cards")
        except Exception as exc:
            print(f"{code}: card fetch failed ({exc}); kept previous snapshot")

        try:
            fresh_arch = fetch_archetypes(code)
            if fresh_arch:
                archetypes = fresh_arch
                updated = True
                print(f"{code}: updated {len(archetypes)} archetypes")
        except Exception as exc:
            print(f"{code}: archetype fetch failed ({exc}); kept previous snapshot")

        output["sets"][key] = {
            "code": code,
            "name": name,
            "updatedAt": now if updated else old.get("updatedAt"),
            "ranking": ranking,
            "archetypes": archetypes,
        }
        time.sleep(3)

    OUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
