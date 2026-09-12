(() => {
  'use strict';

  const SNAPSHOT = {
    set: 'HOB',
    format: 'Premier Draft',
    games: '332,859',
    avgTurns: '8.572',
    playWinRate: '54.6%',
    checkedAt: '2026年9月12日'
  };

  const updateSnapshotMeta = () => {
    const section = document.querySelector('.limited-section');
    if (!section) return;
    const notes = [...document.querySelectorAll('.limited-update, .limited-source')];
    const note = notes.find((el) => el.classList.contains('limited-update')) || notes[0];
    if (!note) return;
    note.textContent = `※17Lands公開値（${SNAPSHOT.checkedAt}確認）。${SNAPSHOT.set} / ${SNAPSHOT.format}。セット・期間・フォーマットの条件により変動します。日本語カード名は公式・国内カード情報を確認して表記しています。`;
  };

  // ScryfallのJSON APIをブラウザからfetchする方式では、環境によってCORS・通信制限の影響を受けるため、
  // 画像エンドポイントへ直接読み込む方式に変更。画像タグ自身がリダイレクト先を取得します。
  const loadImages = () => {
    const cards = [...document.querySelectorAll('.limited-rank-item')];
    if (!cards.length) return;

    cards.forEach((item) => {
      const img = item.querySelector('img[alt]');
      const nameNode = item.querySelector('span');
      const name = (nameNode?.textContent || '').trim();
      if (!img || !name || img.dataset.scryfallLoaded) return;

      img.dataset.scryfallLoaded = '1';
      img.dataset.originalSrc = img.src;
      img.dataset.cardName = name;

      const makeUrl = (mode) =>
        `https://api.scryfall.com/cards/named?${mode}=${encodeURIComponent(name)}&format=image&version=normal`;

      const fallback = () => {
        if (img.dataset.fuzzyTried) {
          img.dataset.broken = '1';
          img.alt = `${name}（画像を取得できませんでした）`;
          return;
        }
        img.dataset.fuzzyTried = '1';
        img.src = makeUrl('fuzzy');
      };

      img.addEventListener('error', fallback, { once: false });
      img.addEventListener('load', () => {
        img.removeAttribute('data-broken');
      }, { once: true });

      img.src = makeUrl('exact');
    });
  };

  const run = () => {
    updateSnapshotMeta();
    loadImages();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
