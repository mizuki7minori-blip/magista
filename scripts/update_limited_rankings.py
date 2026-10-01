#!/usr/bin/env python3
import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SETS = {
    "fra": ("FRA", "リアリティ・フラクチャー"),
    "hob": ("HOB", "The Hobbit"),
    "msh": ("MSH", "Marvel Super Heroes"),
    "sos": ("SOS", "Secrets of Strixhaven"),
    "tmt": ("TMT", "Teenage Mutant Ninja Turtles"),
}
OUT = Path(__file__).resolve().parents[1] / "limited-ranking-data.json"
UA = "MAGSTA-Limited-Ranking-Updater/1.0"


def load_previous():
    try:
        return json.loads(OUT.read_text(encoding="utf-8"))
    except Exception:
        return {"sets": {}}


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as res:
        return json.load(res)


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
        # Avoid tiny-sample cards dominating the ranking when counts are available.
        if games and games < 100:
            continue
        items.append({"name": name, "wr": round(wr, 1), "games": games})
    items.sort(key=lambda x: (x["wr"], x["games"]), reverse=True)
    return items[:10]


def main():
    previous = load_previous()
    prev_sets = previous.get("sets", {})
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    output = {"generatedAt": now, "source": "17Lands PremierDraft", "sets": {}}

    for key, (code, name) in SETS.items():
        old = prev_sets.get(key, {"code": code, "name": name, "updatedAt": None, "ranking": []})
        try:
            rows = fetch_set(code)
            ranking = normalized_ranking(rows)
            if ranking:
                output["sets"][key] = {"code": code, "name": name, "updatedAt": now, "ranking": ranking}
                print(f"{code}: updated {len(ranking)} cards")
            else:
                output["sets"][key] = old
                print(f"{code}: no usable ranking; kept previous snapshot")
        except Exception as exc:
            output["sets"][key] = old
            print(f"{code}: fetch failed ({exc}); kept previous snapshot")
        time.sleep(3)

    OUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
