#!/usr/bin/env python3
"""Complete English print lists with retry/resume; old successful files remain on failure."""
import argparse
import math
import urllib.parse
import urllib.request
import time
from pathlib import Path
from draft_data_io import paginate, cached, atomic_json, now


def source_for_set(code):
    return 'https://api.scryfall.com/cards/search?' + urllib.parse.urlencode({'q': f'set:{code} game:paper lang:en', 'unique': 'prints'})


def fetch_set(code, checkpoint=None):
    source = source_for_set(code)
    rows, expected = paginate(source, checkpoint=checkpoint)
    unique, duplicates, missing = {}, 0, 0
    for card in rows:
        if not isinstance(card, dict):
            missing += 1
            continue
        identity = card.get('id') or ((card.get('set'), card.get('collector_number'), card.get('lang', 'en')) if card.get('collector_number') else card.get('oracle_id') or card.get('name'))
        if card.get('set') and card['set'].lower() != code.lower():
            raise ValueError('card set does not match requested set')
        if not identity:
            missing += 1
            continue
        if identity in unique:
            duplicates += 1
        else:
            unique[identity] = card
    invalid_values = 0
    missing_fields = 0
    for card in unique.values():
        missing_fields += any(card.get(key) is None for key in ['id', 'oracle_id', 'name', 'set', 'collector_number', 'type_line', 'rarity', 'cmc'])
        try:
            if not math.isfinite(float(card.get('cmc', 0))):
                invalid_values += 1
        except (TypeError, ValueError):
            invalid_values += 1
    return {'set': code, 'complete': True, 'source': source, 'fetchedAt': now(), 'apiTotal': expected, 'rawCount': len(rows), 'duplicates': duplicates, 'missingIdentity': missing, 'invalidValues': invalid_values, 'cardsMissingFields': missing_fields, 'cards': list(unique.values())}


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-dir', type=Path, default=root / 'data' / 'draft-cards')
    parser.add_argument('--sets', nargs='+', default=['fra', 'hob', 'msh', 'sos', 'tmt'])
    parser.add_argument('--ttl-hours', type=float, default=24)
    parser.add_argument('--refresh', action='store_true')
    args = parser.parse_args()
    failed = False
    for code in args.sets:
        if not code.isalnum():
            parser.error('set codes must be alphanumeric')
        target = args.output_dir / f'{code.lower()}.json'
        checkpoint = target.with_suffix('.partial.json')
        try:
            old = cached(target, args.ttl_hours, args.refresh)
            if old and old.get('source') == source_for_set(code.lower()):
                print(f'{code}: cached complete snapshot')
                continue
            payload = fetch_set(code.lower(), checkpoint)
            atomic_json(target, payload)
            checkpoint.unlink(missing_ok=True)
            print(f'{code}: saved {len(payload["cards"])} prints; duplicates {payload["duplicates"]}')
        except Exception as exc:
            failed = True
            print(f'{code}: unavailable ({exc}); successful snapshot and page checkpoint retained')
    raise SystemExit(1 if failed else 0)


if __name__ == '__main__':
    main()
