(() => {
  const PICKUPS = [
    { label: '🏆 大会注目', cards: [
      { name: '霊気貯蔵器', en: 'Aetherflux Reservoir', desc: 'アーティファクトを連続して唱えるほどライフを大きく伸ばせるカード。大量展開を狙うデッキとの相性が注目ポイントです。' },
      { name: '一つの指輪', en: 'The One Ring', desc: '強力な防御能力と大量ドローを両立する伝説のアーティファクト。さまざまなデッキで活躍しやすい定番カードです。' },
      { name: '記念碑の塚', en: 'Monumental Henge', desc: '土地として使いながら、条件を満たすとカード・アドバンテージにつながる注目カード。構築での採用先をチェックしたい1枚です。' }
    ]},
    { label: '🆕 新カード', cards: [
      { name: '死の飢えのタイタン、クロクサ', en: 'Kroxa, Titan of Death’s Hunger', desc: '手札破壊と墓地からの再利用を兼ね備えた強力な伝説のクリーチャー。墓地を活用する戦略で特に力を発揮します。' },
      { name: '黙示録、シェオルドレッド', en: 'Sheoldred, the Apocalypse', desc: '自分のドローでライフを回復し、相手のドローでダメージを与える強力なクリーチャー。長期戦で存在感を発揮します。' },
      { name: '完全なる統一、アトラクサ', en: 'Atraxa, Grand Unifier', desc: '登場時に大量のカードを手札へ加えられる大型クリーチャー。多色デッキのフィニッシャー候補として人気があります。' }
    ]},
    { label: '💬 コミュニティ', cards: [
      { name: '稲妻', en: 'Lightning Bolt', desc: 'わずかなマナでクリーチャーやプレイヤーに大きなダメージを与えられる、MTGを代表する火力呪文です。' },
      { name: '対抗呪文', en: 'Counterspell', desc: '呪文を確実に打ち消せる青の代表的なカード。シンプルながら非常に強力で、長年コミュニティで語られる定番です。' },
      { name: '剣を鍬に', en: 'Swords to Plowshares', desc: 'クリーチャーを低コストで追放できる白の代表的な除去呪文。相手にライフを与える代わりに盤面を処理できます。' }
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
  section.querySelector('.section-kicker')?.replaceChildren(document.createTextNode('DAILY PICKUP'));
  section.querySelector('h2')?.replaceChildren(document.createTextNode('今日のピックアップ'));
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
