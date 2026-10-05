from html.parser import HTMLParser
from urllib.parse import urlparse, urlencode
import html as html_tools
import json
import re
import urllib.request
from pathlib import Path
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

SOURCES = [
    ('MTG公式日本語（検索）','ja','source-wizards-ja','https://news.google.com/rss/search?q=site%3Amagic.wizards.com%2Fja%2Fnews+MTG&hl=ja&gl=JP&ceid=JP%3Aja'),
    ('MTG日本公式（検索）','ja','source-official','https://news.google.com/rss/search?q=site%3Amtg-jp.com+%28MTG+OR+%E3%83%9E%E3%82%B8%E3%83%83%E3%82%AF%29&hl=ja&gl=JP&ceid=JP%3Aja'),
    ('晴れる屋記事（検索RSS）','ja','source-hareruya-article','https://news.google.com/rss/search?q=site%3Aarticle.hareruyamtg.com%2Farticle%2F+MTG&hl=ja&gl=JP&ceid=JP%3Aja'),
    ('イゼ速。','ja','source-izzet','https://www.izzetmtgnews.com/feed'),
    ('BIGWEB（記事検索）','ja','source-bigweb','https://news.google.com/rss/search?q=site%3Amtg.bigweb.co.jp%2Farticles+%28MTG+OR+%E3%83%9E%E3%82%B8%E3%83%83%E3%82%AF%29&hl=ja&gl=JP&ceid=JP%3Aja'),
    ('5chまとめ（MTG限定検索）','ja','source-5ch','https://news.google.com/rss/search?q=site%3A5chant.com+%28MTG+OR+%22%E3%83%9E%E3%82%B8%E3%83%83%E3%82%AF%22+OR+%22%E3%82%AE%E3%83%A3%E3%82%B6%E3%83%AA%E3%83%B3%E3%82%B0%22%29&hl=ja&gl=JP&ceid=JP%3Aja'),
    ('MTGGoldfish','en','source-goldfish','https://www.mtggoldfish.com/feed'),
    ('Magic: The Gathering（検索）','en','source-wizards-en','https://news.google.com/rss/search?q=site%3Amagic.wizards.com%2Fen%2Fnews+Magic%3A+The+Gathering&hl=en-US&gl=US&ceid=US%3Aen'),
]
TERMS = ['mtg','magic: the gathering','magic the gathering','マジック','ギャザリング','planeswalker','プレインズウォーカー','カードゲーム','tcg','ウィザーズ','wizards of the coast','マジックアリーナ','magic arena','commander','統率者','standard','スタンダード','modern','モダン','pioneer','パイオニア','legacy','レガシー','vintage','ヴィンテージ','pauper','パウパー','draft','リミテッド','booster','ブースター','secret lair','プレイブースター','コレクターブースター']

CATEGORY_TERMS = [
    ('tournament', ['大会','優勝','トップ8','top 8','top8','tournament','championship','finals','pro tour','world championship']),
    ('community', ['5ch','5ちゃん','スレ','掲示板','reddit','discussion','community']),
    ('new-card', ['新カード','新セット','プレビュー','スポイラー','spoiler','preview','revealed','new cards','secret lair']),
    ('price', ['価格','相場','買取','高騰','値上がり','値下がり','price','prices','market','spike']),
    ('deck', ['デッキ','deck','standard','modern','commander','legacy','vintage','パイオニア','スタンダード']),
]


def category(title, description, source_class):
    if source_class == 'source-5ch':
        return 'community'
    hay = (title + ' ' + clean(description)).lower()
    for key, words in CATEGORY_TERMS:
        if any(word in hay for word in words):
            return key
    return 'news'


def text(el, tag):
    x = el.find(tag)
    return (x.text or '').strip() if x is not None else ''


def clean(s):
    return re.sub(r'<[^>]+>', ' ', s or '').replace('&nbsp;', ' ').strip()


def iso_date(s):
    if not s: return ''
    try:
        return parsedate_to_datetime(s).astimezone(timezone.utc).isoformat()
    except Exception:
        try:
            return datetime.fromisoformat(s.replace('Z','+00:00')).astimezone(timezone.utc).isoformat()
        except Exception:
            return s


