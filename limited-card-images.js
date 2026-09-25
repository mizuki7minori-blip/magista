(() => {
  'use strict';

  const SET = 'sos';
  const gallery = document.getElementById('limited-card-gallery');
  if (!gallery) return;

  const getImage = (card) => {
    if (card.image_uris?.normal) return card.image_uris.normal;
    return card.card_faces?.find(face => face.image_uris?.normal)?.image_uris.normal || '';
  };

  const getJapaneseName = (card) => {
    if (card.printed_name) return card.printed_name;
    return card.name;
  };

  const render = (cards) => {
    const usable = cards.filter(card => getImage(card)).slice(0, 10);
    if (!usable.length) throw new Error('no images');
    gallery.innerHTML = usable.map(card => {
      const image = getImage(card);
      const name = getJapaneseName(card);
      return `<a class="limited-image-card" href="${card.scryfall_uri}" target="_blank" rel="noopener noreferrer">
        <img src="${image}" alt="${name}" loading="lazy" decoding="async">
        <strong>${name}</strong>
        <span>SOS / ${card.rarity === 'mythic' ? '神話レア' : card.rarity === 'rare' ? 'レア' : card.rarity === 'uncommon' ? 'アンコモン' : 'コモン'}</span>
      </a>`;
    }).join('');
  };

  const load = async () => {
    try {
      // 日本語版が登録されているカードを優先。なければ通常版を表示。
      let response = await fetch(`https://api.scryfall.com/cards/search?q=set%3A${SET}+lang%3Aja&order=rarity&dir=asc`);
      let data = response.ok ? await response.json() : { data: [] };
      if (!data.data?.length) {
        response = await fetch(`https://api.scryfall.com/cards/search?q=set%3A${SET}&order=rarity&dir=asc`);
        if (!response.ok) throw new Error('Scryfall request failed');
        data = await response.json();
      }
      render(data.data || []);
    } catch (error) {
      gallery.innerHTML = '<p>カード画像を取得できませんでした。時間をおいて再読み込みしてください。</p>';
    }
  };

  load();
})();