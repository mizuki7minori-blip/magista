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
  let requestId = 0;

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

  function setStatus(message, className = 'market-ranking__loading') {
    const list = document.getElementById('market-ranking-list');
    if (list) list.innerHTML = `<li class="${className}">${message}</li>`;
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
          <div class="market-ranking__price">
            <span class="market-ranking__usd">$${usd.toFixed(2)}</span>
            <span class="market-ranking__jpy">≈ ¥${jpy.toLocaleString('ja-JP')}</span>
          </div>
        </div>
      </li>`;
    }).join('');
  }

  async function loadMarketRanking(format = activeFormat) {
    if (!FORMATS[format]) return;

    const list = document.getElementById('market-ranking-list');
    if (!list) return;

    activeFormat = format;
    const currentRequest = ++requestId;
    setStatus(`${FORMATS[format]}の相場を読み込み中...`);

    const label = document.getElementById('market-format-label');
    const description = document.getElementById('market-format-description');
    if (label) label.textContent = `${FORMATS[format].toUpperCase()} MARKET`;
    if (description) description.textContent = `${FORMATS[format]}の高額カードTOP5をScryfallから自動取得しています。`;

    try {
      const params = new URLSearchParams({
        q: `f:${format}`,
        order: 'usd',
        dir: 'desc'
      });

      const response = await fetch(`https://api.scryfall.com/cards/search?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });

      if (!response.ok) throw new Error(`Scryfall API: ${response.status}`);

      const data = await response.json();
      if (currentRequest !== requestId) return;

      const cards = (data.data || [])
        .filter(card => card.prices?.usd && Number(card.prices.usd) > 0)
        .sort((a, b) => Number(b.prices.usd) - Number(a.prices.usd))
        .slice(0, LIMIT);

      if (!cards.length) throw new Error('No priced cards returned');
      renderRanking(cards);
    } catch (error) {
      if (currentRequest !== requestId) return;
      console.error('MAGSTA market ranking error:', error);
      setStatus('相場データを取得できませんでした。<br>しばらくしてから再度お試しください。', 'market-ranking__error');
    }
  }

  function setupFormatTabs() {
    const tabs = document.querySelectorAll('.market-format-tab');
    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        const format = tab.dataset.format;
        if (!FORMATS[format]) return;

        tabs.forEach(item => {
          item.classList.toggle('is-active', item === tab);
          item.setAttribute('aria-selected', item === tab ? 'true' : 'false');
        });

        loadMarketRanking(format);
      });
    });
  }

  function init() {
    setupFormatTabs();
    loadMarketRanking('standard');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
