(() => {
  const PICKUPS = [
    { label: '🏆 大会注目', cards: [
      { name: '一つの指輪', en: 'The One Ring', desc: '強力な防御能力とドローを両立する伝説のアーティファクト。幅広いデッキで採用候補になる定番カードです。' },
      { name: '黙示録、シェオルドレッド', en: 'Sheoldred, the Apocalypse', desc: '自分がカードを引くたびライフを得て、相手のドローにはダメージを与える強力なクリーチャー。' },
      { name: '稲妻', en: 'Lightning Bolt', desc: '1マナで大きなダメージを与えられる代表的な火力呪文。クリーチャー除去にも直接ダメージにも使えます。' }
    ]},
    { label: '🆕 新カード', cards: [
      { name: '完全なる統一、アトラクサ', en: 'Atraxa, Grand Unifier', desc: '戦場に出たときに大量のカードを手札へ加えられる大型クリーチャー。多色デッキの強力なフィニッシャー候補です。' },
      { name: '死の飢えのタイタン、クロクサ', en: 'Kroxa, Titan of Death’s Hunger', desc: '手札破壊と墓地からの再利用を兼ね備えた伝説のクリーチャー。墓地を活用する戦略と相性が良いカードです。' },
      { name: '一つの指輪', en: 'The One Ring', desc: 'カードを引きながら一時的に自分を守れる強力なアーティファクト。長期戦で特に存在感を発揮します。' }
    ]},
    { label: '💬 コミュニティ', cards: [
      { name: '対抗呪文', en: 'Counterspell', desc: '2マナで呪文を打ち消せる青の代表的なカード。相手の重要な呪文を止める基本的なカウンターです。' },
      { name: '剣を鍬に', en: 'Swords to Plowshares', desc: 'クリーチャー1体を追放できる非常に効率的な除去呪文。相手にライフを与える代わりに盤面を処理します。' },
      { name: '霊気貯蔵器', en: 'Aetherflux Reservoir', desc: '呪文を連続して唱えることでライフを大きく増やし、十分なライフを支払って大ダメージを狙えるアーティファクトです。' }
    ]}
  ];
  const day = Math.floor(Date.now() / 86400000);
  const cards = PICKUPS.map((group, i) => ({ ...group, ...group.cards[(day + i) % group.cards.length] }));
  const section = document.querySelector('#pickup');
  if (!section) return;
  const dateEl = section.querySelector('.pickup-date');
  if (dateEl) {
    const d = new Date();
    dateEl.textContent = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} 更新`;
  }
  const intro = section.querySelector('.pickup-intro');
  if (intro) intro.textContent = '大会・新カード・コミュニティの注目候補から、毎日3枚を自動で紹介します。';
  const pickupCards = [...section.querySelectorAll('.pickup-card')];
  pickupCards.forEach((card, i) => {
    const data = cards[i];
    if (!data) return;
    const label = card.querySelector('.pickup-label');
    const title = card.querySelector('.pickup-info h3');
    const desc = card.querySelector('.pickup-info p');
    if (label) label.textContent = data.label;
    if (title) title.textContent = data.name;
    if (desc) desc.textContent = data.desc;
    card.dataset.pickupName = data.name;
    card.dataset.pickupEnglishName = data.en;
  });
  document.dispatchEvent(new CustomEvent('magsta:daily-pickup', { detail: cards }));
})();
