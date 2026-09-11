(() => {
  'use strict';

  // ScryfallのJSON APIをブラウザからfetchする方式では、環境によってCORS・通信制限の影響を受けるため、
  // 画像エンドポイントへ直接読み込む方式に変更。画像タグ自身がリダイレクト先を取得します。
  const loadImages = () => {
    const cards = [...document.querySelectorAll('.limited-rank-item')];
    if (!cards.length) return;

    cards.forEach((item) => {
      const img = item.querySelector('img[alt]');
      const nameNode = item.querySelector('span');
      const name = (nameNode?.textContent || '').trim();
      if (!img || !name || img.dataset.scryfallLoaded) return;

      img.dataset.scryfallLoaded = '1';
      img.dataset.originalSrc = img.src;
      img.dataset.cardName = name;

      const makeUrl = (mode) =>
        `https://api.scryfall.com/cards/named?${mode}=${encodeURIComponent(name)}&format=image&version=normal`;

      const fallback = () => {
        if (img.dataset.fuzzyTried) {
          img.dataset.broken = '1';
          img.alt = `${name}（画像を取得できませんでした）`;
          return;
        }
        img.dataset.fuzzyTried = '1';
        img.src = makeUrl('fuzzy');
      };

      img.addEventListener('error', fallback, { once: false });
      img.addEventListener('load', () => {
        img.removeAttribute('data-broken');
      }, { once: true });

      // 既存のダミーURLを使わず、Scryfallの正式画像エンドポイントから直接取得。
      img.src = makeUrl('exact');
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadImages, { once: true });
  } else {
    loadImages();
  }
})();
