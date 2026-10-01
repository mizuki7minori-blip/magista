(() => {
  'use strict';

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
        topCards: ['攻略記事で紹介している初手候補を優先', '強力な除去', '単体で盤面を動かせるカード', '軽い優秀クリーチャー', 'カード・アドバンテージ源', 'テンポを取れるカード', 'シナジーの核', '安定した2～3マナ域', 'フィニッシャー', 'マナ基盤を安定させるカード'],
        status: '攻略記事あり', note: '詳細順位はFRA攻略記事と最新公開データを併用'
      }
    },
    hob: { name: 'The Hobbit', code: 'HOB', guide: PENDING },
    msh: { name: 'Marvel Super Heroes', code: 'MSH', guide: PENDING },
    sos: { name: 'Secrets of Strixhaven', code: 'SOS', guide: PENDING },
    tmt: { name: 'Teenage Mutant Ninja Turtles', code: 'TMT', guide: PENDING },
    ecl: { name: 'Lorwyn Eclipsed', code: 'ECL', guide: PENDING },
    fin: { name: 'FINAL FANTASY', code: 'FIN', guide: PENDING },
    tdm: { name: 'タルキール：龍嵐録', code: 'TDM', guide: PENDING }
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

  const getImage = (card) => card.image_uris?.normal || card.card_faces?.find(face => face.image_uris?.normal)?.image_uris.normal || '';
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

  const renderGuide = (set) => {
    const guide = set.guide || PENDING;
    if (bestColors) bestColors.textContent = guide.colors;
    if (archetypes) archetypes.textContent = guide.archetypes;
    if (firstPick) firstPick.textContent = guide.firstPick;
    if (guideStatus) guideStatus.textContent = guide.status;
    if (topNote) topNote.textContent = guide.note;
    if (topCards) {
      topCards.innerHTML = guide.topCards.map(item => `<li>${item}</li>`).join('');
    }
  };

  const applySet = (setKey, updateUrl = true) => {
    const set = SETS[setKey] || SETS.fra;
    const normalizedKey = SETS[setKey] ? setKey : 'fra';

    selector.value = normalizedKey;
    if (kicker) kicker.textContent = `リミテッド / ${set.code}`;
    if (title) title.textContent = `${set.name} リミテッド攻略`;
    if (description) description.textContent = `${set.name}（${set.code}）のドラフト・シールド向け情報です。シリーズ選択で攻略情報、公開データ、カード画像を切り替えられます。`;
    if (galleryTitle) galleryTitle.textContent = `${set.name} のカードを画像で見る`;

    if (cardDataLink) cardDataLink.href = `https://www.17lands.com/card_data?expansion=${set.code}&format=PremierDraft&time_period=ALL_TIME&view=table`;
    if (scryfallLink) scryfallLink.href = `https://scryfall.com/sets/${normalizedKey}`;
    if (articleLink) {
      if (set.article) {
        articleLink.href = set.article;
        articleLink.hidden = false;
      } else {
        articleLink.hidden = true;
      }
    }

    renderGuide(set);

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