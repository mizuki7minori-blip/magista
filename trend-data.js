/* MAGSTA Trend Data — lightweight local trend layer */
window.MAGSTA_TRENDS = {
  updated: new Date().toISOString(),
  items: [
    { type: '大会', title: '最新大会・入賞デッキをチェック', link: 'news.html', label: '大会情報' },
    { type: '相場', title: '価格変動が気になるカードをチェック', link: 'price.html', label: '相場情報' },
    { type: '新セット', title: '新セット・新カード情報をチェック', link: 'news.html', label: '新カード' },
    { type: '話題', title: 'いま話題のMTGトピックをチェック', link: '5ch.html', label: '話題' }
  ]
};

function renderMagstaTrends(targetId = 'magsta-trends') {
  const target = document.getElementById(targetId);
  if (!target || !window.MAGSTA_TRENDS) return;
  target.innerHTML = `
    <section class="magsta-trend-panel">
      <div class="section-head">
        <div><span class="section-kicker">TREND</span><h2>MTGトレンド</h2></div>
        <span class="trend-status">LIVE</span>
      </div>
      <div class="trend-grid">${window.MAGSTA_TRENDS.items.map(item => `
        <a class="trend-card" href="${item.link}">
          <span class="trend-type">${item.type}</span>
          <strong>${item.title}</strong>
          <span class="trend-link">${item.label} →</span>
        </a>`).join('')}</div>
    </section>`;
}

document.addEventListener('DOMContentLoaded', () => renderMagstaTrends());
