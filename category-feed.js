(() => {
  'use strict';
  const names = {
    news: ['ニュース', 'MTGの最新ニュース・話題。'],
    tournament: ['大会', '大会結果・上位デッキ・競技シーン。'],
    matome: ['5ch・コミュニティ', 'MTGコミュニティの話題。'],
    card: ['新カード', '新セット・新カード情報。'],
    deck: ['デッキ・環境', 'デッキ構築と環境の変化。']
  };
  const categories = {news:['news'],tournament:['tournament'],matome:['community'],card:['new-card'],deck:['deck']};
  const requested = new URLSearchParams(location.search).get('cat') || 'news';
  const key = names[requested] ? requested : 'news';
  document.title = `${names[key][0]}｜MAGSTA MTG`;
  document.getElementById('category-title').textContent = names[key][0];
  document.getElementById('category-description').textContent = names[key][1];
  document.querySelectorAll('[data-cat]').forEach(link => link.classList.toggle('active', link.dataset.cat === key));
  const status = document.getElementById('category-status');
  const box = document.getElementById('category-rss-list');
  const keywords = ['デッキ','deck','standard','modern','commander','legacy','vintage','パイオニア','スタンダード'];
  function type(article) {
    if (article.categoryKey && article.categoryKey !== 'news') return article.categoryKey;
    const title = String(article.title || '').toLowerCase();
    return keywords.some(word => title.includes(word)) ? 'deck' : 'news';
  }
  function clean(value) {
    return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
  }
  function show(article) {
    const card = document.createElement('article');
    card.className = 'category-rss-card';
    const body = document.createElement('div');
    const meta = document.createElement('div');
    meta.className = 'category-rss-meta';
    const day = article.pubDate && !Number.isNaN(Date.parse(article.pubDate)) ? new Date(article.pubDate).toLocaleDateString('ja-JP') : '';
    meta.textContent = `${article.sourceName || 'MAGSTA Feed'} / ${day}`;
    const title = document.createElement('h2');
    title.textContent = article.title;
    const description = document.createElement('p');
    description.textContent = clean(article.description) || '見出しを確認し、詳しくは元の記事をご覧ください。';
    const link = document.createElement('a');
    link.href = article.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = '記事を読む →';
    body.append(meta, title, description, link);
    card.append(body);
    box.append(card);
  }
  fetch(`rss-cache.json?v=${Math.floor(Date.now()/600000)}`).then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }).then(data => {
    const selected = (data.items || []).filter(article => article.link && article.title && article.language === 'ja' && categories[key].includes(type(article))).slice(0, 30);
    box.replaceChildren();
    selected.forEach(show);
    status.textContent = selected.length ? `最新 ${selected.length} 件` : 'このカテゴリーの記事は現在ありません。';
  }).catch(() => { status.textContent = '記事を取得できませんでした。再読み込みしてください。'; });
})();
