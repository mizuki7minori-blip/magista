function renderAffiliate(targetId = 'affiliate-products') {
  const target = document.getElementById(targetId);
  if (!target || typeof MAGSTA_AFFILIATE === 'undefined') return;
  const items = (MAGSTA_AFFILIATE.products || []).filter(item => safeAffiliateUrl(item.url));
  if (!items.length) return;
  target.innerHTML = `
    <div class="affiliate-box">
      <div class="affiliate-head"><span class="section-kicker">RECOMMENDED</span><span class="affiliate-label">PR / AD</span></div>
      <h2>おすすめ・関連商品</h2>
      <p class="affiliate-disclosure">${MAGSTA_AFFILIATE.disclosure}</p>
      <div class="affiliate-list">${items.map(item => `
        <div class="affiliate-item">
          <div><strong>${escapeAffiliate(item.title)}</strong><p>${escapeAffiliate(item.description)}</p></div>
          <a class="button primary affiliate-button" href="${escapeAffiliate(safeAffiliateUrl(item.url))}" target="_blank" rel="sponsored nofollow noopener noreferrer">${escapeAffiliate(item.label)} →</a>
        </div>`).join('')}</div>
    </div>`;
}
function escapeAffiliate(value) { return String(value).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function safeAffiliateUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; }
  catch { return ''; }
}
document.addEventListener('DOMContentLoaded', () => renderAffiliate());
