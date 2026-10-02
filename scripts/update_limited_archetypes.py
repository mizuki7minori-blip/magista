#!/usr/bin/env python3
import json
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "limited-ranking-data.json"
SETS = {
    "fra": "FRA",
    "hob": "HOB",
    "msh": "MSH",
    "sos": "SOS",
    "tmt": "TMT",
}
JP = {
    "WU":"白青（アゾリウス）","UB":"青黒（ディミーア）","BR":"黒赤（ラクドス）",
    "RG":"赤緑（グルール）","GW":"緑白（セレズニア）","WB":"白黒（オルゾフ）",
    "BG":"黒緑（ゴルガリ）","GU":"緑青（シミック）","UR":"青赤（イゼット）",
    "RW":"赤白（ボロス）",
}
PAIRS = list(JP)
PAIR_BY_COLORS = {frozenset(code): code for code in PAIRS}
UA = "MAGSTA-Limited-Archetype-Updater/1.1"

def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))

def normalize_colors(payload):
    rows = payload.get("data", payload) if isinstance(payload, dict) else payload
    out = []
    for row in rows if isinstance(rows, list) else []:
        if not isinstance(row, dict):
            continue
        raw = row.get("short_name") or row.get("code") or row.get("color") or row.get("colors") or row.get("deck_color") or row.get("color_name") or ""
        code = str(raw).upper().strip()
        if len(code) == 2 and all(ch in "WUBRG" for ch in code):
            code = PAIR_BY_COLORS.get(frozenset(code), code)
        else:
            found = None
            for pair in PAIRS:
                if pair in code or pair[::-1] in code:
                    found = pair
                    break
            code = found or code
        if code not in JP:
            continue

        games = row.get("games")
        wins = row.get("wins")
        wr = row.get("win_rate")
        try:
            games = int(games or 0)
            wins = int(wins or 0)
            if wr is None and games:
                wr = wins / games
            wr = float(wr)
            if wr <= 1:
                wr *= 100
        except (TypeError, ValueError):
            continue
        out.append({"code": code, "name": JP[code], "wins": wins, "games": games, "wr": round(wr, 1)})

    best = {}
    for row in out:
        old = best.get(row["code"])
        if old is None or row["games"] > old["games"]:
            best[row["code"]] = row
    return sorted(best.values(), key=lambda x: (x["wr"], x["games"]), reverse=True)

def normalize_cards(payload):
    rows = payload.get("data", payload) if isinstance(payload, dict) else payload
    out = []
    for row in rows if isinstance(rows, list) else []:
        if not isinstance(row, dict):
            continue
        name = row.get("name") or row.get("card_name")
        wr = row.get("ever_drawn_win_rate")
        games = row.get("ever_drawn_game_count")
        if not name or wr is None:
            continue
        try:
            wr = float(wr)
            if wr <= 1:
                wr *= 100
            games = int(games or 0)
        except (TypeError, ValueError):
            continue
        if games < 50:
            continue
        out.append({"name": name, "wr": round(wr, 1), "games": games})
    out.sort(key=lambda x: (x["wr"], x["games"]), reverse=True)
    return out[:30]

def main():
    data = json.loads(OUT.read_text(encoding="utf-8"))
    changed = False
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    end_date = datetime.now(timezone.utc).date().isoformat()

    for key, code in SETS.items():
        set_data = data["sets"][key]
        color_params = urllib.parse.urlencode({
            "expansion": code,
            "event_type": "PremierDraft",
            "start_date": "2019-01-01",
            "end_date": end_date,
            "combine_splash": "false",
        })
        try:
            rows = normalize_colors(fetch_json("https://www.17lands.com/color_ratings/data?" + color_params))
            if rows:
                set_data["archetypes"] = rows
                set_data["archetypesUpdatedAt"] = now
                changed = True
                print(f"{code}: saved {len(rows)} archetypes")
        except Exception as exc:
            print(f"{code}: color ratings failed ({exc}); keeping previous")

        stored = dict(set_data.get("archetypeCards") or {})
        for pair in PAIRS:
            params = urllib.parse.urlencode({
                "expansion": code,
                "format": "PremierDraft",
                "colors": pair,
                "start_date": "2019-01-01",
                "end_date": end_date,
            })
            try:
                cards = normalize_cards(fetch_json("https://www.17lands.com/card_ratings/data?" + params))
                if cards:
                    stored[pair] = cards
                    changed = True
                    print(f"{code}/{pair}: saved {len(cards)} cards")
            except Exception as exc:
                print(f"{code}/{pair}: card ratings failed ({exc}); keeping previous")
        if stored:
            set_data["archetypeCards"] = stored
            set_data["archetypeCardsUpdatedAt"] = now

    if changed:
        data["generatedAt"] = now
        OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
