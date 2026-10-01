(() => {
  'use strict';

  const SETS = {
    fra: { name: 'リアリティ・フラクチャー', code: 'FRA', article: 'article-fra-draft-2026-09-25.html' },
    hob: { name: 'The Hobbit', code: 'HOB' },
    msh: { name: 'Marvel Super Heroes', code: 'MSH' },
    sos: { name: 'Secrets of Strixhaven', code: 'SOS' },
    tmt: { name: 'Teenage Mutant Ninja Turtles', code: 'TMT' },
    ecl: { name: 'Lorwyn Eclipsed', code: 'ECL' },
    fin: { name: 'FINAL FANTASY', code: 'FIN' },
    tdm: { name: 'タルキール：龍嵐録', code: 'TDM' }
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

  if (!gallery || !selector) return;

  let requestId = 0;

  const getImage = (card) => {
    if (card.image_uris?.normal) return card.image_uris.normal;
    return card.card_faces?.find(face => face.image_uris?.normal)?.image_uris.normal || '';
  };

  const getCardName = (card) => card.printed_name || card.name;

  const rarityLabel = (rarity) => {
    if (rarity === 'mythic') return '神話レア';
    if (rarity === 'rare') return 'レア';
    if (rarity === 'uncommon') return 'アンコモン';
    return 'コモン';
  };

  const render = (cards, set) => {
    const usable = cards.filter(card => getImage(card)).slice(0, 15);
    if (!usable.length) throw new Error('no images');

    gallery.innerHTML = usable.map(card => {
      const image = getImage(card);
      const name = getCardName(card);
      return `<a class="limited-image-card" href="${card.scryfall_uri}" target="_blank" rel="noopener noreferrer">
        <img src="${image}" alt="${name}" loading="lazy" decoding="async">
        <strong>${name}</strong>
        <span>${set.code} / ${rarityLabel(card.rarity)}</span>
      </a>`;
    }).join('');
  };

  const fetchCards = async (setKey, set, activeRequest) => {
    gallery.innerHTML = `<p>${set.name} のカード画像を読み込み中です…</p>`;

    try {
      let response = await fetch(`https://api.scryfall.com/cards/search?q=set%3A${setKey}+lang%3Aja&order=rarity&dir=asc`);
      let data = response.ok ? await response.json() : { data: [] };

      if (!data.data?.length) {
        response = await fetch(`https://api.scryfall.com/cards/search?q=set%3A${setKey}&order=rarity&dir=asc`);
        if (!response.ok) throw new Error('Scryfall request failed');
        data = await response.json();
      }

      if (activeRequest !== requestId) return;
      render(data.data || [], set);
    } catch (error) {
      if (activeRequest !== requestId) return;
      gallery.innerHTML = `<p>${set.name} のカード画像を取得できませんでした。時間をおいて再読み込みしてください。</p>`;
    }
  };

  const applySet = (setKey, updateUrl = true) => {
    const set = SETS[setKey] || SETS.fra;
    const normalizedKey = SETS[setKey] ? setKey : 'fra';

    selector.value = normalizedKey;
    if (kicker) kicker.textContent = `リミテッド / ${set.code}`;
    if (title) title.textContent = `${set.name} リミテッド攻略`;
    if (description) description.textContent = `${set.name}（${set.code}）のドラフト・シールド向け情報です。カード画像と公開データをシリーズごとに切り替えて確認できます。`;
    if (galleryTitle) galleryTitle.textContent = `${set.name} のカードを画像で見る`;

    if (cardDataLink) {
      cardDataLink.href = `https://www.17lands.com/card_data?expansion=${set.code}&format=PremierDraft&time_period=ALL_TIME&view=table`;
    }
    if (scryfallLink) {
      scryfallLink.href = `https://scryfall.com/sets/${normalizedKey}`;
    }
    if (articleLink) {
      if (set.article) {
        articleLink.href = set.article;
        articleLink.hidden = false;
      } else {
        articleLink.hidden = true;
      }
    }

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('set', normalizedKey);
      window.history.replaceState({}, '', url);
    }

    const activeRequest = ++requestId;
    fetchCards(normalizedKey, set, activeRequest);
  };

  selector.addEventListener('change', () => applySet(selector.value));

  const initialSet = new URLSearchParams(window.location.search).get('set')?.toLowerCase() || 'fra';
  applySet(initialSet, false);
})();