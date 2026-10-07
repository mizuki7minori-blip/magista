#!/usr/bin/env python3
"""Full ratings kept separately from the production top-60 presentation snapshot."""
import argparse
import math
from datetime import date
import urllib.parse
from pathlib import Path
from draft_data_io import paginate, cached, atomic_json, now


def normalize(rows):
    result, invalid, missing, duplicates = {}, 0, 0, 0
    missing_metrics = {key: 0 for key in ['wr', 'gih_wr', 'oh_wr', 'games', 'ata', 'alsa', 'usage']}
    for row in rows:
        if not isinstance(row, dict) or not (row.get('name') or row.get('card_name')):
            missing += 1
            continue
        item = {'name': row.get('name') or row.get('card_name')}
        for key in ['scryfall_id', 'id', 'oracle_id', 'set', 'collector_number']:
            if row.get(key) is not None:
                item[key] = row[key]
        invalid_fields = set()
        for key, fields in {'wr': ['ever_drawn_win_rate', 'win_rate'], 'gih_wr': ['ever_drawn_win_rate'], 'oh_wr': ['opening_hand_win_rate'], 'games': ['ever_drawn_game_count', 'game_count'], 'ata': ['avg_pick'], 'alsa': ['avg_seen'], 'usage': ['play_rate']}.items():
            field = next((f for f in fields if row.get(f) is not None), None)
            raw = row[field] if field else None
            if raw is None:
                missing_metrics[key] += 1
                continue
            try:
                value = float(raw)
                if key in ['wr', 'gih_wr', 'oh_wr', 'usage'] and value <= 1:
                    value *= 100
                if not math.isfinite(value) or value < 0 or (key in ['wr', 'gih_wr', 'oh_wr', 'usage'] and value > 100):
                    raise ValueError('invalid metric')
                item[key] = value
            except (ValueError, TypeError):
                invalid_fields.add(field)
        invalid += len(invalid_fields)
        identity = item.get('scryfall_id') or (str(item.get('set')) + ':' + str(item['collector_number']) if item.get('set') and item.get('collector_number') else item.get('oracle_id') or item['name'].casefold())
        if identity in result:
            duplicates += 1
        else:
            result[identity] = item
    return list(result.values()), {'duplicates': duplicates, 'invalidValues': invalid, 'missingIdentity': missing, 'missingMetrics': missing_metrics, 'missingValues': sum(missing_metrics.values())}


def main():
    root = Path(__file__).resolve().parents[1]
    p = argparse.ArgumentParser()
    p.add_argument('--sets', nargs='+', default=['fra', 'hob', 'msh', 'sos', 'tmt'])
    p.add_argument('--output-dir', type=Path, default=root / 'data/draft-ratings')
    p.add_argument('--event', default='PremierDraft')
    p.add_argument('--start-date', required=True)
    p.add_argument('--end-date', required=True)
    p.add_argument('--ttl-hours', type=float, default=24)
    p.add_argument('--refresh', action='store_true')
    args = p.parse_args()
    try:
        if date.fromisoformat(args.start_date) > date.fromisoformat(args.end_date):
            p.error('start-date must not exceed end-date')
    except ValueError:
        p.error('dates must be YYYY-MM-DD')
    failed = False
    for code in args.sets:
        if not code.isalnum():
            p.error('invalid set code')
        target = args.output_dir / (code.lower() + '.json')
        checkpoint = target.with_suffix('.partial.json')
        params = urllib.parse.urlencode({'expansion': code.upper(), 'event_type': args.event, 'start_date': args.start_date, 'end_date': args.end_date})
        source = 'https://www.17lands.com/card_ratings/data?' + params
        try:
            old = cached(target, args.ttl_hours, args.refresh)
            if old and old.get('source') == source and old.get('schemaVersion') == 2:
                print(f'{code}: cached full ratings')
                ranking, validation, expected = old['ranking'], old['validation'], old.get('apiTotal')
                rows = None
            else:
                rows, expected = paginate(source, checkpoint, interval=1)
                ranking, validation = normalize(rows)
            if not ranking:
                raise ValueError('no identified rating records')
            if rows is not None:
                atomic_json(target, {'schemaVersion': 2, 'set': code.lower(), 'complete': True, 'source': source, 'fetchedAt': now(), 'event': args.event, 'startDate': args.start_date, 'endDate': args.end_date, 'definitions': {'ata': '17Lands avg_pick: average pick position when taken', 'alsa': '17Lands avg_seen: average last-seen position; not equal to ATA'}, 'apiTotal': expected, 'rawCount': len(rows), 'validation': validation, 'ranking': ranking})
            checkpoint.unlink(missing_ok=True)
            color_source = 'https://www.17lands.com/color_ratings/data?' + params + '&combine_splash=false'
            color_target = args.output_dir / (code.lower() + '-colors.json')
            try:
                color_old = cached(color_target, args.ttl_hours, args.refresh)
                if not color_old or color_old.get('source') != color_source:
                    colors, _ = paginate(color_source, color_target.with_suffix('.partial.json'), interval=1)
                    atomic_json(color_target, {'set': code.lower(), 'complete': True, 'source': color_source, 'fetchedAt': now(), 'event': args.event, 'startDate': args.start_date, 'endDate': args.end_date, 'rows': colors})
                    color_target.with_suffix('.partial.json').unlink(missing_ok=True)
            except Exception as color_error:
                print(f'{code}: color/archetype ratings unavailable ({color_error}); previous retained')
            print(f'{code}: saved {len(ranking)} full rating records')
        except Exception as exc:
            failed = True
            print(f'{code}: unavailable ({exc}); previous complete/partial data retained')
    raise SystemExit(1 if failed else 0)


if __name__ == '__main__':
    main()
