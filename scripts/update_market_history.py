"""Daily fixed-printing, nonfoil market sample. No invented prices/history."""
import argparse
import datetime as dt
import json
import math
import pathlib
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
FORMATS = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander', 'pauper']

def read(path, default):
    return json.loads(path.read_text()) if path.exists() else default

def number(value):
    try:
        result = float(value)
        return result if math.isfinite(result) and result > 0 else None
    except (TypeError, ValueError):
        return None

def request(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'MAGSTA-Market/1.0 (https://magsta.jp)', 'Accept': 'application/json'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                return json.load(response)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)

def bootstrap():
    from urllib.parse import urlencode
    cards = {}
    for fmt in FORMATS:
        query = urlencode({'q': f'game:paper f:{fmt} is:nonfoil -is:promo -is:funny -is:fullart -frame:showcase -frame:extendedart -border:borderless usd>0', 'order': 'edhrec', 'unique': 'cards'})
        page = request('https://api.scryfall.com/cards/search?' + query)
        for card in page['data'][:25]:
            if card['oracle_id'] not in cards:
                cards[card['oracle_id']] = {'id': card['id'], 'oracle_id': card['oracle_id'], 'name': card['name'], 'set': card['set'], 'collector_number': card['collector_number'], 'formats': []}
            cards[card['oracle_id']]['formats'].append(fmt)
        time.sleep(.15)
    if len(cards) < 25:
        raise ValueError('Insufficient sample; will not freeze basket')
    return {'version': 1, 'created_at': dt.datetime.now(dt.timezone.utc).isoformat(), 'selection': 'Each format: first 25 priced nonfoil paper cards in Scryfall EDHREC order; deduplicated by oracle_id. Printing and format membership frozen at inception.', 'cards': list(cards.values())}

def domestic_quote(data, card, day, kind):
    # Explicit printing, finish, source, quote date, and kind required.
    quote = data.get('cards', {}).get(card['id'], {}).get(kind, {})
    if quote.get('currency') != 'JPY' or quote.get('finish') != 'nonfoil' or quote.get('date') != day:
        return None
    if not quote.get('source') or not str(quote.get('source_url', '')).startswith('https://'):
        return None
    value = number(quote.get('price'))
    return {'value': value, 'source': quote['source'], 'source_url': quote['source_url'], 'date': day} if value else None

def snapshot(basket, day):
    domestic = read(ROOT / 'domestic-prices.json', {})
    fx = None
    try:
        data = request('https://api.frankfurter.dev/v1/latest?base=USD&symbols=JPY')
        fx_day = dt.date.fromisoformat(data['date'])
        if 0 <= (dt.date.fromisoformat(day) - fx_day).days <= 7 and number(data['rates']['JPY']):
            fx = {'usd_jpy': data['rates']['JPY'], 'date': data['date'], 'source': 'Frankfurter / ECB', 'source_url': 'https://www.frankfurter.dev/'}
    except Exception as error:
        print('FX unavailable:', type(error).__name__)
    rows = []
    for card in basket['cards']:
        try:
            live = request('https://api.scryfall.com/cards/' + card['id'])
            usd = number(live.get('prices', {}).get('usd'))
        except Exception as error:
            print('Price unavailable:', card['id'], type(error).__name__)
            usd = None
        rows.append({'id': card['id'], 'usd': usd, 'jp_sale': domestic_quote(domestic, card, day, 'sale'), 'jp_buy': domestic_quote(domestic, card, day, 'buy')})
        time.sleep(.12)
    if not any(row['usd'] for row in rows):
        raise ValueError('No overseas quotes; history not changed')
    return {'date': day, 'observed_at': dt.datetime.now(dt.timezone.utc).isoformat(), 'fx': fx, 'cards': rows}

def value(row, metric, snapshot):
    if metric == 'usd':
        return number(row.get('usd'))
    if metric == 'usd_jpy':
        usd = number(row.get('usd'))
        fx = number((snapshot.get('fx') or {}).get('usd_jpy'))
        return usd * fx if usd and fx else None
    return number((row.get(metric) or {}).get('value'))

def index_series(basket, history, group, metric):
    ids = [c['id'] for c in basket['cards'] if group == 'all' or group in c['formats'] or group == 'set:' + c['set']]
    base = None
    points = []
    for snap in sorted(history, key=lambda x: x['date']):
        rows = {r['id']: r for r in snap['cards']}
        prices = [value(rows.get(id, {}), metric, snap) for id in ids]
        coverage = sum(p is not None for p in prices)
        index = None
        if ids and coverage == len(ids):
            if base is None:
                base = prices
            index = round(100 * sum(p / b for p, b in zip(prices, base)) / len(ids), 4)
        points.append({'date': snap['date'], 'index': index, 'coverage': coverage, 'total': len(ids)})
    return points

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--initialize', action='store_true')
    args = parser.parse_args()
    basket_path = ROOT / 'market-basket.json'
    if not basket_path.exists():
        if not args.initialize:
            raise SystemExit('Initialize basket with --initialize first')
        basket = bootstrap()
    else:
        basket = read(basket_path, {})
    day = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).date().isoformat()
    history_path = ROOT / 'market-history.json'
    history = read(history_path, {'snapshots': []})['snapshots']
    current = snapshot(basket, day)
    # Same-day refresh replaces that day, never creates duplicate observations.
    history = sorted([s for s in history if s['date'] != day] + [current], key=lambda s: s['date'])
    groups = ['all'] + FORMATS + sorted({'set:' + c['set'] for c in basket['cards']})
    output = {'updated_at': current['observed_at'], 'basket': basket, 'latest': current, 'series': {g: {m: index_series(basket, history, g, m) for m in ['usd', 'usd_jpy', 'jp_sale', 'jp_buy']} for g in groups}, 'snapshots': history}
    for path, data in [(basket_path, basket), (history_path, output)]:
        tmp = path.with_suffix('.tmp')
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
        tmp.replace(path)

if __name__ == '__main__':
    main()