def parse_feed(name, lang, cls, url):
    req = urllib.request.Request(url, headers={'User-Agent':'MAGSTA-RSS-Updater/1.0'})
    with urllib.request.urlopen(req, timeout=20) as r:
        root = ET.fromstring(r.read())
    items = root.findall('.//item')
    if not items:
        items = root.findall('.//{http://www.w3.org/2005/Atom}entry')
    out=[]
    for item in items[:20]:
        title=text(item,'title') or text(item,'{http://www.w3.org/2005/Atom}title')
        link=text(item,'link')
        if not link:
            a=item.find('{http://www.w3.org/2005/Atom}link')
            link=a.attrib.get('href','') if a is not None else ''
        desc=text(item,'description') or text(item,'{http://www.w3.org/2005/Atom}summary')
        pub=text(item,'pubDate') or text(item,'{http://www.w3.org/2005/Atom}published') or text(item,'{http://www.w3.org/2005/Atom}updated')
        guid=text(item,'guid') or link
        hay=(title+' '+clean(desc)).lower()
        if lang=='en' or cls in ('source-wizards-ja','source-wizards-en','source-goldfish','source-izzet','source-hareruya-article','source-bigweb') or any(k in hay for k in TERMS):
            out.append({'id':guid or link,'title':title,'description':desc,'link':link,'image':'','pubDate':iso_date(pub),'sourceName':name,'sourceClass':cls,'language':lang,'categoryKey':category(title,desc,cls)})
    return out


# Extractive summaries preserve source wording and never invent a translation.
SUMMARY_VERSION = 'body-extract-ja-v1'
BODY_HOSTS = {'www.izzetmtgnews.com', 'izzetmtgnews.com',
              'article.hareruyamtg.com', 'mtg-jp.com', 'www.mtg-jp.com',
              'magic.wizards.com', 'mtg.bigweb.co.jp',
              'www.mtggoldfish.com', 'mtggoldfish.com'}


