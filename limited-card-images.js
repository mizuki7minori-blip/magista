(() => {
  'use strict';

  const IMAGE_CACHE_TTL = 24 * 60 * 60 * 1000;
  const SNAPSHOT_CACHE_KEY = 'magsta-limited-ranking-snapshots-v1';
  const PENDING = {
    colors: '17Lands集計を基準に順次更新',
    archetypes: 'シリーズ別に順次追加',
    firstPick: '除去・ボム・柔軟性を優先',
    status: 'ランキング連動',
    note: '保存済みランキングを表示'
  };

  const SETS = {
    fra: {
      name: 'リアリティ・フラクチャー', code: 'FRA', article: 'article-fra-draft-2026-09-25.html', updatedAt: null,
      guide: {
        colors: '17Lands集計を基準に順次更新',
        archetypes: 'シナジーの軸を見ながら更新',
        firstPick: '単体性能の高いカードを優先し、序盤は色を固定しすぎない',
        status: '攻略記事あり', note: '保存済みランキングを表示'
      },
      ranking: []
    },
    hob: { name: 'The Hobbit', code: 'HOB', guide: PENDING, ranking: [], updatedAt: null },
    msh: {
      name: 'Marvel Super Heroes', code: 'MSH', guide: PENDING, updatedAt: '2026-10-01T00:00:00Z',
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
    sos: { name: 'Secrets of Strixhaven', code: 'SOS', guide: PENDING, ranking: [], updatedAt: null },
    tmt: { name: 'Teenage Mutant Ninja Turtles', code: 'TMT', guide: PENDING, ranking: [], updatedAt: null }
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

  const formatDate = (iso) => {
    if (!iso) return '保存データ準備中';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '保存済みデータ';
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} 更新`;
  };

  const mergeSnapshots = (payload) => {
    const snapshots = payload?.sets || {};
    Object.entries(snapshots).forEach(([key, snapshot]) => {
      if (!SETS[key] || !snapshot) return;
      if (Array.isArray(snapshot.ranking) && snapshot.ranking.length) SETS[key].ranking = snapshot.ranking;
      if (snapshot.updatedAt) SETS[key].updatedAt = snapshot.updatedAt;
    });
  };

  const readSnapshotCache = () => {
    try {
      const raw = localStorage.getItem(SNAPSHOT_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const refreshSnapshots = async () => {
    try {
      const response = await fetch('limited-ranking-data.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('snapshot fetch failed');
      const payload = await response.json();
      mergeSnapshots(payload);
      try { localStorage.setItem(SNAPSHOT_CACHE_KEY, JSON.stringify(payload)); } catch {}
      return true;
    } catch {
      return false;
    }
  };

  const readImageCache = (setKey) => {
    if (memoryCache.has(setKey)) return memoryCache.get(setKey);
    try {
      const raw = localStorage.getItem(`magsta-limited-images-${setKey}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.savedAt || Date.now() - parsed.savedAt > IMAGE_CACHE_TTL) return null;
      memoryCache.set(setKey, parsed.cards || []);
      return parsed.cards || [];
    } catch {
      return null;
    }
  };

  const writeImageCache = (setKey, cards) => {
    memoryCache.set(setKey, cards);
    try {
      localStorage.setItem(`magsta-limited-images-${setKey}`, JSON.stringify({ savedAt: Date.now(), cards }));
    } catch {}
  };

  const fetchRankingCards = async (setKey, ranking) => {
    const cached = readImageCache(setKey);
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
      if (cards.length) writeImageCache(setKey, cards);
      return cards;
    } catch {
      const results = await Promise.all(ranking.slice(0, 10).map(async entry => {
        const exact = encodeURIComponent(entry.name);
        let response = await fetch(`https://api.scryfall.com/cards/named?exact=${exact}&set=${setKey}`);
        if (!response.ok) response = await fetch(`https://api.scryfall.com/cards/named?exact=${exact}`);
        return response.ok ? response.json() : null;
      }));
      const cards = results.filter(Boolean);
      if (cards.length) writeImageCache(setKey, cards);
      return cards;
    }
  };

  const renderRanking = async (setKey, set, activeRequest) => {
    const ranking = set.ranking || [];
    if (!ranking.length) {
      gallery.innerHTML = `<div class="limited-card"><strong>${set.name} の保存ランキングを準備しています。</strong><p>自動更新に成功した時点でランキングを保存し、以後は取得失敗時も前回データを表示します。</p></div>`;
      return;
    }

    const cached = readImageCache(setKey);
    if (!cached?.length) gallery.innerHTML = `<p>${set.name} のランキング画像を読み込み中です…</p>`;

    const cards = cached?.length ? cached : await fetchRankingCards(setKey, ranking);
    if (activeRequest !== requestId) return;

    const byName = new Map(cards.map(card => [card.name, card]));
    gallery.innerHTML = ranking.slice(0, 10).map((item, index) => {
      const card = byName.get(item.name) || cards.find(c => c.printed_name === item.name) || null;
      const image = getImage(card);
      const href = card?.scryfall_uri || `https://scryfall.com/search?q=${encodeURIComponent('!"' + item.name + '"')}`;
      const eager = index < 3;
      return `<a class="limited-image-card limited-ranked-card" href="${href}" target="_blank" rel="noopener noreferrer">
        <span class="limited-rank-badge">${index + 1}位</span>
        ${image ? `<img src="${image}" alt="${item.name}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}>` : '<div class="limited-image-placeholder">画像準備中</div>'}
        <strong>${item.name}</strong>
        <span>GIH WR ${Number(item.wr).toFixed(1)}%</span>
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
    if (description) description.textContent = `${set.name}（${set.code}）のドラフト・シールド向け情報です。保存済みの17Landsランキングを優先表示します。`;
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
    if (topNote) topNote.textContent = set.ranking?.length ? `GIH WR順・${formatDate(set.updatedAt)}` : '初回保存データを準備中';
    if (topCards) {
      const items = set.ranking?.length
        ? set.ranking.slice(0, 10).map(card => `${card.name} — GIH WR ${Number(card.wr).toFixed(1)}%`)
        : ['自動更新でランキングを取得後、前回データを常時表示します'];
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
      gallery.innerHTML = '<div class="limited-card"><strong>カード画像を取得できませんでした。</strong><p>ランキング順位は上の一覧に保存されているため、データ自体はそのまま確認できます。</p></div>';
    });
  };

  const cachedSnapshots = readSnapshotCache();
  if (cachedSnapshots) mergeSnapshots(cachedSnapshots);

  selector.addEventListener('change', () => applySet(selector.value));
  const initialSet = new URLSearchParams(window.location.search).get('set')?.toLowerCase() || 'fra';
  applySet(initialSet, false);

  refreshSnapshots().then(updated => {
    if (updated) applySet(selector.value, false);
  });
})();
