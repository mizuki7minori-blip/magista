(() => {
  'use strict';

  const FALLBACK = [
    { label:'🏆 大会注目', name:'一つの指輪', en:'The One Ring', desc:'強力な防御能力とドローを両立する代表的なアーティファクト。競技・カジュアル双方で動向を追いやすい1枚。' },
    { label:'🆕 新カード', name:'オークの弓使い', en:'Orcish Bowmasters', desc:'カードを多く引く相手への対策として存在感を持つクリーチャー。採用環境の変化をチェック。' },
    { label:'💬 コミュニティ', name:'対抗呪文', en:'Counterspell', desc:'青を代表する定番カウンター。フォーマットごとの採用状況を見比べやすいカード。' }
  ];

  const section = document.querySelector('#pickup');
  if (!section) return;

  const today = new Date();
  const iso = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`;
  const dayIndex = Math.floor(Date.now() / 86400000);

  const fallback = FALLBACK.map((x,i) => ({...x, rank:i+1}));
  const apply = cards => {
    const dateEl = section.querySelector('.pickup-date');
    if (dateEl) dateEl.textContent = `${iso} 更新`;
    const intro = section.querySelector('.pickup-intro');
    if (intro) intro.textContent = '大会・新カード・コミュニティの注目候補から、毎日3枚を紹介します。';
    [...section.querySelectorAll('.pickup-card')].forEach((card,i) => {
      const data = cards[i];
      if (!data) return;
      const label=card.querySelector('.pickup-label'), title=card.querySelector('.pickup-info h3');
      const desc=card.querySelector('.pickup-info p'), rank=card.querySelector('.pickup-rank');
      if(label) label.textContent=data.label || 'DAILY PICKUP';
      if(title) title.textContent=data.name || data.ja || data.en || '注目カード';
      if(desc) desc.textContent=data.desc || data.reason || 'MAGSTA注目カード。';
      if(rank) rank.textContent=String(i+1).padStart(2,'0');
      card.dataset.pickupName = data.name || data.ja || '';
      card.dataset.pickupEnglishName = data.en || '';
    });
    document.dispatchEvent(new CustomEvent('magsta:daily-pickup', {detail:cards}));
  };

  const load = async () => {
    let cards = null;
    try {
      const r = await fetch(`pickup-data.json?d=${Date.now()}`, {cache:'no-store'});
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data) && data.length >= 3) cards = data.slice(0,3);
      }
    } catch (_) {}
    if (!cards) {
      // Always show useful content even when GitHub Pages/CDN fetches are temporarily unavailable.
      cards = fallback.map((x,i) => ({...x, rank:i+1}));
    }
    apply(cards);
    // If the JSON is stale, rotate the fallback only as a last-resort visual safeguard.
    if (cards.every(c => !c.en)) apply(fallback);
  };

  load();

  if (!document.querySelector('#limited-home')) {
    const matome = document.querySelector('#matome');
    if (matome) {
      const limited = document.createElement('section');
      limited.id = 'limited-home';
      limited.className = 'category-section';
      limited.innerHTML = `
        <div class="section-heading">
          <div><span class="section-kicker">LIMITED</span><h2>リミテッド最新記事</h2></div>
          <a href="limited.html" class="more">詳しく見る →</a>
        </div>
        <p class="pickup-intro">17Landsの公開データをもとに、ドラフトで注目したいカードと環境の動きをチェック。</p>
        <div class="topic-list">
          <a href="limited.html" class="topic"><span class="topic-number">01</span><span><b>リミテッド環境の最新スナップショット</b><small>ゲーム数・平均ターン・先手勝率を確認</small></span><span>›</span></a>
          <a href="limited.html" class="topic"><span class="topic-number">02</span><span><b>今注目したいリミテッドカード</b><small>GIH WRとATAを組み合わせて評価</small></span><span>›</span></a>
          <a href="limited.html" class="topic"><span class="topic-number">03</span><span><b>次のドラフトで見るべきポイント</b><small>カード・ピック順位・環境速度を整理</small></span><span>›</span></a>
        </div>`;
      matome.parentNode.insertBefore(limited, matome);
    }
  }
})();