class ArticleParagraphs(HTMLParser):
    VOID = {'br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'wbr'}
    EXCLUDED = {'script', 'style', 'nav', 'footer', 'header', 'aside', 'form'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.parts = None
        self.paragraphs = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        marker = (attrs.get('class', '') + ' ' + attrs.get('id', '')).lower()
        scope = tag in {'article', 'main'} or any(
            word in marker for word in ('entry-content', 'post-content', 'article-body', 'article-content'))
        excluded = tag in self.EXCLUDED or any(
            word in marker for word in ('comment', 'related', 'advert', 'social', 'share-button'))
        if tag not in self.VOID:
            self.stack.append((tag, scope, excluded))
        if tag == 'p' and any(x[1] for x in self.stack) and not any(x[2] for x in self.stack):
            self.parts = []

    def handle_endtag(self, tag):
        if tag == 'p' and self.parts is not None:
            paragraph = re.sub(r'\s+', ' ', ''.join(self.parts)).strip()
            if paragraph:
                self.paragraphs.append(paragraph)
            self.parts = None
        for index in range(len(self.stack)-1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        if self.parts is not None and not any(x[2] for x in self.stack):
            self.parts.append(data)


def extract_summary(html, title, language='ja'):
    parser = ArticleParagraphs()
    parser.feed(html)
    paragraphs = [p for p in parser.paragraphs
                  if len(p) >= 35 and (language == 'en' or re.search(r'[ぁ-んァ-ヶ一-龥]', p))
                  and not re.search(r'無断転載|Cookie|クッキー|プライバシー|ログイン|コメントを|関連記事|subscribe|sign up|privacy policy|all rights reserved', p, re.I)]
    if sum(map(len, paragraphs)) < 180:
        return None
    candidates = []
    title_key = re.sub(r'\W+', '', title)
    for paragraph in paragraphs:
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9])', paragraph) if language == 'en' else re.findall(r'[^。！？]+[。！？]?', paragraph)
        for sentence in sentences:
            sentence = sentence.strip()
            if not 35 <= len(sentence) <= (350 if language == 'en' else 180):
                continue
            if language == 'en' and len(sentence.encode('utf-8')) > 450:
                continue
            if re.sub(r'\W+', '', sentence) == title_key or sentence in candidates:
                continue
            candidates.append(sentence)
    if not candidates:
        return None
    # Prefer concrete facts, retaining the original order in the final excerpt.
    ranked = sorted(range(len(candidates)), key=lambda i: (
        -(2 * bool(re.search(r'\d|発売|発表|優勝|採用|禁止|変更|再録|販売|release|announc|banned|winner|sale', candidates[i]))), i))
    chosen = []
    size = 0
    for index in ranked:
        if len(chosen) == 3:
            break
        if size + len(candidates[index]) <= (700 if language == 'en' else 300):
            chosen.append(index)
            size += len(candidates[index])
    points = [candidates[i] for i in sorted(chosen)]
    return {'text': ''.join(points), 'points': points, 'language': language,
            'method': SUMMARY_VERSION, 'source': 'article-body',
            'generatedAt': datetime.now(timezone.utc).isoformat()}



EN_SUMMARY_VERSION = 'body-extract-en-ja-v1'
TRANSLATION_DAILY_BUDGET = 4000


def translation_state(previous):
    today = datetime.now(timezone.utc).date().isoformat()
    state = previous.get('translationState', {})
    if state.get('day') != today:
        return {'day': today, 'characters': 0}
    return {'day': today, 'characters': max(0, int(state.get('characters', 0))),
            'blocked': bool(state.get('blocked', False))}


def translate_japanese(text, state):
    if state.get('blocked') or state['characters'] + len(text) > TRANSLATION_DAILY_BUDGET:
        return None
    if not text or len(text.encode('utf-8')) > 500:
        return None
    # Count attempts as well as successes, so retries cannot bypass the daily cap.
    state['characters'] += len(text)
    url = 'https://api.mymemory.translated.net/get?' + urlencode({'q': text, 'langpair': 'en|ja'})
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'MAGSTA-RSS-Updater/1.2'})
        with urllib.request.urlopen(request, timeout=8) as response:
            data = json.loads(response.read(100000).decode('utf-8'))
        if str(data.get('responseStatus')) in {'403', '429'} or data.get('quotaFinished'):
            state['blocked'] = True
            return None
        if str(data.get('responseStatus')) != '200':
            return None
        result = html_tools.unescape(data.get('responseData', {}).get('translatedText', '')).strip()
        if not result or not re.search(r'[ぁ-んァ-ヶ一-龥]', result):
            return None
        return result
    except Exception as error:
        if getattr(error, 'code', None) in (403, 429):
            state['blocked'] = True
        print('Translation unavailable:', type(error).__name__)
        return None


def translate_summary(summary, title, state, old=None):
    old = old or {}
    reused = dict(zip(old.get('originalPoints', []), old.get('points', [])))
    translated = []
    for original in summary['points']:
        result = reused.get(original) or translate_japanese(original, state)
        if not result:
            # Keep successful segments for the next run; publish only complete summaries.
            return None, {'originalPoints': summary['points'][:len(translated)],
                          'points': translated}
        translated.append(result)
    result = dict(summary, text=''.join(translated), points=translated,
                  originalPoints=summary['points'], originalLanguage='en',
                  language='ja', method=EN_SUMMARY_VERSION, translationProvider='MyMemory')
    translated_title = translate_japanese(title, state) if len(title.encode('utf-8')) <= 500 else None
    return result, {'translatedTitle': translated_title}


class SummaryRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        target = urlparse(newurl)
        if target.scheme != 'https' or target.hostname not in BODY_HOSTS:
            raise ValueError('Unsupported article redirect')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def enrich_summaries(items, old_items, limit=8, state=None):
    previous = {item.get('link'): item for item in old_items}
    remaining = {'ja': limit, 'en': 3}
    state = state if state is not None else translation_state({})
    opener = urllib.request.build_opener(SummaryRedirects())
    for item in items:
        language = item.get('language')
        if language not in ('ja', 'en'):
            continue
        link = item.get('link', '')
        target = urlparse(link)
        if target.scheme != 'https' or target.hostname not in BODY_HOSTS:
            continue
        if target.hostname == 'magic.wizards.com' and not target.path.startswith('/' + language + '/'):
            continue
        old = previous.get(link, {})
        same = all(old.get(key) == item.get(key) for key in ('title', 'description', 'pubDate'))
        expected_method = EN_SUMMARY_VERSION if language == 'en' else SUMMARY_VERSION
        if same and old.get('summary', {}).get('method') == expected_method:
            item['summary'] = old['summary']
            if old.get('translatedTitle'):
                item['translatedTitle'] = old['translatedTitle']
            continue
        if same and old.get('translationPartial'):
            item['translationPartial'] = old['translationPartial']
        if same and old.get('summaryAttemptedAt'):
            try:
                age = datetime.now(timezone.utc).timestamp() - datetime.fromisoformat(old['summaryAttemptedAt']).timestamp()
                if 0 <= age < 86400:
                    item['summaryAttemptedAt'] = old['summaryAttemptedAt']
                    continue
            except (ValueError, TypeError):
                pass
        if remaining[language] <= 0 or (language == 'en' and (state.get('blocked') or state['characters'] >= TRANSLATION_DAILY_BUDGET)):
            continue
        remaining[language] -= 1
        item['summaryAttemptedAt'] = datetime.now(timezone.utc).isoformat()
        try:
            request = urllib.request.Request(link, headers={'User-Agent': 'MAGSTA-RSS-Updater/1.1'})
            with opener.open(request, timeout=6) as response:
                if 'text/html' not in response.headers.get('Content-Type', ''):
                    continue
                raw = response.read(1500001)
                if len(raw) > 1500000:
                    continue
                html = raw.decode(response.headers.get_content_charset() or 'utf-8', errors='replace')
            summary = extract_summary(html, item.get('title', ''), language)
            if summary and language == 'en':
                summary, extra = translate_summary(summary, item.get('title', ''), state,
                                                  item.get('translationPartial'))
                if extra.get('translatedTitle'):
                    item['translatedTitle'] = extra['translatedTitle']
                elif extra.get('points'):
                    item['translationPartial'] = extra
            if summary:
                item['summary'] = summary
                item.pop('translationPartial', None)
        except Exception as error:
            print('Article summary unavailable:', target.hostname, type(error).__name__)


def main():
    cache_path = Path('rss-cache.json')
    try:
        previous = json.loads(cache_path.read_text(encoding='utf-8'))
        old_items = previous.get('items', [])
    except (OSError, ValueError):
        old_items = []
        previous = {}
    all_items=[]
    stale_sources=[]
    succeeded=0
    for source in SOURCES:
        try:
            all_items.extend(parse_feed(*source))
            succeeded+=1
        except Exception as e:
            print('RSS failed:', source[0], e)
            # A temporary feed error should not erase its recent articles.
            cutoff = datetime.now(timezone.utc).timestamp() - 7*86400
            retained = 0
            for item in old_items:
                if item.get('sourceClass') != source[2]:
                    continue
                try:
                    if datetime.fromisoformat(item['pubDate'].replace('Z','+00:00')).timestamp() >= cutoff:
                        all_items.append(item)
                        retained += 1
                except (KeyError, ValueError, TypeError):
                    pass
            if retained:
                stale_sources.append(source[2])

    if not succeeded:
        raise RuntimeError('All RSS feeds failed; keeping the previous cache')
    unique={x.get('link'):x for x in all_items if x.get('title') and x.get('link')}
    by_source={}
    for item in sorted(unique.values(), key=lambda x:x.get('pubDate',''), reverse=True):
        by_source.setdefault(item.get('sourceClass'),[]).append(item)
    # Reserve room for smaller Japanese feeds even when one source has many posts.
    items=sorted((item for group in by_source.values() for item in group[:12]),
                 key=lambda x:x.get('pubDate',''),reverse=True)[:80]
    if not items:
        raise RuntimeError('No RSS articles fetched; keeping the previous cache')
    state = translation_state(previous)
    enrich_summaries(items, old_items, state=state)
    with cache_path.open('w',encoding='utf-8') as f:
        json.dump({'updatedAt':datetime.now(timezone.utc).isoformat(),'staleSources':stale_sources,'translationState':state,'items':items},f,ensure_ascii=False,separators=(',',':'))
    print('RSS cache updated:', len(items))


if __name__ == '__main__':
    main()
