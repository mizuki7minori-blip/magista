(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const metrics = ['jp_sale', 'jp_buy', 'usd', 'usd_jpy'];
  const colors = ['#ad4a00', '#497546', '#296ab3', '#864ba4'];
  const labels = {all:'総合（対象カード）',standard:'スタンダード',pioneer:'パイオニア',modern:'モダン',legacy:'レガシー',vintage:'ヴィンテージ',commander:'統率者',pauper:'パウパー'};
  const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = x => x === null || x === undefined ? '—' : Number(x).toLocaleString('ja-JP', {maximumFractionDigits:2});
  let data;
  function filtered(items) {
    if (!items.length || $('market-period').value === 'all') return items;
    const end = Date.parse(items[items.length - 1].date + 'T00:00:00Z');
    const days = Number($('market-period').value);
    return items.filter(p => Date.parse(p.date + 'T00:00:00Z') > end - days * 86400000);
  }
  function price(row, metric, snap) {
    if (!row) return null;
    if (metric === 'usd') return row.usd;
    if (metric === 'usd_jpy') return row.usd && snap.fx?.usd_jpy ? row.usd * snap.fx.usd_jpy : null;
    return row[metric]?.value ?? null;
  }
  function quoteCell(row, metric, snap) {
    const v = price(row, metric, snap);
    const q = row?.[metric];
    return q?.source_url && /^https:\/\//.test(q.source_url) ? `<a href="${esc(q.source_url)}" target="_blank" rel="noopener">${num(v)}</a><br><small>${esc(q.source)}</small>` : num(v);
  }
  function cardHistory() {
    const card = data.basket.cards.find(c => c.id === $('market-card').value);
    if (!card) return;
    $('card-caption').textContent = `${card.name} / ${card.set.toUpperCase()} #${card.collector_number} / 非Foil`;
    $('card-points').innerHTML = filtered(data.snapshots).map(s => {
      const row = s.cards.find(c => c.id === card.id);
      return `<tr><td>${esc(s.date)}</td>${metrics.map(m => `<td>${quoteCell(row, m, s)}</td>`).join('')}</tr>`;
    }).join('');
  }
  function render() {
    const group = $('market-group').value;
    const series = data.series[group];
    const dates = filtered(series.usd).map(p => p.date);
    const chosen = metrics.map(m => series[m].filter(p => dates.includes(p.date)));
    $('market-points').innerHTML = dates.map((date, i) => `<tr><td>${esc(date)}</td>${chosen.map(s => `<td>${num(s[i].index)}</td>`).join('')}</tr>`).join('');
    const last = chosen.map(s => s.at(-1));
    $('market-coverage').textContent = last[0] ? `最新の取得枚数：日本販売 ${last[0].coverage}/${last[0].total}、日本買取 ${last[1].coverage}/${last[1].total}、海外 ${last[2].coverage}/${last[2].total}。空欄は未取得です。` : '観測記録がありません。';
    const values = chosen.flat().map(p => p.index).filter(x => x !== null);
    if (dates.length < 2 || !values.length) {
      $('market-chart').innerHTML = '<p class="market-empty">推移グラフは2日以上の観測後に表示します。未観測期間の価格は補完しません。</p>';
    } else {
      const lo = Math.min(95, ...values) - 2, hi = Math.max(105, ...values) + 2;
      const times = dates.map(d => Date.parse(d + 'T00:00:00Z'));
      const x = i => 55 + 710 * (times[i] - times[0]) / Math.max(1, times.at(-1) - times[0]);
      const y = v => 265 - 225 * (v - lo) / (hi - lo);
      const grid = [lo,100,hi].map(v => `<line x1="55" x2="765" y1="${y(v)}" y2="${y(v)}" stroke="#ddd"/><text x="8" y="${y(v)}" font-size="12">${v.toFixed(1)}</text>`).join('');
      const paths = chosen.map((s, mi) => {
        let pen = false;
        const path = s.map((p, i) => { if(p.index === null){pen=false;return '';}const cmd=pen?'L':'M';pen=true;return `${cmd}${x(i)},${y(p.index)}`;}).join(' ');
        return `<path d="${path}" stroke="${colors[mi]}" fill="none" stroke-width="2.5"/>` + s.map((p,i) => p.index === null ? '' : `<circle cx="${x(i)}" cy="${y(p.index)}" r="3" fill="${colors[mi]}"><title>${esc(p.date)}: ${num(p.index)}</title></circle>`).join('');
      }).join('');
      $('market-chart').innerHTML = `<svg viewBox="0 0 800 310" role="img" aria-label="日本・海外の価格指数。数値は下の表で確認できます。">${grid}${paths}<text x="55" y="298" font-size="12">${dates[0]}</text><text x="765" y="298" text-anchor="end" font-size="12">${dates.at(-1)}</text></svg>`;
    }
    const snaps = filtered(data.snapshots), metric = $('market-metric').value;
    const cards = data.basket.cards.filter(c => group === 'all' || c.formats.includes(group) || group === 'set:' + c.set);
    const movers = snaps.length < 2 ? [] : cards.map(c => {
      const a = price(snaps[0].cards.find(r => r.id === c.id), metric, snaps[0]);
      const b = price(snaps.at(-1).cards.find(r => r.id === c.id), metric, snaps.at(-1));
      return a && b ? {...c, a,b,change:(b/a-1)*100} : null;
    }).filter(Boolean).sort((a,b) => b.change-a.change);
    const displayed = [...new Map([...movers.slice(0,5),...movers.slice(-5)].map(c => [c.id,c])).values()];
    $('market-movers').innerHTML = displayed.length ? displayed.map(c => `<tr><td>${esc(c.name)}<br><small>${esc(c.set.toUpperCase())} #${esc(c.collector_number)}</small></td><td>${num(c.a)}</td><td>${num(c.b)}</td><td>${c.change>0?'+':''}${num(c.change)}%</td></tr>`).join('') : '<tr><td colspan="4">比較できる価格がまだ揃っていません。</td></tr>';
    cardHistory();
  }
  async function init() {
    try {
      const response = await fetch('market-history.json');
      if (!response.ok) throw new Error('unavailable');
      data = await response.json();
      if (!data.snapshots?.length) throw new Error('empty');
      $('market-status').textContent = `最新観測：${new Date(data.updated_at).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})}（日本時間） / 固定サンプル ${data.basket.cards.length}枚。国内価格は取得済み分のみ。為替：${data.latest.fx ? data.latest.fx.usd_jpy + '円/USD（' + data.latest.fx.date + '）' : '未取得'}`;
      $('market-group').innerHTML = Object.keys(data.series).map(g => `<option value="${esc(g)}">${esc(labels[g] || 'セット：' + g.slice(4).toUpperCase())}</option>`).join('');
      $('market-card').innerHTML = data.basket.cards.map(c => `<option value="${esc(c.id)}">${esc(c.name)} / ${esc(c.set.toUpperCase())} #${esc(c.collector_number)}</option>`).join('');
      ['market-group','market-period','market-metric'].forEach(id => $(id).addEventListener('change',render));
      $('market-card').addEventListener('change',cardHistory);
      render();
    } catch(error) {
      $('market-status').textContent = '初回の価格記録待ちです。日本・海外とも未取得の価格は表示しません。';
      $('market-chart').innerHTML = '<p class="market-empty">観測データはまだありません。初回収集後に価格表、2日目以降に推移グラフを表示します。</p>';
    }
  }
  init();
})();
