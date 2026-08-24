/* ========================================
   MAGSTA - Scryfall カード相場 TOP5
   ======================================== */

(() => {
  const API_URL = 'https://api.scryfall.com/cards/search?q=f%3Astandard&order=usd&dir=desc';
  const USD_TO_JPY = 150;
  const LIMIT = 5;

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[char]));
  }

  function getImage(card) {
    return card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small || '';
  }

  function getName(card) {
    return card.printed_name || card.name || 'Unknown Card';
  }

  function renderRanking(cards) {
    const list = document.getElementById('market-ranking-list');
    if (!list) return;

    list.innerHTML = cards.map((card, index) => {
      const usd = Number(card.prices.usd);
      const jpy = Math.round(usd * USD_TO_JPY);
      const rank = String(index + 1).padStart(2, '0');
      const name = escapeHtml(getName(card));
      const image = escapeHtml(getImage(card));

      return `
        <li class="market-ranking__item">
          <span class="market-ranking__rank">${rank}</span>
          <img class="market-ranking__image" src="${image}" alt="${name}" loading="lazy">
          <div class="market-ranking__info">
            <span class="market-ranking__name" title="${name}">${name}</span>
            <div class="market-ranking__price">
              <span class="market-ranking__usd">$${usd.toFixed(2)}</span>
              <span class="market-ranking__jpy">≈ ¥${jpy.toLocaleString('ja-JP')}</span>
            </div>
          </div>
        </li>`;
    }).join('');
  }

  async function loadMarketRanking() {
    const list = document.getElementById('market-ranking-list');
    if (!list) return;

    try {
      const response = await fetch(API_URL, {
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error(`Scryfall API: ${response.status}`);

      const data = await response.json();
      const cards = (data.data || [])
        .filter(card => card.prices?.usd && Number(card.prices.usd) > 0)
        .slice(0, LIMIT);

      if (!cards.length) throw new Error('No priced cards returned');

      renderRanking(cards);
    } catch (error) {
      console.error('MAGSTA market ranking error:', error);
      list.innerHTML = '<li class="market-ranking__error">相場データを取得できませんでした。<br>しばらくしてから再度お試しください。</li>';
    }
  }

  document.addEventListener('DOMContentLoaded', loadMarketRanking);
})();
