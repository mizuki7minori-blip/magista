(() => {
  const style = document.createElement('style');
  style.textContent = `
    .pickup-card .pickup-symbol {
      position: relative;
      width: min(150px, 48%);
      height: 210px;
      margin: 20px auto 18px;
      border-radius: 10px;
      overflow: hidden;
      background: #0a0e14;
      border: 1px solid #3a4655;
    }
    .pickup-card .pickup-symbol img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .pickup-card .pickup-symbol.is-loading::after {
      content: '画像を読み込み中…';
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 12px;
      color: #8f99a8;
      font-size: .65rem;
      text-align: center;
    }
    .pickup-card .pickup-symbol.is-fallback {
      font-size: 2.8rem;
    }
    @media (max-width: 520px) {
      .pickup-card .pickup-symbol {
        width: 120px;
        height: 168px;
      }
    }
  `;
  document.head.appendChild(style);

  const cards = [...document.querySelectorAll('.pickup-card')];
  if (!cards.length) return;

  const loadCardImage = async (card) => {
    const name = card.querySelector('.pickup-info h3')?.textContent?.trim();
    const target = card.querySelector('.pickup-symbol');
    if (!name || !target) return;

    target.classList.add('is-loading');

    try {
      const response = await fetch(
        `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!response.ok) throw new Error(`Scryfall HTTP ${response.status}`);

      const data = await response.json();
      const imageUrl = data.image_uris?.normal || data.image_uris?.large;
      if (!imageUrl) throw new Error('No image URL');

      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = `${name}のカード画像`;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.referrerPolicy = 'no-referrer';

      target.textContent = '';
      target.appendChild(image);
      target.classList.remove('is-loading');
    } catch (error) {
      console.warn(`[MAGSTA] カード画像を取得できませんでした: ${name}`, error);
      target.classList.remove('is-loading');
      target.classList.add('is-fallback');
    }
  };

  cards.forEach(loadCardImage);
})();
