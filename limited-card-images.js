(() => {
  'use strict';

  const CACHE_TTL = 24 * 60 * 60 * 1000;
  const PENDING = {
    colors: '最新データ確認中',
    archetypes: '最新データ確認中',
    firstPick: '除去・ボム・柔軟性を優先',
    topCards: ['最新データ確認中'],
    status: '更新中',
    note: '17Landsとカードプールを確認して更新'
  };

  const SETS = {
    fra: {
      name: 'リアリティ・フラクチャー', code: 'FRA', article: 'article-fra-draft-2026-09-25.html',
      guide: {
        colors: '色の強弱は最新データを確認して更新',
        archetypes: 'シナジーの軸を見ながら更新',
        firstPick: '単体性能の高いカードを優先し、序盤は色を固定しすぎない',
        topCards: ['攻略記事で紹介している初手候補を優先'],
        status: '攻略記事あり', note: '17Landsのランキング値は確認後に掲載'
      },
      ranking: []
    },
    hob: { name: 'The Hobbit', code: 'HOB', guide: PENDING, ranking: [] },
    msh: {
      name: 'Marvel Super Heroes', code: 'MSH', guide: PENDING,
      ranking: [
        { name: 'The Super Hero Civil War', wr: 69.3 },
        { name: 'Sword of Fire and Ice', wr: 69.2 },
        { name: "Captain Marvel, Earth's Protector", wr: 68.1 },
        { name: 'Leader, Super-Genius', wr: 67.4 },
        { name: 'Black Panther, Wakandan King', wr: 67.0 },
        { name: 'Final Showdown', wr: 65.6 },
        { name: 'Doctor Doom', wr: 64.9 },
        { name: 'Avengers Assemble!', wr: 64.0 }
      ]
    },
    sos: { name: 'Secrets of Strixhaven', code: 'SOS', guide: PENDING, ranking: [] },
    tmt: { name: 'Teenage Mutant Ninja Turtles', code: 'TMT', guide: PENDING, ranking: [] },
    ecl: { name: 'Lorwyn Eclipsed', code: 'ECL', guide: PENDING, ranking: [] },
    fin: {
      name: 'FINAL FANTASY', code: 'FIN', guide: PENDING,
      ranking: [
        { name: 'Atraxa, Grand Unifier', wr: 66.4 },
        { name: "Dion, Bahamut's Dominant", wr: 64.5 },
        { name: 'Ardyn, the Usurper', wr: 64.5 },
        { name: 'Nibelheim Aflame', wr: 64.5 },
        { name: 'Winota, Joiner of Forces', wr: 64.4 },
        { name: "Smuggler's Copter", wr: 64.2 },
        { name: 'Sazh Katzroy', wr: 64.2 },
        { name: 'Urza, Lord High Artificer', wr: 64.2 },
        { name: "Akroma's Will", wr: 63.6 },
        { name: 'Esper Origins', wr: 63.6 }
      ]
    },
    tdm: { name: 'タルキール：龍嵐録', code: 'TDM', guide: PENDING, ranking: [] }
  };

  const gallery = document.getElementById('limited-card-gallery');
  const selector = document.getElementById('limited-set-select');
  const title = document.getElementById('limited-set-title');
  const description = document.getElementById('limited-set-description');
  const kicker = document.getElementById('limited-set-kicker');
  const galleryTitle = document.getElementById('limited-gallery-title');
  const cardDataLink = document.getElementById('limited-card-data-link');
  const scryfallLink = document.getElementById('limited-scryfall-link');
  const articleLink = document.getElementById('limited-article-link');
  const bestColors = document.getElementById('limited-best-colors');
  const archetypes = document.getElementById('limited-archetypes');
  const firstPick = document.getElementById('limited-first-pick');
  const topCards = document.getElementById('limited-top-cards');
  const guideStatus = document.getElementById('limited-guide-status');
  const topNote = document.getElementById('limited-top-note');

  if (!gallery || !selector) return;
  let requestId = 0;
  const memoryCache = new Map();

  const getImage = (card) => card?.image_uris?.normal || card?.card_faces?.find(face => face.image_uris?.normal)?.image_uris.normal || '';

  const readCache = (setKey) => {
    if (memoryCache.has(setKey)) return memoryCache.get(setKey);
    try {
      const raw = localStorage.getItem(`magsta-limited-${setKey}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.savedAt || Date.now() - parsed.savedAt > CACHE_TTL) return null;
      memoryCache.set(setKey, parsed.cards || []);
      return parsed.cards || [];
    } catch {
      return null;
    }
  };

  const writeCache = (setKey, cards) => {
    memoryCache.set(setKey, cards);
    try {
      localStorage.setItem(`magsta-limited-${setKey}`, JSON.stringify({ savedAt: Date.now(), cards }));
    } catch {}
  };

  const fetchRankingCards = async (setKey, ranking) => {
    const cached = readCache(setKey);
    if (cached?.length) return cached;

    try {
      const response = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers: ranking.map(entry => ({ name: entry.name })) })
      });
      if (!response.ok) throw new Error('batch failed');
      const data = await response.json();
      const cards = data.data || [];
      if (cards.length) writeCache(setKey, cards);
      return cards;
    } catch {
      const results = await Promise.all(ranking.map(async entry => {
        const exact = encodeURIComponent(entry.name);
        let response = await fetch(`https://api.scryfall.com/cards/named?exact=${exact}&set=${setKey}`);
        if (!response.ok) response = await fetch(`https://api.scryfall.com/cards/named?exact=${exact}`);
        return response.ok ? response.json() : null;
      }));
      const cards = results.filter(Boolean);
      if (cards.length) writeCache(setKey, cards);
      return cards;
    }
  };

  const renderRanking = async (setKey, set, activeRequest) => {
    const ranking = set.ranking || [];
    if (!ranking.length) {
      gallery.innerHTML = `<div class="limited-card"><strong>${set.name} のランキングは確認中です。</strong><p>ランダムなカード画像は表示せず、17Landsで順位を確認できたカードだけ掲載します。</p></div>`;
      return;
    }

    const cached = readCache(setKey);
    gallery.innerHTML = cached?.length
      ? '<p>ランキング画像を表示しています…</p>'
      : `<p>${set.name} のランキング画像を読み込み中です…</p>`;

    const cards = cached?.length ? cached : await fetchRankingCards(setKey, ranking);
    if (activeRequest !== requestId) return;

    const byName = new Map(cards.map(card => [card.name, card]));
    gallery.innerHTML = ranking.map((item, index) => {
      const card = byName.get(item.name) || cards.find(c => c.printed_name === item.name) || null;
      const image = getImage(card);
      const href = card?.scryfall_uri || `https://scryfall.com/search?q=${encodeURIComponent('!"' + item.name + '"')}`;
      const eager = index < 3;
      return `<a class="limited-image-card limited-ranked-card" href="${href}" target="_blank" rel="noopener noreferrer">
        <span class="limited-rank-badge">${index + 1}位</span>
        ${image ? `<img src="${image}" alt="${item.name}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}>` : '<div class="limited-image-placeholder">画像確認中</div>'}
        <strong>${item.name}</strong>
        <span>GIH WR ${item.wr.toFixed(1)}%</span>
      </a>`;
    }).join('');
  };

  const applySet = (setKey, updateUrl = true) => {
    const normalizedKey = SETS[setKey] ? setKey : 'fra';
    const set = SETS[normalizedKey];
    const guide = set.guide || PENDING;

    selector.value = normalizedKey;
    if (kicker) kicker.textContent = `リミテッド / ${set.code}`;
    if (title) title.textContent = `${set.name} リミテッド攻略`;
    if (description) description.textContent = `${set.name}（${set.code}）のドラフト・シールド向け情報です。17Landsで確認できた実戦データを優先して表示します。`;
    if (galleryTitle) galleryTitle.textContent = `${set.name} 17Landsカードランキング`;

    if (cardDataLink) cardDataLink.href = `https://www.17lands.com/card_data?expansion=${set.code}&format=PremierDraft&sort=ever_drawn_win_rate%2Cdesc&time_period=ALL_TIME&view=table`;
    if (scryfallLink) scryfallLink.href = `https://scryfall.com/sets/${normalizedKey}`;
    if (articleLink) {
      articleLink.hidden = !set.article;
      if (set.article) articleLink.href = set.article;
    }

    if (bestColors) bestColors.textContent = guide.colors;
    if (archetypes) archetypes.textContent = guide.archetypes;
    if (firstPick) firstPick.textContent = guide.firstPick;
    if (guideStatus) guideStatus.textContent = guide.status;
    if (topNote) topNote.textContent = set.ranking?.length ? '17Lands GIH WR順・確認済みデータ' : guide.note;
    if (topCards) {
      const items = set.ranking?.length ? set.ranking.map(card => `${card.name} — GIH WR ${card.wr.toFixed(1)}%`) : guide.topCards;
      topCards.innerHTML = items.map(item => `<li>${item}</li>`).join('');
    }

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('set', normalizedKey);
      window.history.replaceState({}, '', url);
    }

    const activeRequest = ++requestId;
    renderRanking(normalizedKey, set, activeRequest).catch(() => {
      if (activeRequest !== requestId) return;
      gallery.innerHTML = '<div class="limited-card"><strong>ランキング画像を取得できませんでした。</strong><p>順位データは上のTOP欄、詳細は17Landsで確認できます。</p></div>';
    });
  };

  selector.addEventListener('change', () => applySet(selector.value));
  const initialSet = new URLSearchParams(window.location.search).get('set')?.toLowerCase() || 'fra';
  applySet(initialSet, false);
})();