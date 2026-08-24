/* ========================================
   MAGSTA - Scryfall フォーマット別相場 TOP5
   ======================================== */

(() => {
  const FORMATS = {
    standard: 'Standard',
    pioneer: 'Pioneer',
    modern: 'Modern',
    legacy: 'Legacy',
    vintage: 'Vintage',
    commander: 'Commander',
    pauper: 'Pauper'
  };
  const USD_TO_JPY = 150;
  const LIMIT = 5;
  let activeFormat = 'standard';

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
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
      return `<li class="market-ranking__item">
        <span class="market-ranking__rank">${rank}</span>
        <img class="market-ranking__image" src="${image}" alt="${name}" loading="lazy">
        <div class="market-ranking__info">
          <span class="market-ranking__name" title="${name}">${name}</span>
          <div class="market-ranking__price"><span class="market-ranking__usd">$${usd.toFixed(2)}</span><span class="market-ranking__jpy">≈ ¥${jpy.toLocaleString('ja-JP')}</span></div>
        </div>
      </li>`;
    }).join('');
  }

  async function loadMarketRanking(format = activeFormat) {
    const list = document.getElementById('market-ranking-list');
    if (!list) return;
    activeFormat = format;
    list.innerHTML = '<li class="market-ranking__loading">相場データを読み込み中...</li>';

    try {
      const query = encodeURIComponent(`f:${format}`);
      const response = await fetch(`https://api.scryfall.com/cards/search?q=${query}&order=usd&dir=desc`, {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`Scryfall API: ${response.status}`);

      const data = await response.json();
      const cards = (data.data || [])
        .filter(card => card.prices?.usd && Number(card.prices.usd) > 0)
        .slice(0, LIMIT);
      if (!cards.length) throw new Error('No priced cards returned');
      renderRanking(cards);

      const label = document.getElementById('market-format-label');
      if (label) label.textContent = `${FORMATS[format].toUpperCase()} MARKET`;
      const description = document.getElementById('market-format-description');
      if (description) description.textContent = `${FORMATS[format]}の高額カードTOP5をScryfallから自動取得しています。`;
    } catch (error) {
      console.error('MAGSTA market ranking error:', error);
      list.innerHTML = '<li class="market-ranking__error">相場データを取得できませんでした。<br>しばらくしてから再度お試しください。</li>';
    }
  }

  function setupFormatTabs() {
    document.querySelectorAll('.market-format-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.market-format-tab').forEach(item => item.classList.remove('is-active'));
        tab.classList.add('is-active');
        loadMarketRanking(tab.dataset.format);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupFormatTabs();
    loadMarketRanking('standard');
  });
})();
