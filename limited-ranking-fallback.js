(() => {
  'use strict';

  const setSelect = document.getElementById('limited-set-select');
  const archSelect = document.getElementById('limited-arch-select');
  const topList = document.getElementById('limited-top-cards');
  const topNote = document.getElementById('limited-top-note');
  const gallery = document.getElementById('limited-card-gallery');
  if (!setSelect || !topList || !gallery) return;

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

      if (topNote) topNote.textContent = '保存済みランキングを先に表示中';
      gallery.innerHTML = `<div class="limited-card"><strong>ランキングは表示済みです。</strong><p>日本語名・カード画像・アーキタイプ別絞り込みを読み込んでいます…</p></div>`;
    } catch {
      topList.innerHTML = '<li>保存ランキングを読み込み中です</li>';
    }
  };

  setSelect.addEventListener('change', render);
  if (archSelect) archSelect.addEventListener('change', render);
  render();
})();
