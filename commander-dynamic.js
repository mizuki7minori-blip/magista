(() => {
  const select = document.getElementById('commander-select');
  const budget = document.getElementById('budget-select');
  const bracket = document.getElementById('bracket-select');
  const summary = document.getElementById('builder-summary');
  const grid = document.getElementById('synergy-grid');
  const plan = document.getElementById('budget-plan');
  if (!select || !summary || !grid) return;

  const state = { dynamicCommander: null, suggestions: [] };
  const esc = s => String(s || '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const imgOf = c => c?.image_uris?.normal || c?.card_faces?.[0]?.image_uris?.normal || '';
  const jpName = c => c?.printed_name || c?.name || '名称不明';

  const style = document.createElement('style');
  style.textContent = `
    .any-commander{margin:18px 0;padding:18px;border:1px solid var(--line);border-radius:10px;background:#f8fafb}
    .any-commander h3{margin:0 0 6px}.any-search-row{display:grid;grid-template-columns:1fr auto;gap:8px}
    .any-search-row input{min-height:46px;padding:10px 12px;border:1px solid var(--line);border-radius:7px;font:inherit}
    .any-search-row button{min-height:46px}.any-results{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}
    .any-result{display:flex;gap:9px;align-items:center;text-align:left;border:1px solid var(--line);background:#fff;border-radius:8px;padding:8px;cursor:pointer}
    .any-result img{width:52px;aspect-ratio:488/680;object-fit:cover;border-radius:5px;background:#eef1f4}.any-result strong{font-size:.83rem;line-height:1.25}
    .identity-badges{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}.identity-badges span{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#202833;color:#fff;font-size:.7rem;font-weight:800}
    .dynamic-note{font-size:.78rem;color:var(--muted);margin-top:8px}.dynamic-loading{padding:18px;color:var(--muted)}
    @media(max-width:900px){.any-results{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.any-search-row{grid-template-columns:1fr}.any-results{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const controls = select.closest('.commander-builder-controls');
  const box = document.createElement('section');
  box.className = 'any-commander';
  box.innerHTML = `
    <span class="section-kicker">ANY COMMANDER SEARCH</span>
    <h3>好きな統率者を自由検索</h3>
    <p>固定候補にない統率者もScryfallから検索できます。選ぶと固有色を判定して候補カードを自動表示します。</p>
    <div class="any-search-row"><input id="any-commander-input" type="search" placeholder="例：Cloud / Sephiroth / Atraxa"><button id="any-commander-button" class="button primary" type="button">検索</button></div>
    <div id="any-commander-results" class="any-results"></div>
    <div id="any-commander-status" class="dynamic-note"></div>`;
  controls.before(box);

  const input = box.querySelector('#any-commander-input');
  const button = box.querySelector('#any-commander-button');
  const results = box.querySelector('#any-commander-results');
  const status = box.querySelector('#any-commander-status');

  async function searchCommanders() {
    const q = input.value.trim();
    if (q.length < 2) { status.textContent = '2文字以上入力してください。'; return; }
    button.disabled = true; results.innerHTML = '<div class="dynamic-loading">検索中…</div>'; status.textContent = '';
    try {
      const query = `is:commander game:paper name:${JSON.stringify(q)}`;
      const r = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=edhrec&unique=cards`);
      if (!r.ok) throw new Error('search failed');
      const data = await r.json();
      const cards = (data.data || []).slice(0, 8);
      if (!cards.length) { results.innerHTML=''; status.textContent='候補が見つかりませんでした。英語名の一部でも試してください。'; return; }
      results.innerHTML = cards.map((c,i) => `<button type="button" class="any-result" data-i="${i}">${imgOf(c)?`<img src="${imgOf(c)}" loading="lazy" alt="">`:''}<span><strong>${esc(c.name)}</strong><span class="identity-badges">${(c.color_identity?.length?c.color_identity:['C']).map(x=>`<span>${x}</span>`).join('')}</span></span></button>`).join('');
      results.querySelectorAll('.any-result').forEach(el => el.addEventListener('click', () => chooseCommander(cards[Number(el.dataset.i)])));
      status.textContent = `${cards.length}件を表示。カードを選ぶとBuilderに反映します。`;
    } catch(e) {
      results.innerHTML=''; status.textContent='検索に失敗しました。通信状態を確認して再度お試しください。';
    } finally { button.disabled = false; }
  }

  function identityQuery(identity) {
    if (!identity || !identity.length) return 'id:c';
    return `id<=${identity.join('')}`;
  }

  const roleQueries = [
    ['マナ加速','(oracle:"add {" OR t:artifact) cmc<=3'],
    ['ドロー','oracle:"draw"'],
    ['除去','(oracle:"destroy target" OR oracle:"exile target")'],
    ['防御・妨害','(oracle:"counter target" OR oracle:"hexproof" OR oracle:"indestructible")'],
    ['勝ち筋候補','(oracle:"whenever" OR oracle:"each opponent")']
  ];

  async function fetchRole(role, roleQuery, identity, commanderName) {
    const q = `legal:commander game:paper ${identityQuery(identity)} -name:${JSON.stringify(commanderName)} ${roleQuery}`;
    try {
      const r = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&order=edhrec&unique=cards`);
      if (!r.ok) return [];
      const data = await r.json();
      return (data.data || []).slice(0,2).map(c => ({card:c,role}));
    } catch(e) { return []; }
  }

  async function chooseCommander(card) {
    state.dynamicCommander = card;
    const existing = [...select.options].find(o => o.value === card.name);
    if (!existing) {
      const o = document.createElement('option'); o.value = card.name; o.textContent = card.name; o.dataset.dynamic='1'; select.appendChild(o);
    }
    select.value = card.name;
    results.innerHTML=''; input.value='';
    await renderDynamic();
  }

  async function renderDynamic() {
    const c = state.dynamicCommander;
    if (!c || select.value !== c.name) return;
    const identity = c.color_identity || [];
    const colors = identity.length ? identity.join(' / ') : '無色';
    const budgetText = budget.value === 'open' ? '上限なし' : `${Number(budget.value).toLocaleString('ja-JP')}円前後`;
    summary.innerHTML = `<strong>${esc(c.name)}</strong>固有色：${esc(colors)} / 予算：${budgetText} / Bracket ${esc(bracket.value)}。ScryfallのCommander合法カードから、固有色内の採用候補を自動抽出しています。`;
    grid.innerHTML = '<div class="dynamic-loading">候補カードを取得しています…</div>';
    const batches = await Promise.all(roleQueries.map(([role,q]) => fetchRole(role,q,identity,c.name)));
    state.suggestions = batches.flat().slice(0,10);
    if (!state.suggestions.length) { grid.innerHTML='<p class="builder-empty">候補カードを取得できませんでした。</p>'; return; }
    grid.innerHTML = state.suggestions.map(({card,role}) => `<article class="synergy-card"><div class="synergy-image">${imgOf(card)?`<a href="${esc(card.scryfall_uri)}" target="_blank" rel="noopener noreferrer"><img src="${imgOf(card)}" loading="lazy" alt="${esc(card.name)}"></a>`:''}</div><div class="synergy-body"><span class="synergy-role">${esc(role)}</span><h3>${esc(card.name)}</h3><p>${esc((card.oracle_text||'').slice(0,100))}${(card.oracle_text||'').length>100?'…':''}</p></div></article>`).join('');
    const high = Number(bracket.value) >= 4;
    const lands = high ? '34〜36' : '36〜38';
    if (plan) plan.innerHTML = [['固有色',colors],['土地',lands],['候補カード','10枚'],['調整方針',high?'速度・妨害を厚め':'安定性・テーマ性を重視']].map(([k,v])=>`<div><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join('');
    status.textContent = '自由検索の統率者をBuilderへ反映しました。候補は固有色・Commander合法性を自動チェックしています。';
  }

  button.addEventListener('click', searchCommanders);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); searchCommanders(); } });
  select.addEventListener('change', () => { if (state.dynamicCommander && select.value === state.dynamicCommander.name) renderDynamic(); });
  budget.addEventListener('change', renderDynamic);
  bracket.addEventListener('change', renderDynamic);
})();
