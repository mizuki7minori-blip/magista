(() => {
  'use strict';

  const setSelect = document.getElementById('limited-set-select');
  const archSelect = document.getElementById('limited-arch-select');
  const topList = document.getElementById('limited-top-cards');
  const topNote = document.getElementById('limited-top-note');
  const gallery = document.getElementById('limited-card-gallery');
  if (!setSelect || !topList || !gallery) return;

  let archSection = document.getElementById('limited-archetype-ranking-section');
  if (!archSection) {
    archSection = document.createElement('section');
    archSection.id = 'limited-archetype-ranking-section';
    archSection.className = 'limited-section';
    archSection.innerHTML = `
      <div class="limited-section-title">
        <div><span class="limited-kicker">アーキランキング</span><h2>アーキタイプ勝率ランキング</h2></div>
        <p>17Lands PremierDraft / 2色アーキ</p>
      </div>
      <div id="limited-archetype-ranking"><div class="limited-card"><p>アーキタイプランキングを読み込み中です…</p></div></div>`;
    const hero = document.querySelector('.limited-hero');
    if (hero?.parentNode) hero.parentNode.insertBefore(archSection, hero.nextSibling);
  }
  const archRanking = document.getElementById('limited-archetype-ranking');

  const renderArchetypes = rows => {
    if (!archRanking) return;
    if (!Array.isArray(rows) || !rows.length) {
      archRanking.innerHTML = '<div class="limited-card"><strong>アーキタイプランキングを準備中です。</strong><p>次回の自動更新で17Landsの色別勝率を保存し、以後は前回値を表示します。</p></div>';
      return;
    }
    archRanking.innerHTML = `<div class="limited-table-wrap"><table class="limited-table">
      <thead><tr><th>順位</th><th>アーキタイプ</th><th>勝率</th><th>ゲーム数</th></tr></thead>
      <tbody>${rows.slice(0, 10).map((row, index) => `<tr>
        <td><span class="limited-badge">${index + 1}位</span></td>
        <td><strong>${row.name || row.code}</strong></td>
        <td>${Number(row.wr).toFixed(1)}%</td>
        <td>${Number(row.games || 0).toLocaleString()}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  };

  const render = async () => {
    const setKey = setSelect.value || 'fra';
    try {
      const response = await fetch(`limited-ranking-data.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('ranking data unavailable');
      const payload = await response.json();
      const snapshot = payload?.sets?.[setKey];
      const ranking = snapshot?.ranking || [];
      if (!ranking.length) throw new Error('no ranking');

      const top = ranking.slice(0, 10);
      topList.innerHTML = top.map((card, index) =>
        `<li><strong>${index + 1}位 ${card.name}</strong> — GIH WR ${Number(card.wr).toFixed(1)}%${card.games ? ` / ${Number(card.games).toLocaleString()}ゲーム` : ''}</li>`
      ).join('');

      renderArchetypes(snapshot?.archetypes || []);
      if (topNote) topNote.textContent = '保存済みランキングを先に表示中';
      gallery.innerHTML = `<div class="limited-card"><strong>ランキングは表示済みです。</strong><p>日本語名・カード画像・アーキタイプ別絞り込みを読み込んでいます…</p></div>`;
    } catch {
      topList.innerHTML = '<li>保存ランキングを読み込み中です</li>';
      renderArchetypes([]);
    }
  };

  setSelect.addEventListener('change', render);
  if (archSelect) archSelect.addEventListener('change', render);
  render();
})();
