"""Bounded HTTP retry, resumable page checkpoints and atomic complete snapshots."""
import json
import socket
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path


def atomic_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)


def request_json(url, attempts=3, interval=.15):
    for attempt in range(attempts):
        time.sleep(interval)
        req = urllib.request.Request(url, headers={'User-Agent': 'MAGSTA-Draft-Calibration/2.0', 'Accept': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=20) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            if exc.code != 429 and not 500 <= exc.code < 600:
                raise
            wait = exc.headers.get('Retry-After', '') if exc.headers else ''
            try:
                delay = float(wait) if wait.isdigit() else max(0, (parsedate_to_datetime(wait) - datetime.now(timezone.utc)).total_seconds())
            except (ValueError, TypeError, OverflowError):
                delay = min(8, 2 ** attempt)
            if delay > 30:
                raise RuntimeError(f'rate limited; retry after {wait} (checkpoint retained)') from exc
        except (urllib.error.URLError, TimeoutError, socket.timeout) as exc:
            if '403' in str(exc):
                raise
            delay = min(8, 2 ** attempt)
        if attempt == attempts - 1:
            raise RuntimeError(f'retry limit reached: {url}')
        time.sleep(delay)


def paginate(source, checkpoint=None, interval=.15, attempts=3):
    host = urllib.parse.urlparse(source).netloc
    url, rows, visited, expected = source, [], [], None
    if checkpoint and Path(checkpoint).exists():
        try:
            saved = json.loads(Path(checkpoint).read_text())
        except (ValueError, OSError):
            saved = {}
        if not isinstance(saved, dict):
            saved = {}
        if isinstance(saved.get('rows'), list) and isinstance(saved.get('visited'), list) and 'next' in saved and saved.get('source') == source and time.time() - saved.get('savedAt', 0) < 86400 and (saved.get('next') or saved.get('expectedTotal') is None or len(saved.get('rows', [])) == saved.get('expectedTotal')):
            url, rows, visited, expected = saved['next'], saved['rows'], saved['visited'], saved.get('expectedTotal')
    while url:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != 'https' or parsed.netloc != host or url in visited:
            raise ValueError('invalid pagination URL')
        payload = request_json(url, attempts=attempts, interval=interval)
        if isinstance(payload, list):
            page, next_url = payload, None
        elif isinstance(payload, dict):
            page = payload.get('data', payload.get('cards'))
            next_url = payload.get('next_page') or payload.get('next')
            more = payload.get('has_more', bool(next_url))
            if more and not isinstance(next_url, str):
                raise ValueError('missing next_page')
            if not more:
                next_url = None
            if payload.get('total_cards') is not None:
                expected = int(payload['total_cards'])
        else:
            raise ValueError('invalid response format')
        if not isinstance(page, list):
            raise ValueError('invalid card list')
        rows.extend(page)
        visited.append(url)
        url = urllib.parse.urljoin(source, next_url) if next_url else None
        if checkpoint:
            atomic_json(checkpoint, {'source': source, 'savedAt': time.time(), 'rows': rows, 'visited': visited, 'next': url, 'expectedTotal': expected})
    if not rows:
        raise ValueError('empty card data')
    if expected is not None and len(rows) != expected:
        raise ValueError(f'incomplete API list: received {len(rows)}, expected {expected}')
    return rows, expected


def cached(path, ttl_hours, refresh=False):
    path = Path(path)
    if refresh or not path.exists() or time.time() - path.stat().st_mtime >= ttl_hours * 3600:
        return None
    try:
        payload = json.loads(path.read_text())
    except (ValueError, OSError):
        return None
    return payload if isinstance(payload, dict) and payload.get('complete') else None


def now():
    return datetime.now(timezone.utc).isoformat()
