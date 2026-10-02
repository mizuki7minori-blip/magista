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
PAIRS = set(JP)
UA = "MAGSTA-Limited-Archetype-Updater/1.0"

def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))

def normalize(payload):
    rows = payload.get("data", payload) if isinstance(payload, dict) else payload
    if isinstance(rows, dict):
        rows = [{"code": k, "win_rate": v} for k, v in rows.items()]
    out = []
    for row in rows if isinstance(rows, list) else []:
        if not isinstance(row, dict):
            continue
        raw = row.get("code") or row.get("color") or row.get("colors") or row.get("deck_color") or row.get("name") or ""
        code = str(raw).upper()
        for pair in PAIRS:
            if pair in code:
                code = pair
                break
        if code not in PAIRS:
            continue
        games = row.get("games")
        if games is None: games = row.get("num_games")
        if games is None: games = row.get("game_count")
        wins = row.get("wins")
        if wins is None: wins = row.get("num_won")
        wr = row.get("win_rate")
        if wr is None: wr = row.get("game_win_rate")
        if wr is None: wr = row.get("wr")
        try:
            games = int(games or 0)
            wins = int(wins or 0)
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

def main():
    data = json.loads(OUT.read_text(encoding="utf-8"))
    changed = False
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    for key, code in SETS.items():
        params = urllib.parse.urlencode({
            "expansion": code,
            "event_type": "PremierDraft",
            "combine_splash": "true",
        })
        url = "https://www.17lands.com/color_ratings/data?" + params
        try:
            rows = normalize(fetch_json(url))
            if rows:
                data["sets"][key]["archetypes"] = rows
                data["sets"][key]["archetypesUpdatedAt"] = now
                changed = True
                print(f"{code}: saved {len(rows)} archetypes")
            else:
                print(f"{code}: no archetype rows; keeping previous")
        except Exception as exc:
            print(f"{code}: fetch failed ({exc}); keeping previous")
    if changed:
        data["generatedAt"] = now
        OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
