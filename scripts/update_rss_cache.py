import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

SOURCES = [
    ('MTG公式日本語（検索）','ja','source-wizards-ja','https://news.google.com/rss/search?q=site%3Amagic.wizards.com%2Fja%2Fnews+MTG&hl=ja&gl=JP&ceid=JP%3Aja'),
    ('MTG日本公式（検索）','ja','source-official','https://news.google.com/rss/search?q=site%3Amtg-jp.com+%28MTG+OR+%E3%83%9E%E3%82%B8%E3%83%83%E3%82%AF%29&hl=ja&gl=JP&ceid=JP%3Aja'),
    ('晴れる屋記事（検索RSS）','ja','source-hareruya-article','https://news.google.com/rss/search?q=site%3Aarticle.hareruyamtg.com%2Farticle%2F+MTG&hl=ja&gl=JP&ceid=JP%3Aja'),
    ('イゼ速。','ja','source-izzet','https://www.izzetmtgnews.com/feed'),
    ('BIGWEB（記事検索）','ja','source-bigweb','https://news.google.com/rss/search?q=site%3Amtg.bigweb.co.jp%2Farticles+%28MTG+OR+%E3%83%9E%E3%82%B8%E3%83%83%E3%82%AF%29&hl=ja&gl=JP&ceid=JP%3Aja'),
    ('5chまとめ（MTG限定検索）','ja','source-5ch','https://news.google.com/rss/search?q=site%3A5chant.com+%28MTG+OR+%22%E3%83%9E%E3%82%B8%E3%83%83%E3%82%AF%22+OR+%22%E3%82%AE%E3%83%A3%E3%82%B6%E3%83%AA%E3%83%B3%E3%82%B0%22&hl=ja&gl=JP&ceid=JP%3Aja'),
    ('MTGGoldfish','en','source-goldfish','https://www.mtggoldfish.com/feed'),
    ('Magic: The Gathering','en','source-wizards-en','https://magic.wizards.com/en/news'),
]
TERMS = ['mtg','magic: the gathering','magic the gathering','マジック','ギャザリング','planeswalker','プレインズウォーカー','カードゲーム','tcg','ウィザーズ','wizards of the coast','マジックアリーナ','magic arena','commander','統率者','standard','スタンダード','modern','モダン','pioneer','パイオニア','legacy','レガシー','vintage','ヴィンテージ','pauper','パウパー','draft','リミテッド','booster','ブースター','secret lair','プレイブースター','コレクターブースター']


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
            out.append({'id':guid or link,'title':title,'description':desc,'link':link,'image':'','pubDate':iso_date(pub),'sourceName':name,'sourceClass':cls,'language':lang})
    return out

all_items=[]
for source in SOURCES:
    try:
        all_items.extend(parse_feed(*source))
    except Exception as e:
        print('RSS failed:', source[0], e)

unique={x['id'] or x['link']:x for x in all_items if x.get('title') and x.get('link')}
items=list(unique.values())
items.sort(key=lambda x:x.get('pubDate',''), reverse=True)
items=items[:80]
with open('rss-cache.json','w',encoding='utf-8') as f:
    json.dump({'updatedAt':datetime.now(timezone.utc).isoformat(),'items':items},f,ensure_ascii=False,separators=(',',':'))
print('RSS cache updated:', len(items))
