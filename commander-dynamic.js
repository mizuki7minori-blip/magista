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
  const hasJapanese = s => /[\u3040-\u30ff\u3400-\u9fff]/.test(String(s || ''));
  const displayName = c => c?.printed_name || c?.name || '名称不明';

  const style = document.createElement('style');
  style.textContent = `
    .any-commander{margin:18px 0;padding:18px;border:1px solid var(--line);border-radius:10px;background:#f8fafb}
    .any-commander h3{margin:0 0 6px}.any-search-row{display:grid;grid-template-columns:1fr auto;gap:8px}
    .any-search-row input{min-height:46px;padding:10px 12px;border:1px solid var(--line);border-radius:7px;font:inherit}
    .any-search-row button{min-height:46px}.any-results{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}
    .any-result{display:flex;flex-direction:column;gap:8px;text-align:left;border:1px solid var(--line);background:#fff;border-radius:10px;padding:9px;cursor:pointer;min-width:0}
    .any-result:hover{border-color:#8090a0;box-shadow:0 3px 10px #20304012}.any-result.is-selected{outline:3px solid #246daf;outline-offset:1px}
    .any-result img{width:100%;aspect-ratio:488/680;object-fit:cover;border-radius:7px;background:#eef1f4}.any-result strong{display:block;font-size:.88rem;line-height:1.35}.any-result small{display:block;color:var(--muted);font-size:.72rem;line-height:1.3;margin-top:3px}
    .any-result-meta{display:flex;align-items:center;justify-content:space-between;gap:8px}.any-select-label{font-size:.72rem;font-weight:800;color:#246daf}
    .identity-badges{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}.identity-badges span{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#202833;color:#fff;font-size:.7rem;font-weight:800}
    .dynamic-note{font-size:.78rem;color:var(--muted);margin-top:8px}.dynamic-loading{padding:18px;color:var(--muted)}
    @media(max-width:900px){.any-results{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.any-search-row{grid-template-columns:1fr}.any-results{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);

  const controls = select.closest('.commander-builder-controls');
  const box = document.createElement('section');
  box.className = 'any-commander';
  box.innerHTML = `
    <span class="section-kicker">統率者を自由検索</span>
    <h3>日本語・英語で統率者を検索</h3>
    <p>候補が複数ある場合は、画像・日本語名・英語名を見比べて選択できます。</p>
    <div class="any-search-row"><input id="any-commander-input" type="search" placeholder="例：アトラクサ / クラウド / Atraxa"><button id="any-commander-button" class="button primary" type="button">検索</button></div>
    <div id="any-commander-results" class="any-results"></div>
    <div id="any-commander-status" class="dynamic-note"></div>`;
  controls.before(box);

  const input = box.querySelector('#any-commander-input');
  const button = box.querySelector('#any-commander-button');
  const results = box.querySelector('#any-commander-results');
  const status = box.querySelector('#any-commander-status');

  async function fetchSearch(query) {
    const r = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=edhrec&unique=prints`);
    if (!r.ok) return [];
    const data = await r.json();
    return data.data || [];
  }

  async function enrichJapanese(cards) {
    const seen = new Set();
    const out = [];
    for (const card of cards) {
      if (seen.has(card.oracle_id || card.name)) continue;
      seen.add(card.oracle_id || card.name);
      let best = card;
      if (!card.printed_name) {
        try {
          const q = `oracleid:${card.oracle_id} lang:ja game:paper`;
          const jp = await fetchSearch(q);
          if (jp[0]) best = jp[0];
        } catch(e) {}
      }
      out.push(best);
      if (out.length >= 8) break;
    }
    return out;
  }

  async function searchCommanders() {
    const q = input.value.trim();
    if (q.length < 2) { status.textContent = '2文字以上入力してください。'; return; }
    button.disabled = true; results.innerHTML = '<div class="dynamic-loading">検索中…</div>'; status.textContent = '';
    try {
      let cards = [];
      if (hasJapanese(q)) {
        cards = await fetchSearch(`is:commander game:paper lang:ja name:${JSON.stringify(q)}`);
        if (!cards.length) cards = await fetchSearch(`is:commander game:paper lang:ja ${JSON.stringify(q)}`);
      } else {
        cards = await fetchSearch(`is:commander game:paper name:${JSON.stringify(q)}`);
      }
      cards = await enrichJapanese(cards);
      if (!cards.length) { results.innerHTML=''; status.textContent='候補が見つかりませんでした。日本語名または英語名の一部で試してください。'; return; }
      results.innerHTML = cards.map((c,i) => {
        const jp = displayName(c);
        const en = c.name || jp;
        return `<button type="button" class="any-result" data-i="${i}" aria-label="${esc(jp)}を統率者に選ぶ">${imgOf(c)?`<img src="${imgOf(c)}" loading="lazy" decoding="async" alt="${esc(jp)}">`:''}<span><strong>${esc(jp)}</strong>${jp!==en?`<small>${esc(en)}</small>`:''}<span class="identity-badges">${(c.color_identity?.length?c.color_identity:['C']).map(x=>`<span>${x}</span>`).join('')}</span></span><span class="any-result-meta"><span class="any-select-label">この統率者を選ぶ</span></span></button>`;
      }).join('');
      results.querySelectorAll('.any-result').forEach(el => el.addEventListener('click', async () => {
        results.querySelectorAll('.any-result').forEach(x=>x.classList.remove('is-selected'));
        el.classList.add('is-selected');
        status.textContent = '選択中…';
        await chooseCommander(cards[Number(el.dataset.i)]);
      }));
      status.textContent = cards.length === 1 ? '1件見つかりました。カードをタップして選択してください。' : `${cards.length}件の候補があります。画像と名前を見比べて選択してください。`;
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
      const o = document.createElement('option');
      o.value = card.name;
      o.textContent = displayName(card);
      o.title = card.name;
      o.dataset.dynamic='1';
      select.appendChild(o);
    }
    select.value = card.name;
    const picked = displayName(card);
    results.innerHTML=''; input.value='';
    status.textContent = `${picked} を統率者に選択しました。`;
    await renderDynamic();
  }

  async function renderDynamic() {
    const c = state.dynamicCommander;
    if (!c || select.value !== c.name) return;
    const identity = c.color_identity || [];
    const colors = identity.length ? identity.join(' / ') : '無色';
    const budgetText = budget.value === 'open' ? '上限なし' : `${Number(budget.value).toLocaleString('ja-JP')}円前後`;
    const shownName = displayName(c);
    summary.innerHTML = `<strong>${esc(shownName)}</strong>${shownName!==c.name?`<small>${esc(c.name)}</small>`:''}固有色：${esc(colors)} / 予算：${budgetText} / ブラケット ${esc(bracket.value)}。固有色内の統率者戦合法カードから採用候補を自動抽出します。`;
    grid.innerHTML = '<div class="dynamic-loading">候補カードを取得しています…</div>';
    const batches = await Promise.all(roleQueries.map(([role,q]) => fetchRole(role,q,identity,c.name)));
    state.suggestions = batches.flat().slice(0,10);
    if (!state.suggestions.length) { grid.innerHTML='<p class="builder-empty">候補カードを取得できませんでした。</p>'; return; }
    grid.innerHTML = state.suggestions.map(({card,role}) => `<article class="synergy-card"><div class="synergy-image">${imgOf(card)?`<a href="${esc(card.scryfall_uri)}" target="_blank" rel="noopener noreferrer"><img src="${imgOf(card)}" loading="lazy" decoding="async" alt="${esc(card.name)}"></a>`:''}</div><div class="synergy-body"><span class="synergy-role">${esc(role)}</span><h3>${esc(card.name)}</h3><p>${esc((card.oracle_text||'').slice(0,100))}${(card.oracle_text||'').length>100?'…':''}</p></div></article>`).join('');
    const high = Number(bracket.value) >= 4;
    const lands = high ? '34〜36' : '36〜38';
    if (plan) plan.innerHTML = [['固有色',colors],['土地',lands],['候補カード','10枚'],['調整方針',high?'速度・妨害を厚め':'安定性・テーマ性を重視']].map(([k,v])=>`<div><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join('');
    status.textContent = `${shownName} を統率者に選択しました。`;
  }

  button.addEventListener('click', searchCommanders);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); searchCommanders(); } });
  select.addEventListener('change', () => { if (state.dynamicCommander && select.value === state.dynamicCommander.name) renderDynamic(); });
  budget.addEventListener('change', renderDynamic);
  bracket.addEventListener('change', renderDynamic);
})();