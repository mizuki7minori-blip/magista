(() => {
  'use strict';

  const setSelect = document.getElementById('limited-set-select');
  const archSelect = document.getElementById('limited-arch-select');
  const topList = document.getElementById('limited-top-cards');
  const topNote = document.getElementById('limited-top-note');
  const gallery = document.getElementById('limited-card-gallery');
  const galleryTitle = document.getElementById('limited-gallery-title');
  const archSummary = document.getElementById('limited-arch-summary');
  const archLabel = document.getElementById('limited-archetypes');
  if (!setSelect || !archSelect || !topList || !gallery) return;

  const ARCH = {
    ALL: { name: '全体ランキング', colors: [] },
    WU: { name: '白青（アゾリウス）', colors: ['W','U'] },
    UB: { name: '青黒（ディミーア）', colors: ['U','B'] },
    BR: { name: '黒赤（ラクドス）', colors: ['B','R'] },
    RG: { name: '赤緑（グルール）', colors: ['R','G'] },
    GW: { name: '緑白（セレズニア）', colors: ['G','W'] },
    WB: { name: '白黒（オルゾフ）', colors: ['W','B'] },
    BG: { name: '黒緑（ゴルガリ）', colors: ['B','G'] },
    GU: { name: '緑青（シミック）', colors: ['G','U'] },
    UR: { name: '青赤（イゼット）', colors: ['U','R'] },
    RW: { name: '赤白（ボロス）', colors: ['R','W'] }
  };

  const setNames = {
    fra: 'リアリティ・フラクチャー', hob: 'ホビット', msh: 'マーベル・スーパー・ヒーローズ',
    sos: 'ストリクスヘイヴンの秘密', tmt: 'TMNT'
  };

  const cache = new Map();
  const inflight = new Map();
  const getImage = card => card?.image_uris?.normal || card?.card_faces?.find(f => f.image_uris?.normal)?.image_uris.normal || '';

  const buildJaMap = cards => {
    const map = new Map();
    cards.forEach(card => {
      if (!card?.name) return;
      const current = map.get(card.name);
      if (!current || (!getImage(current) && getImage(card))) map.set(card.name, card);
    });
    return map;
  };

  const loadSet = setKey => {
    if (cache.has(setKey)) return Promise.resolve(cache.get(setKey));
    if (inflight.has(setKey)) return inflight.get(setKey);

    const promise = (async () => {
      const snapRes = await fetch('limited-ranking-data.json', { cache: 'force-cache' });
      if (!snapRes.ok) throw new Error('ranking data unavailable');
      const payload = await snapRes.json();
      const ranking = payload?.sets?.[setKey]?.ranking || [];
      if (!ranking.length) throw new Error('no ranking');

      let cards = [];
      try {
        const res = await fetch('https://api.scryfall.com/cards/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifiers: ranking.slice(0, 60).map(x => ({ name: x.name })) })
        });
        if (res.ok) cards = (await res.json()).data || [];
      } catch {}

      let jaCards = [];
      try {
        let url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`set:${setKey} lang:ja`)}&unique=prints&order=set`;
        for (let i = 0; url && i < 5; i++) {
          const res = await fetch(url);
          if (!res.ok) break;
          const data = await res.json();
          jaCards.push(...(data.data || []));
          url = data.has_more ? data.next_page : '';
        }
      } catch {}

      const result = {
        ranking,
        byName: new Map(cards.map(card => [card.name, card])),
        jaMap: buildJaMap(jaCards),
        updatedAt: payload?.sets?.[setKey]?.updatedAt || null
      };
      cache.set(setKey, result);
      inflight.delete(setKey);
      return result;
    })().catch(err => {
      inflight.delete(setKey);
      throw err;
    });

    inflight.set(setKey, promise);
    return promise;
  };

  const fits = (card, archKey) => {
    if (archKey === 'ALL') return true;
    if (!card) return false;
    const allowed = new Set(ARCH[archKey]?.colors || []);
    return (card.colors || []).every(c => allowed.has(c));
  };

  const roleFor = card => {
    if (!card) return '優先ピック';
    const text = (card.oracle_text || card.card_faces?.map(f => f.oracle_text || '').join(' ') || '').toLowerCase();
    const type = (card.type_line || '').toLowerCase();
    const mv = Number(card.cmc || 0);
    if (/destroy target|exile target|deals? \d+ damage to target|gets -\d+\/-\d+/.test(text)) return '除去';
    if (type.includes('creature') && mv > 0 && mv <= 2) return '序盤要員';
    if (type.includes('creature') && mv >= 5) return 'フィニッシャー';
    if (/draw (a|two|three|\d+) card|draw cards/.test(text)) return 'アドバンテージ';
    if ((card.colors || []).length >= 2) return 'アーキ中核';
    return '優先ピック';
  };

  const render = (setKey, archKey, data) => {
    const arch = ARCH[archKey] || ARCH.ALL;
    const pool = data.ranking
      .map(item => ({ item, card: data.byName.get(item.name) || null }))
      .filter(({ card }) => fits(card, archKey))
      .slice(0, 10);

    if (archLabel) archLabel.textContent = arch.name;
    if (archSummary) archSummary.innerHTML = `<span>${arch.name}</span><span>${pool.length}枚を優先表示</span><span>高速切替</span>`;
    if (topNote) topNote.textContent = `${arch.name}・GIH WR順`;
    if (galleryTitle) galleryTitle.textContent = `${setNames[setKey] || setKey}｜${arch.name} 優先カード`;

    if (!pool.length) {
      topList.innerHTML = '<li>この色組み合わせの候補を準備中です</li>';
      gallery.innerHTML = '<div class="limited-card"><strong>候補カードを準備中です。</strong></div>';
      return;
    }

    topList.innerHTML = pool.map(({ item, card }) => {
      const ja = data.jaMap.get(item.name);
      const name = ja?.printed_name || item.name;
      const en = name !== item.name ? `<small style="display:block;color:var(--muted)">${item.name}</small>` : '';
      return `<li><strong>${name}</strong>${en}<span class="limited-role-badge">${roleFor(card)}</span> GIH WR ${Number(item.wr).toFixed(1)}%${item.games ? ` / ${Number(item.games).toLocaleString()}ゲーム` : ''}</li>`;
    }).join('');

    gallery.innerHTML = pool.map(({ item, card }, i) => {
      const ja = data.jaMap.get(item.name);
      const shown = ja || card;
      const image = getImage(shown);
      const name = ja?.printed_name || item.name;
      const href = shown?.scryfall_uri || `https://scryfall.com/search?q=${encodeURIComponent('!"' + item.name + '"')}`;
      return `<a class="limited-image-card limited-ranked-card" href="${href}" target="_blank" rel="noopener noreferrer"><span class="limited-rank-badge">${i + 1}位</span>${image ? `<img src="${image}" alt="${name}" loading="eager" decoding="async">` : '<div class="limited-image-placeholder">画像準備中</div>'}<strong>${name}</strong>${name !== item.name ? `<span>${item.name}</span>` : ''}<span class="limited-role-badge">${roleFor(card)}</span><span>GIH WR ${Number(item.wr).toFixed(1)}%</span></a>`;
    }).join('');
  };

  const warmCurrentSet = () => loadSet(setSelect.value || 'fra').catch(() => {});

  archSelect.addEventListener('change', event => {
    event.stopImmediatePropagation();
    const setKey = setSelect.value || 'fra';
    const archKey = archSelect.value || 'ALL';
    const url = new URL(location.href);
    url.searchParams.set('set', setKey);
    url.searchParams.set('arch', archKey);
    history.replaceState({}, '', url);

    const ready = cache.get(setKey);
    if (ready) {
      render(setKey, archKey, ready);
      return;
    }

    gallery.innerHTML = '<p>初回だけカード情報を読み込んでいます…</p>';
    loadSet(setKey).then(data => render(setKey, archKey, data)).catch(() => {
      gallery.innerHTML = '<div class="limited-card"><strong>カード情報を取得できませんでした。</strong></div>';
    });
  }, true);

  setSelect.addEventListener('change', () => {
    setTimeout(warmCurrentSet, 0);
  });

  if ('requestIdleCallback' in window) requestIdleCallback(warmCurrentSet, { timeout: 1200 });
  else setTimeout(warmCurrentSet, 300);
})();
