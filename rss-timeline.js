(() => {
  'use strict';

  const RSS_API = 'https://api.rss2json.com/v1/api.json?rss_url=';
  const MAX_ITEMS_PER_LANGUAGE = 8;
  const REQUEST_TIMEOUT = 9000;

  // language: ja = 日本語、en = 英語
  const RSS_SOURCES = [
    {
      name: '5chまとめ', language: 'ja', url: 'https://5chant.com/feed', className: 'source-5ch',
      keywords: ['MTG', 'マジック：ザ・ギャザリング', 'マジック・ザ・ギャザリング', 'ギャザリング', 'カードゲーム', 'ウィザーズ']
    },
    {
      name: 'MTG公式', language: 'ja', url: 'https://mtg-jp.com/index.rdf', className: 'source-official'
    },
    {
      name: 'MTGGoldfish', language: 'en', url: 'https://www.mtggoldfish.com/feed', className: 'source-goldfish'
    },
    {
      name: 'Magic: The Gathering', language: 'en', url: 'https://magic.wizards.com/en/news', className: 'source-wizards-en'
    }
  ];

  const escapeText = value => String(value ?? '').trim();

  function parseDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    const date = parseDate(value);
    if (!date) return '日時不明';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayDiff = Math.round((startOfToday - startOfDate) / 86400000);
    const time = date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    if (dayDiff === 0) return `今日 ${time}`;
    if (dayDiff === 1) return `昨日 ${time}`;
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replaceAll('/', '.');
  }

  function matchesKeywords(item, keywords) {
    if (!keywords?.length) return true;
    const text = `${item.title ?? ''} ${item.description ?? ''}`.toLowerCase();
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  async function fetchFeed(source) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
      const endpoint = `${RSS_API}${encodeURIComponent(source.url)}`;
      const response = await fetch(endpoint, { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.status !== 'ok' || !Array.isArray(data.items)) throw new Error(data.message || 'RSSデータが取得できませんでした');
      return data.items
        .filter(item => item.link && item.title && matchesKeywords(item, source.keywords))
        .map(item => ({
          id: item.guid || item.link,
          title: escapeText(item.title), link: item.link,
          pubDate: item.pubDate || item.isoDate || '',
          sourceName: source.name, sourceClass: source.className, language: source.language
        }));
    } finally { clearTimeout(timer); }
  }

  function createItem(article, index) {
    const link = document.createElement('a');
    link.className = `rss-timeline-item ${article.sourceClass}`;
    link.href = article.link; link.target = '_blank'; link.rel = 'noopener noreferrer';
    const number = document.createElement('span'); number.className = 'rss-timeline-number'; number.textContent = String(index + 1).padStart(2, '0');
    const body = document.createElement('span'); body.className = 'rss-timeline-body';
    const title = document.createElement('strong'); title.className = 'rss-timeline-title'; title.textContent = article.title;
    const meta = document.createElement('small'); meta.className = 'rss-timeline-meta'; meta.textContent = `${formatDate(article.pubDate)} / ${article.sourceName}`;
    body.append(title, meta); link.append(number, body); return link;
  }

  function renderLanguage(container, articles) {
    container.replaceChildren();
    if (!articles.length) {
      const empty = document.createElement('p'); empty.className = 'rss-timeline-empty'; empty.textContent = '現在、表示できる記事がありません。'; container.appendChild(empty); return;
    }
    articles.slice(0, MAX_ITEMS_PER_LANGUAGE).forEach((article, index) => container.appendChild(createItem(article, index)));
  }

  async function fetchMixedRSS() {
    const jaContainer = document.getElementById('rss-timeline-ja-list');
    const enContainer = document.getElementById('rss-timeline-en-list');
    const status = document.getElementById('rss-timeline-status');
    if (!jaContainer || !enContainer) return;
    if (status) status.textContent = '最新情報を取得中…';

    const results = await Promise.allSettled(RSS_SOURCES.map(fetchFeed));
    const articles = []; let successCount = 0;
    results.forEach(result => {
      if (result.status === 'fulfilled') { successCount += 1; articles.push(...result.value); }
      else console.warn('[MAGSTA RSS] Feed取得失敗:', result.reason);
    });

    const uniqueArticles = Array.from(new Map(articles.map(article => [article.id, article])).values());
    uniqueArticles.sort((a, b) => (parseDate(b.pubDate)?.getTime() ?? 0) - (parseDate(a.pubDate)?.getTime() ?? 0));
    renderLanguage(jaContainer, uniqueArticles.filter(article => article.language === 'ja'));
    renderLanguage(enContainer, uniqueArticles.filter(article => article.language === 'en'));

    if (status) status.textContent = successCount > 0 ? `${successCount}/${RSS_SOURCES.length}サイトから取得` : 'RSSを取得できませんでした';
  }

  document.addEventListener('DOMContentLoaded', fetchMixedRSS);
})();
