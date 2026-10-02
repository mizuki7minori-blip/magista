(() => {
  'use strict';

  const container = document.getElementById('limited-archetype-ranking');
  const selector = document.getElementById('limited-set-select');
  const archSelector = document.getElementById('limited-arch-select');
  if (!container || !selector) return;

  const label = code => ({
    WU: '白青（アゾリウス）', UB: '青黒（ディミーア）', BR: '黒赤（ラクドス）',
    RG: '赤緑（グルール）', GW: '緑白（セレズニア）', WB: '白黒（オルゾフ）',
    BG: '黒緑（ゴルガリ）', GU: '緑青（シミック）', UR: '青赤（イゼット）',
    RW: '赤白（ボロス）'
  }[code] || code);

  const render = rows => {
    if (!Array.isArray(rows) || !rows.length) {
      container.innerHTML = '<div class="limited-card"><strong>アーキタイプランキングを準備中です。</strong><p>次回の自動更新で17Landsの色別勝率を保存し、以後は前回データを表示します。</p></div>';
      return;
    }

    container.innerHTML = `<div class="limited-table-wrap"><table class="limited-table">
      <thead><tr><th>順位</th><th>アーキタイプ</th><th>勝率</th><th>ゲーム数</th></tr></thead>
      <tbody>${rows.slice(0, 10).map((row, index) => `<tr>
        <td><span class="limited-badge">${index + 1}位</span></td>
        <td><button type="button" class="limited-arch-jump" data-arch="${row.code}" style="border:0;background:none;padding:0;font:inherit;font-weight:800;cursor:pointer;text-decoration:underline;text-underline-offset:3px">${row.name || label(row.code)}</button></td>
        <td>${Number(row.wr).toFixed(1)}%${Number(row.games||0)<3000?`<br><small style="color:var(--muted)">参考値</small>`:``}</td>
        <td>${Number(row.games || 0).toLocaleString()}${Number(row.games||0)<3000?`<br><small style="color:var(--muted)">母数少なめ</small>`:``}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
    container.querySelectorAll('.limited-arch-jump').forEach(button=>{
      button.addEventListener('click',()=>{
        if(!archSelector)return;
        archSelector.value=button.dataset.arch;
        archSelector.dispatchEvent(new Event('change',{bubbles:true}));
        document.getElementById('limited-gallery-title')?.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
  };

  const load = async () => {
    try {
      const response = await fetch('limited-ranking-data.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('snapshot');
      const payload = await response.json();
      const set = payload?.sets?.[selector.value];
      render(set?.archetypes || []);
    } catch {
      render([]);
    }
  };

  selector.addEventListener('change', load);
  load();
})();
