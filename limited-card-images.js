(() => {
  'use strict';

  const SNAPSHOT = {
    set: 'MSH',
    format: 'Premier Draft',
    games: '750,651',
    avgTurns: '9.002',
    playWinRate: '52.6%',
    checkedAt: '2026年9月16日'
  };

  const DATA_URL = 'https://www.17lands.com/card_data?expansion=MSH&format=PremierDraft&time_period=ALL_TIME&view=table';

  const replaceText = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  };

  const updateSnapshot = () => {
    replaceText('.limited-grid .limited-card:nth-child(1) .limited-metric', SNAPSHOT.games);
    replaceText('.limited-grid .limited-card:nth-child(2) .limited-metric', SNAPSHOT.avgTurns);
    replaceText('.limited-grid .limited-card:nth-child(3) .limited-metric', SNAPSHOT.playWinRate);

    const labels = [...document.querySelectorAll('.limited-section-title p')];
    labels.forEach((el) => {
      if (/HOB|MSH|Premier Draft/.test(el.textContent)) {
        el.textContent = `${SNAPSHOT.set} / ${SNAPSHOT.format}の公開値を基準に整理`;
      }
    });

    const notes = [...document.querySelectorAll('.limited-update, .limited-source')];
    notes.forEach((note) => {
      note.textContent = `※17Lands公開値（${SNAPSHOT.checkedAt}確認）。${SNAPSHOT.set} / ${SNAPSHOT.format}。数値は期間・フォーマットの条件により変動します。カード名・画像は17LandsとScryfallの公開情報を確認して表示します。`;
    });

    document.querySelectorAll('a[href*="expansion=HOB"]').forEach((a) => {
      a.href = DATA_URL;
      a.textContent = 'MSHカードデータ →';
    });

    document.querySelectorAll('.limited-rank').forEach((rank) => {
      rank.innerHTML = `<div class="limited-rank-item" style="grid-template-columns:1fr;display:block">
        <strong>MSH 最新カードデータ</strong>
        <span>17Lands / Premier Draft</span>
        <small>GIH WR・ATA・ALSAを最新公開値で確認</small>
        <a href="${DATA_URL}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;color:var(--accent);font-size:.72rem">17Landsでカード一覧を見る →</a>
      </div>`;
    });
  };

  const loadImages = () => {
    document.querySelectorAll('.limited-rank-item img[alt]').forEach((img) => {
      const name = (img.alt || '').trim();
      if (!name || img.dataset.scryfallLoaded) return;
      img.dataset.scryfallLoaded = '1';
      const makeUrl = (mode) => `https://api.scryfall.com/cards/named?${mode}=${encodeURIComponent(name)}&format=image&version=normal`;
      let fuzzyTried = false;
      img.addEventListener('error', () => {
        if (!fuzzyTried) {
          fuzzyTried = true;
          img.src = makeUrl('fuzzy');
        } else {
          img.alt = `${name}（画像を取得できませんでした）`;
        }
      });
      img.src = makeUrl('exact');
    });
  };

  const run = () => {
    updateSnapshot();
    loadImages();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
