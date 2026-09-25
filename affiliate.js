function renderAffiliate(targetId = 'affiliate-products') {
  const target = document.getElementById(targetId);
  if (!target || typeof MAGSTA_AFFILIATE === 'undefined') return;

  const items = selectAffiliateProducts().filter(item => safeAffiliateUrl(item.url));
  if (!items.length) return;

  target.innerHTML = `
    <div class="affiliate-box">
      <div class="affiliate-head"><span class="section-kicker">RECOMMENDED</span><span class="affiliate-label">PR / AD</span></div>
      <h2>この記事に関連する商品・サービス</h2>
      <p class="affiliate-disclosure">${MAGSTA_AFFILIATE.disclosure}</p>
      <div class="affiliate-list">${items.map(item => `
        <div class="affiliate-item">
          <div><strong>${escapeAffiliate(item.title)}</strong><p>${escapeAffiliate(item.description)}</p></div>
          <a class="button primary affiliate-button" href="${escapeAffiliate(safeAffiliateUrl(item.url))}" target="_blank" rel="sponsored nofollow noopener noreferrer">${escapeAffiliate(item.label)} →</a>
          ${safeAffiliateUrl(item.pixel) ? `<img class="affiliate-tracker" src="${escapeAffiliate(safeAffiliateUrl(item.pixel))}" alt="" width="1" height="1" aria-hidden="true">` : ''}
        </div>`).join('')}</div>
    </div>`;
}

function selectAffiliateProducts() {
  const products = MAGSTA_AFFILIATE.products || [];
  const byKey = new Map(products.map(item => [item.key, item]));
  const path = location.pathname.split('/').pop() || 'index.html';
  const exactKeys = MAGSTA_AFFILIATE.articleProducts?.[path];

  if (Array.isArray(exactKeys) && exactKeys.length) {
    return exactKeys.map(key => byKey.get(key)).filter(Boolean);
  }

  const category = detectAffiliateCategory();
  const categoryKeys = MAGSTA_AFFILIATE.categoryProducts?.[category]
    || MAGSTA_AFFILIATE.categoryProducts?.general
    || [];

  const selected = categoryKeys.map(key => byKey.get(key)).filter(Boolean);
  return selected.length ? selected : products.slice(0, 1);
}

function detectAffiliateCategory() {
  const params = new URLSearchParams(location.search);
  const explicit = document.body?.dataset?.affiliateCategory || params.get('cat');
  if (explicit && MAGSTA_AFFILIATE.categoryProducts?.[explicit]) return explicit;

  const text = [
    document.title,
    document.querySelector('h1')?.textContent || '',
    document.querySelector('.article-lead')?.textContent || ''
  ].join(' ').toLowerCase();

  if (/final fantasy|ファイナルファンタジー|ff\b/.test(text)) return 'ff';
  if (/ブースター|booster|box|セット/.test(text)) return 'booster';
  if (/相場|価格|買取|高騰|market/.test(text)) return 'market';
  if (/デッキ|deck|standard|modern|pioneer|legacy|vintage|commander|pauper/.test(text)) return 'deck';
  if (/カード|card/.test(text)) return 'card';
  return 'general';
}

function escapeAffiliate(value) {
  return String(value).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function safeAffiliateUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; }
  catch { return ''; }
}

document.addEventListener('DOMContentLoaded', () => renderAffiliate());
