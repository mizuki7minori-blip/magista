function renderAffiliate(targetId = 'affiliate-products') {
  const target = document.getElementById(targetId);
  if (!target || typeof MAGSTA_AFFILIATE === 'undefined') return;

  const maxItems = Number(MAGSTA_AFFILIATE.maxItems) || 4;
  const items = selectAffiliateProducts().filter(item => safeAffiliateUrl(item.url)).slice(0, maxItems);
  if (!items.length) {
    target.innerHTML = '';
    return;
  }

  const series = detectAffiliateSeries();
  const heading = series ? 'このシリーズの関連商品' : 'この記事に関連する商品・サービス';
  const hasAffiliate = items.some(item => item.affiliate !== false);
  const headLabel = hasAffiliate ? 'PR / 商品リンク' : 'RELATED ITEMS';

  target.innerHTML = `
    <div class="affiliate-box">
      <div class="affiliate-head"><span class="section-kicker">RECOMMENDED</span><span class="affiliate-label">${headLabel}</span></div>
      <h2>${heading}</h2>
      ${hasAffiliate ? `<p class="affiliate-disclosure">${escapeAffiliate(MAGSTA_AFFILIATE.disclosure)}</p>` : '<p class="affiliate-disclosure">シリーズに関連する商品・公式限定商品への参考リンクです。価格・在庫・販売地域はリンク先で確認してください。</p>'}
      <div class="affiliate-list">${items.map(item => renderAffiliateItem(item)).join('')}</div>
    </div>`;
}

function renderAffiliateItem(item) {
  const url = safeAffiliateUrl(item.url);
  const isAffiliate = item.affiliate !== false;
  const kind = String(item.kind || 'product').replace(/[^a-z0-9-]/gi, '');
  const badge = item.badge || kindLabel(kind);
  return `
    <article class="affiliate-item affiliate-kind-${escapeAffiliate(kind)}${kind === 'secret-lair' ? ' affiliate-item-secret-lair' : ''}">
      <div class="affiliate-copy">
        <div class="affiliate-item-meta">
          <span class="affiliate-kind-badge">${escapeAffiliate(badge)}</span>
          <span class="affiliate-source-note">${isAffiliate ? 'アフィリエイト' : '参考リンク'}</span>
        </div>
        <strong>${escapeAffiliate(item.title)}</strong>
        <p>${escapeAffiliate(item.description)}</p>
      </div>
      <a class="button primary affiliate-button" data-affiliate-key="${escapeAffiliate(item.key || kind)}" href="${escapeAffiliate(url)}" target="_blank" rel="${isAffiliate ? 'sponsored nofollow noopener noreferrer' : 'noopener noreferrer'}">${escapeAffiliate(item.label)} →</a>
      ${safeAffiliateUrl(item.pixel) ? `<img class="affiliate-tracker" src="${escapeAffiliate(safeAffiliateUrl(item.pixel))}" alt="" width="1" height="1" aria-hidden="true">` : ''}
    </article>`;
}

function kindLabel(kind) {
  const labels = {
    sealed: 'BOX / Bundle',
    supply: 'サプライ',
    'secret-lair': 'Secret Lair',
    service: 'サービス',
    product: '関連商品'
  };
  return labels[kind] || '関連商品';
}

function selectAffiliateProducts() {
  const products = MAGSTA_AFFILIATE.products || [];
  const byKey = new Map(products.map(item => [item.key, item]));
  const series = detectAffiliateSeries();
  const seriesKeys = series && MAGSTA_AFFILIATE.seriesProducts?.[series];

  if (Array.isArray(seriesKeys) && seriesKeys.length) {
    return seriesKeys.map(key => byKey.get(key)).filter(Boolean);
  }

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

function detectAffiliateSeries() {
  const params = new URLSearchParams(location.search);
  const explicit = document.body?.dataset?.affiliateSeries || params.get('set');
  const key = String(explicit || '').toLowerCase();
  return MAGSTA_AFFILIATE.seriesProducts?.[key] ? key : '';
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

window.renderAffiliate = renderAffiliate;
window.addEventListener('magsta:series-change', () => renderAffiliate());
document.addEventListener('DOMContentLoaded', () => { renderAffiliate(); renderInlineAffiliate(); bindAffiliateAnalytics(); });


function renderInlineAffiliate() {
  if (typeof MAGSTA_AFFILIATE === 'undefined') return;
  const body = document.querySelector('.article-body');
  if (!body || document.getElementById('affiliate-inline')) return;

  const items = selectAffiliateProducts()
    .filter(item => item.affiliate !== false && safeAffiliateUrl(item.url))
    .slice(0, 2);
  if (!items.length) return;

  const headings = [...body.querySelectorAll('h2')];
  const anchor = headings[Math.min(2, Math.max(0, headings.length - 1))];
  if (!anchor) return;

  const box = document.createElement('aside');
  box.id = 'affiliate-inline';
  box.className = 'affiliate-inline';
  box.setAttribute('aria-label', '関連商品');
  box.innerHTML = `
    <div class="affiliate-inline-head">
      <span class="affiliate-label">PR / 関連商品</span>
      <strong>この記事を読んだ人向け</strong>
    </div>
    <div class="affiliate-inline-list">${items.map(item => {
      const url = safeAffiliateUrl(item.url);
      return `<a class="affiliate-inline-link" href="${escapeAffiliate(url)}" target="_blank" rel="sponsored nofollow noopener noreferrer" data-affiliate-key="${escapeAffiliate(item.key || '')}">
        <span><b>${escapeAffiliate(item.title)}</b><small>${escapeAffiliate(item.description)}</small></span>
        <em>${escapeAffiliate(item.label)} →</em>
      </a>`;
    }).join('')}</div>
  `;
  anchor.before(box);
}

function bindAffiliateAnalytics() {
  document.addEventListener('click', event => {
    const link = event.target.closest('.affiliate-button,.affiliate-inline-link,.a8-top-banner a');
    if (!link) return;
    const key = link.dataset.affiliateKey || link.closest('[data-affiliate-key]')?.dataset.affiliateKey || 'banner';
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'affiliate_click', {
        affiliate_key: key,
        page_path: location.pathname,
        link_url: link.href
      });
    }
  }, { passive:true });
}
