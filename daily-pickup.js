(() => {
  const PICKUPS = [
    { label: '🏆 大会注目', names: ['Aetherflux Reservoir', 'The One Ring', 'Monumental Henge'] },
    { label: '🆕 新カード', names: ['Kroxa, Titan of Death’s Hunger', 'Sheoldred, the Apocalypse', 'Atraxa, Grand Unifier'] },
    { label: '💬 コミュニティ', names: ['Lightning Bolt', 'Counterspell', 'Swords to Plowshares'] }
  ];
  const day = Math.floor(Date.now() / 86400000);
  const cards = PICKUPS.map((group, i) => ({ ...group, name: group.names[(day + i) % group.names.length] }));
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
  if (intro) intro.textContent = '大会・新カード・コミュニティの注目候補から、毎日3枚を自動で入れ替えます。';
  const pickupCards = [...section.querySelectorAll('.pickup-card')];
  pickupCards.forEach((card, i) => {
    const data = cards[i];
    if (!data) return;
    const label = card.querySelector('.pickup-label');
    const title = card.querySelector('.pickup-info h3');
    const desc = card.querySelector('.pickup-info p');
    if (label) label.textContent = data.label;
    if (title) title.textContent = data.name;
    if (desc) desc.textContent = '今日のMAGSTA注目カード。大会・新カード・コミュニティの話題をチェック。';
    card.dataset.pickupName = data.name;
  });
  document.dispatchEvent(new CustomEvent('magsta:daily-pickup', { detail: cards }));
})();
