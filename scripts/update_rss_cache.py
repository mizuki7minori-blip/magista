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

def main():
    cache_path = Path('rss-cache.json')
    try:
        previous = json.loads(cache_path.read_text(encoding='utf-8'))
        old_items = previous.get('items', [])
    except (OSError, ValueError):
        old_items = []
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
    with cache_path.open('w',encoding='utf-8') as f:
        json.dump({'updatedAt':datetime.now(timezone.utc).isoformat(),'staleSources':stale_sources,'items':items},f,ensure_ascii=False,separators=(',',':'))
    print('RSS cache updated:', len(items))


if __name__ == '__main__':
    main()
