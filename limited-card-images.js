(() => {
  'use strict';
  const loadImages = async () => {
    const cards = [...document.querySelectorAll('.limited-rank-item')];
    for (const item of cards) {
      const img = item.querySelector('img[alt]');
      const name = item.querySelector('span')?.textContent.trim();
      if (!img || !name || img.dataset.scryfallLoaded) continue;
      img.dataset.scryfallLoaded = '1';
      try {
        const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`, {headers:{'Accept':'application/json'}});
        if (!response.ok) throw new Error('Scryfall lookup failed');
        const card = await response.json();
        const image = card.image_uris?.normal || card.image_uris?.small;
        if (image) {
          img.src = image;
          img.removeAttribute('data-broken');
        }
      } catch (error) {
        img.dataset.broken = '1';
      }
    }
  };
  document.addEventListener('DOMContentLoaded', loadImages);
})();
