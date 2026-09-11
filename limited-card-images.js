(() => {
  'use strict';

  const loadImages = async () => {
    const cards = [...document.querySelectorAll('.limited-rank-item')];
    if (!cards.length) return;

    for (const item of cards) {
      const img = item.querySelector('img[alt]');
      const nameNode = item.querySelector('span');
      const name = (nameNode?.textContent || '').trim();
      if (!img || !name || img.dataset.scryfallLoaded) continue;

      img.dataset.scryfallLoaded = '1';
      img.dataset.originalSrc = img.src;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        let response;

        try {
          response = await fetch(
            `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`,
            { headers: { Accept: 'application/json' }, signal: controller.signal }
          );
        } finally {
          clearTimeout(timeout);
        }

        // Exact lookup can fail for punctuation/translation variants, so retry fuzzily.
        if (!response.ok) {
          const controller2 = new AbortController();
          const timeout2 = setTimeout(() => controller2.abort(), 8000);
          try {
            response = await fetch(
              `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`,
              { headers: { Accept: 'application/json' }, signal: controller2.signal }
            );
          } finally {
            clearTimeout(timeout2);
          }
        }

        if (!response.ok) throw new Error('Scryfall lookup failed');
        const card = await response.json();
        const image = card.image_uris?.normal || card.image_uris?.large || card.image_uris?.small;
        if (!image) throw new Error('No card image');

        img.src = image;
        img.removeAttribute('data-broken');
      } catch (error) {
        img.dataset.broken = '1';
        // Keep the page layout stable and make the failure explicit instead of a broken icon.
        img.alt = `${name}（画像を取得できませんでした）`;
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadImages, { once: true });
  } else {
    loadImages();
  }
})();
