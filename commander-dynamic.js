(() => {
  const select = document.getElementById('commander-select');
  const budget = document.getElementById('budget-select');
  const bracket = document.getElementById('bracket-select');
  const strategy = document.getElementById('strategy-select');
  const summary = document.getElementById('builder-summary');
  const grid = document.getElementById('synergy-grid');
  const plan = document.getElementById('budget-plan');
  if (!select || !summary || !grid) return;

  const state = { dynamicCommander: null, suggestions: [], themes: [] };
  const esc = s => String(s || '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const imgOf = c => c?.image_uris?.normal || c?.card_faces?.[0]?.image_uris?.normal || '';
  const hasJapanese = s => /[\u3040-\u30ff\u3400-\u9fff]/.test(String(s || ''));
  const displayName = c => c?.printed_name || c?.name || '名称不明';
  const displayText = c => c?.printed_text || c?.oracle_text || c?.card_faces?.map(f=>f.printed_text || f.oracle_text || '').join(' // ') || '';
  const oracleText = c => [c?.oracle_text, ...(c?.card_faces || []).map(f=>f.oracle_text)].filter(Boolean).join(' ').toLowerCase();
  const typeText = c => [c?.type_line, ...(c?.card_faces || []).map(f=>f.type_line)].filter(Boolean).join(' ').toLowerCase();

  const strategyNames = { balanced:'バランス型', control:'妨害重視', speed:'スピード重視', combo:'コンボ重視' };
  const initialParams=new URLSearchParams(location.search);
const strategyDescriptions = {
    balanced:'統率者固有のテーマを中心に、加速・ドローなどを補います。',
    control:'統率者固有のテーマを残しつつ、妨害・除去・防御を厚くします。',
    speed:'統率者の勝ち筋へ早く到達するため、軽い加速・展開補助を優先します。',
    combo:'統率者のテーマに沿うサーチ・ドロー・保護・コンボ部品を優先します。'
  };

if(strategy&&initialParams.get('strategy')&&strategyNames[initialParams.get('strategy')])strategy.value=initialParams.get('strategy');
  const genericStaples = new Set([
    'sol ring','arcane signet','command tower','swiftfoot boots','lightning greaves',
    'rhystic study','smothering tithe','cyclonic rift','demonic tutor','vampiric tutor',
    'swords to plowshares','path to exile','counterspell','farewell','the one ring',
    "teferi's protection",'heroic intervention','chaos warp','fierce guardianship'
  ]);

  const style = document.createElement('style');
  style.textContent = `
    .any-commander{margin:18px 0;padding:18px;border:1px solid var(--line);border-radius:10px;background:#f8fafb}
    .any-commander h3{margin:0 0 6px}.any-search-row{display:grid;grid-template-columns:1fr auto;gap:8px}
    .any-search-row input{min-height:46px;padding:10px 12px;border:1px solid var(--line);border-radius:7px;font:inherit}
    .any-search-row button{min-height:46px}.any-results{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}
    .any-result{display:flex;flex-direction:column;gap:8px;text-align:left;border:1px solid var(--line);background:#fff;border-radius:10px;padding:9px;cursor:pointer;min-width:0}
    .any-result:hover{border-color:#8090a0;box-shadow:0 3px 10px #20304012}
    .any-result img{width:100%;aspect-ratio:488/680;object-fit:cover;border-radius:7px;background:#eef1f4}.any-result strong{display:block;font-size:.88rem;line-height:1.35}.any-result small,.synergy-body small{display:block;color:var(--muted);font-size:.72rem;line-height:1.3;margin-top:3px}
    .any-result-meta{display:flex;align-items:center;justify-content:space-between;gap:8px}.any-select-label{font-size:.72rem;font-weight:800;color:#246daf}
    .identity-badges{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}.identity-badges span{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#202833;color:#fff;font-size:.7rem;font-weight:800}
    .dynamic-note{font-size:.78rem;color:var(--muted);margin-top:8px}.dynamic-loading{padding:18px;color:var(--muted)}
    .dynamic-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.theme-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.theme-badges span{padding:4px 8px;border-radius:999px;background:#eef3f7;font-size:.72rem;font-weight:800}.synergy-reason{margin-top:7px!important;padding-top:7px;border-top:1px dashed var(--line);font-size:.74rem!important}
    .commander-goals{margin:18px 0;padding:18px;border:1px solid var(--line);border-radius:10px;background:#fff}.commander-goals h3{margin:0 0 5px}.commander-goal-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}.commander-goal{min-height:74px;padding:12px;border:1px solid var(--line);border-radius:9px;background:#f8fafb;text-align:left;cursor:pointer;font:inherit}.commander-goal strong{display:block;margin-bottom:4px}.commander-goal small{color:var(--muted);line-height:1.35}.commander-goal.is-active{border-color:#80501f;box-shadow:0 0 0 2px #80501f18;background:#fffaf4}
    @media(max-width:900px){.any-results{grid-template-columns:repeat(2,1fr)}.commander-goal-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.any-search-row{grid-template-columns:1fr}.any-results{grid-template-columns:repeat(2,minmax(0,1fr))}.commander-goal-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const controls = select.closest('.commander-builder-controls');
  const box = document.createElement('section');
  box.className = 'any-commander';
  box.innerHTML = `
    <span class="section-kicker">統率者を自由検索</span>
    <h3>日本語・英語で統率者を検索</h3>
    <p>統率者の能力からテーマを判定し、その統率者らしいカードを優先して候補化します。</p>
    <div class="any-search-row"><input id="any-commander-input" type="search" placeholder="例：アトラクサ / クラウド / Atraxa"><button id="any-commander-button" class="button primary" type="button">検索</button></div>
    <div id="any-commander-results" class="any-results"></div>
    <div id="any-commander-status" class="dynamic-note"></div>
    <div class="dynamic-actions"><button id="load-synergy-button" class="button secondary" type="button" hidden>相性カード候補を表示</button></div>`;
  controls.before(box);

  const goalBox = document.createElement('section');
  goalBox.className = 'commander-goals';
  goalBox.innerHTML = `
    <span class="section-kicker">何をしたい？</span>
    <h3>デッキの動かし方から選ぶ</h3>
    <p class="dynamic-note">目的を押すと、統率者の固有テーマを残したまま候補カードの優先順位を切り替えます。</p>
    <div class="commander-goal-grid">
      <button type="button" class="commander-goal" data-strategy="balanced"><strong>バランスよく組みたい</strong><small>テーマ・加速・ドローを均等に補強</small></button>
      <button type="button" class="commander-goal" data-strategy="control"><strong>妨害したい</strong><small>除去・打ち消し・防御を厚くする</small></button>
      <button type="button" class="commander-goal" data-strategy="speed"><strong>スピードを上げたい</strong><small>軽い加速・コスト軽減を優先</small></button>
      <button type="button" class="commander-goal" data-strategy="combo"><strong>コンボを決めたい</strong><small>サーチ・保護・コンボ部品を優先</small></button>
    </div>`;
  controls.before(goalBox);

  const goalButtons = [...goalBox.querySelectorAll('.commander-goal')];
  const syncGoalButtons = () => goalButtons.forEach(btn => btn.classList.toggle('is-active', btn.dataset.strategy === (strategy?.value || 'balanced')));
  goalButtons.forEach(btn => btn.addEventListener('click', () => {
    if (!strategy) return;
    strategy.value = btn.dataset.strategy;
    syncGoalButtons();
    strategy.dispatchEvent(new Event('change', { bubbles: true }));
    window.dispatchEvent(new CustomEvent('magsta:strategy-change', { detail: { strategy: strategy.value } }));
  }));
  syncGoalButtons();

  const input = box.querySelector('#any-commander-input');
  const button = box.querySelector('#any-commander-button');
  const results = box.querySelector('#any-commander-results');
  const status = box.querySelector('#any-commander-status');
  const loadSynergyButton = box.querySelector('#load-synergy-button');

  async function fetchSearch(query, unique='prints') {
    const r = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=edhrec&unique=${unique}`);
    if (!r.ok) return [];
    const data = await r.json();
    return data.data || [];
  }

  async function enrichJapanese(cards) {
    const seen = new Set(), out = [];
    for (const card of cards) {
      const key = card.oracle_id || card.name;
      if (seen.has(key)) continue;
      seen.add(key);
      let best = card;
      if (!card.printed_name && card.oracle_id) {
        try {
          const jp = await fetchSearch(`oracleid:${card.oracle_id} lang:ja game:paper`);
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
      } else cards = await fetchSearch(`is:commander game:paper name:${JSON.stringify(q)}`);
      cards = await enrichJapanese(cards);
      if (!cards.length) { results.innerHTML=''; status.textContent='候補が見つかりませんでした。日本語名または英語名の一部で試してください。'; return; }
      results.innerHTML = cards.map((c,i) => {
        const jp = displayName(c), en = c.name || jp;
        return `<button type="button" class="any-result" data-i="${i}">${imgOf(c)?`<img src="${imgOf(c)}" loading="lazy" decoding="async" alt="${esc(jp)}">`:''}<span><strong>${esc(jp)}</strong>${jp!==en?`<small>${esc(en)}</small>`:''}<span class="identity-badges">${(c.color_identity?.length?c.color_identity:['C']).map(x=>`<span>${x}</span>`).join('')}</span></span><span class="any-result-meta"><span class="any-select-label">この統率者を選ぶ</span></span></button>`;
      }).join('');
      results.querySelectorAll('.any-result').forEach(el => el.addEventListener('click', () => chooseCommander(cards[Number(el.dataset.i)])));
      status.textContent = cards.length === 1 ? '1件見つかりました。カードをタップして選択してください。' : `${cards.length}件の候補があります。画像と名前を見比べて選択してください。`;
    } catch(e) { results.innerHTML=''; status.textContent='検索に失敗しました。通信状態を確認して再度お試しください。'; }
    finally { button.disabled = false; }
  }

  function identityQuery(identity) {
    if (!identity || !identity.length) return 'id:c';
    return `id<=${identity.join('')}`;
  }

  function detectTribe(card) {
    const text = oracleText(card);
    const known = ['goblin','dragon','vampire','zombie','elf','angel','demon','wizard','knight','sliver','merfolk','spirit','warrior','dinosaur','pirate','rogue','ninja','samurai','phyrexian','eldrazi','cat','soldier','cleric'];
    const hits = known.filter(t => text.includes(t));
    if (!hits.length) return null;
    const labels = hits.slice(0,3).map(t=>t.charAt(0).toUpperCase()+t.slice(1));
    return { key:'tribal', label:`部族：${labels.join(' / ')}`, score:8, query:`(${labels.map(t=>`t:${JSON.stringify(t)}`).join(' OR ')})`, fallback:`(${labels.map(t=>`oracle:${JSON.stringify(t)}`).join(' OR ')})`, reason:`統率者が${labels.join('・')}を直接参照するため` };
  }

  function detectThemes(card) {
    const text = oracleText(card), type = typeText(card), themes = [];
    const add = (key,label,score,re,query,fallback,reason) => {
      const hits = (text.match(re) || []).length + (type.match(re) || []).length;
      if (hits) themes.push({key,label,score:score+Math.min(hits,3),query,fallback,reason});
    };
    add('tokens','トークン',5,/\btoken\b|amass|populate|create .* creature/gi,'otag:token','(oracle:"create" oracle:"token")','トークン生成・トークン参照能力と噛み合うため');
    add('sacrifice','生け贄',6,/sacrific|dies|died/gi,'otag:sacrifice','(oracle:"sacrifice" OR oracle:"dies")','生け贄・死亡誘発を活かせるため');
    add('graveyard','墓地利用',6,/graveyard|mill|reanimate/gi,'otag:graveyard','(oracle:"graveyard" OR oracle:"mill")','墓地をリソースとして使う能力と噛み合うため');
    add('counters','カウンター',6,/\+1\/\+1 counter|counter on|counters on/gi,'otag:counter','(oracle:"counter on" OR oracle:"+1/+1 counter")','カウンターを置く・増やす能力を伸ばせるため');
    add('proliferate','増殖',9,/proliferate/gi,'otag:proliferate','oracle:"proliferate"','増殖を直接強化できるため');
    add('spells','呪文連打',6,/instant|sorcery|noncreature spell|whenever you cast|cast .* spell/gi,'otag:spellslinger','(oracle:"instant or sorcery" OR oracle:"whenever you cast")','呪文を唱える回数を価値に変えられるため');
    add('artifact','アーティファクト',6,/artifact/gi,'otag:artifact','(t:artifact OR oracle:"artifact")','アーティファクト参照能力と噛み合うため');
    add('enchantment','エンチャント',6,/enchantment|aura|enchanted/gi,'otag:enchant','(t:enchantment OR oracle:"enchantment")','エンチャントやオーラを参照するため');
    add('equipment','装備品',7,/equipment|equip |equipped/gi,'otag:equipment','(t:equipment OR oracle:"equipped")','装備品を活かす能力があるため');
    add('lifegain','ライフゲイン',6,/gain life|gained life|life total/gi,'otag:lifegain','oracle:"gain life"','ライフを得ることが利益に変わるため');
    add('lands','土地',6,/landfall|land enters|additional land|lands? you control/gi,'otag:land','(oracle:"landfall" OR oracle:"additional land" OR oracle:"land enters")','土地の展開・土地誘発を伸ばせるため');
    add('combat','戦闘・攻撃',5,/attacks|attacking|combat damage|beginning of combat/gi,'otag:combat','(oracle:"attacks" OR oracle:"combat damage")','攻撃や戦闘ダメージで能力が働くため');
    add('draw','ドロー活用',5,/whenever you draw|draw .* card|second card/gi,'otag:draw','oracle:"draw"','ドローそのものがシナジーになるため');
    add('discard','手札捨て',6,/discard|cycling|madness/gi,'otag:discard','oracle:"discard"','手札を捨てる行為を利益に変えられるため');
    add('treasure','宝物',7,/treasure/gi,'otag:treasure','oracle:"treasure"','宝物の生成・消費を直接活かせるため');
    add('blink','明滅・ETB',7,/exile .* return|enters the battlefield|enters under your control/gi,'otag:blink','(oracle:"exile" oracle:"return" OR oracle:"enters the battlefield")','戦場に出た時の能力を繰り返し使えるため');
    const tribe = detectTribe(card); if (tribe) themes.push(tribe);
    const unique = new Map();
    themes.sort((a,b)=>b.score-a.score).forEach(t=>{ if(!unique.has(t.key)) unique.set(t.key,t); });
    return [...unique.values()].slice(0,3);
  }

  function strategySpecsFor(mode) {
    if (mode === 'control') return [
      {label:'妨害',query:'otag:counterspell',fallback:'(oracle:"counter target" OR oracle:"return target")',reason:'妨害重視の方針を支えるため'},
      {label:'除去',query:'otag:removal',fallback:'(oracle:"destroy target" OR oracle:"exile target")',reason:'相手の重要カードへ触れるため'}
    ];
    if (mode === 'speed') return [
      {label:'高速展開',query:'otag:ramp mv<=2',fallback:'((oracle:"add {" OR t:artifact) mv<=2)',reason:'統率者やキーカードを早く展開するため'},
      {label:'コスト軽減',query:'otag:cost-reduction',fallback:'(oracle:"cost" oracle:"less")',reason:'展開速度を上げるため'}
    ];
    if (mode === 'combo') return [
      {label:'サーチ',query:'otag:tutor',fallback:'oracle:"search your library"',reason:'必要なコンボ部品へアクセスするため'},
      {label:'コンボ保護',query:'otag:protection',fallback:'(oracle:"counter target" OR oracle:"hexproof" OR oracle:"indestructible")',reason:'勝ち筋を妨害から守るため'}
    ];
    return [
      {label:'マナ加速',query:'otag:ramp mv<=3',fallback:'((oracle:"add {" OR t:artifact) mv<=3)',reason:'デッキ全体の展開を安定させるため'},
      {label:'カード補充',query:'otag:card-draw',fallback:'oracle:"draw"',reason:'息切れを防ぐため'}
    ];
  }

  async function fetchSpec(spec, identity, commanderName) {
    const prefix = `legal:commander game:paper ${identityQuery(identity)} -name:${JSON.stringify(commanderName)}`;
    for (const q of [spec.query,spec.fallback].filter(Boolean)) {
      try {
        let r = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(`${prefix} ${q} lang:ja`)}&order=edhrec&unique=cards`);
        if (!r.ok) r = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(`${prefix} ${q}`)}&order=edhrec&unique=cards`);
        if (!r.ok) continue;
        const data = await r.json();
        const cards = (data.data || []).slice(0,6);
        if (cards.length) return cards.map(card=>({card,role:spec.label,reason:spec.reason}));
      } catch(e) {}
    }
    return [];
  }

  function mergeCandidates(groups, limit=10) {
    const out = [], seen = new Set(); let genericCount = 0;
    const rounds = Math.max(0,...groups.map(g=>g.length));
    for (let i=0;i<rounds && out.length<limit;i++) {
      for (const group of groups) {
        const item = group[i]; if (!item) continue;
        const key = item.card.oracle_id || item.card.name;
        if (seen.has(key)) continue;
        const generic = genericStaples.has(String(item.card.name || '').toLowerCase());
        if (generic && genericCount >= 2) continue;
        seen.add(key); if (generic) genericCount++; out.push(item);
        if (out.length >= limit) break;
      }
    }
    return out;
  }

  function cardUsd(card) {
    const values = [card?.prices?.usd, card?.prices?.usd_foil].map(Number).filter(Number.isFinite);
    return values.length ? Math.min(...values) : null;
  }

  function budgetCardCapUsd() {
    if (budget.value === '5000') return 4;
    if (budget.value === '10000') return 8;
    if (budget.value === '30000') return 25;
    return Infinity;
  }

  function applyBudgetFilter(items, limit=10) {
    if (budget.value === 'open') return items.slice(0, limit);
    const cap = budgetCardCapUsd();
    const affordable = [], unknown = [];
    for (const item of items) {
      const price = cardUsd(item.card);
      if (price == null) unknown.push(item);
      else if (price <= cap) affordable.push(item);
    }
    return [...affordable, ...unknown].slice(0, limit);
  }

  function budgetFilterLabel() {
    if (budget.value === '5000') return '低価格カード中心';
    if (budget.value === '10000') return '中低価格カード中心';
    if (budget.value === '30000') return '中価格帯まで許容';
    return '価格制限なし';
  }

  const USD_TO_JPY = 150;

  function priceSummary(items) {
    const known = items.map(item=>cardUsd(item.card)).filter(v=>v != null);
    const unknown = items.length - known.length;
    const totalUsd = known.reduce((sum,v)=>sum+v,0);
    const totalJpy = Math.round(totalUsd * USD_TO_JPY);
    const budgetJpy = budget.value === 'open' ? null : Number(budget.value);
    const remaining = budgetJpy == null ? null : Math.max(0, budgetJpy - totalJpy);
    return { known:known.length, unknown, totalJpy, budgetJpy, remaining };
  }

  function priceSummaryLabel(items) {
    const p = priceSummary(items);
    const suffix = p.unknown ? `（価格不明 ${p.unknown}枚）` : '';
    return `約${p.totalJpy.toLocaleString('ja-JP')}円 ${suffix}`.trim();
  }

  function remainingBudgetLabel(items) {
    if (budget.value === 'open') return '上限なし';
    const p = priceSummary(items);
    return `約${p.remaining.toLocaleString('ja-JP')}円`;
  }

  function renderCommanderSummary(card) {
    const picked = displayName(card), identity = card.color_identity || [], colors = identity.length ? identity.join(' / ') : '無色';
    const budgetText = budget.value === 'open' ? '上限なし' : `${Number(budget.value).toLocaleString('ja-JP')}円前後`;
    const mode = strategy?.value || 'balanced';
    state.themes = detectThemes(card);
    const themeText = state.themes.length ? state.themes.map(t=>`<span>${esc(t.label)}</span>`).join('') : '<span>能力ベース</span>';
    summary.innerHTML = `<strong>${esc(picked)}</strong>${picked!==card.name?`<small>${esc(card.name)}</small>`:''}固有色：${esc(colors)} / 予算：${budgetText} / ブラケット ${esc(bracket.value)} / 方針：${esc(strategyNames[mode])}。<br><small>${esc(strategyDescriptions[mode])}</small><div class="theme-badges">${themeText}</div>`;
  }

  function chooseCommander(card) {
    state.dynamicCommander = card;
    if (![...select.options].some(o=>o.value===card.name)) {
      const o=document.createElement('option'); o.value=card.name; o.textContent=displayName(card); o.title=card.name; o.dataset.dynamic='1'; select.appendChild(o);
    }
    select.value = card.name; renderCommanderSummary(card); results.innerHTML=''; input.value='';
    grid.innerHTML = '<p class="builder-empty">統率者のテーマを判定しました。「相性カード候補を表示」で、その統率者専用の候補を取得します。</p>';
    state.suggestions=[]; loadSynergyButton.hidden=false; status.textContent=`${displayName(card)} を統率者に選択しました。`;
  }

  async function renderDynamic() {
    const c = state.dynamicCommander; if (!c || select.value !== c.name) return;
    loadSynergyButton.disabled=true; loadSynergyButton.textContent='統率者のテーマから候補を検討中…';
    grid.innerHTML='<div class="dynamic-loading">能力・テーマ・デッキ方針を照合しています…</div>';
    const identity=c.color_identity || [], mode=strategy?.value || 'balanced';
    try {
      const detected = detectThemes(c);
      const specs = [...detected.map(t=>({label:t.label,query:t.query,fallback:t.fallback,reason:t.reason})), ...strategySpecsFor(mode)];
      const groups=[];
      for (const spec of specs) { groups.push(await fetchSpec(spec,identity,c.name)); await new Promise(r=>setTimeout(r,110)); }
      state.suggestions=applyBudgetFilter(mergeCandidates(groups,24),10);
      if (!state.suggestions.length) { grid.innerHTML='<p class="builder-empty">テーマに合う候補を取得できませんでした。別の方針でも試してください。</p>'; return; }
      grid.innerHTML=state.suggestions.map(({card,role,reason})=>{
        const jp=displayName(card), en=card.name||jp, text=displayText(card);
        return `<article class="synergy-card"><div class="synergy-image">${imgOf(card)?`<a href="${esc(card.scryfall_uri)}" target="_blank" rel="noopener noreferrer"><img src="${imgOf(card)}" loading="lazy" decoding="async" alt="${esc(jp)}"></a>`:''}</div><div class="synergy-body"><span class="synergy-role">${esc(role)}</span><h3>${esc(jp)}</h3>${jp!==en?`<small>${esc(en)}</small>`:''}<p>${esc(text.slice(0,110))}${text.length>110?'…':''}</p><p class="synergy-reason"><strong>採用理由：</strong>${esc(reason)}</p></div></article>`;
      }).join('');
      const high=Number(bracket.value)>=4, lands=high?'34〜36':'36〜38', themeLabel=detected.map(t=>t.label).join(' / ') || '能力ベース';
      if (plan) plan.innerHTML=[['検出テーマ',themeLabel],['方針',strategyNames[mode]],['土地',lands],['予算フィルター',budgetFilterLabel()],['候補10枚の概算',priceSummaryLabel(state.suggestions)],['予算残額',remainingBudgetLabel(state.suggestions)],['候補構成','テーマ優先＋方針補助 / 汎用定番は最大2枚']].map(([k,v])=>`<div><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join('');
      status.textContent=`${displayName(c)} 専用のテーマ候補を表示しました。価格はScryfallのUSD価格を1ドル=${USD_TO_JPY}円で参考換算しています。`;
    } finally { loadSynergyButton.disabled=false; loadSynergyButton.textContent='相性カード候補を再検討'; }
  }

  button.addEventListener('click',searchCommanders);
  loadSynergyButton.addEventListener('click',renderDynamic);
  input.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();searchCommanders();} });
  select.addEventListener('change',()=>{ if(state.dynamicCommander && select.value===state.dynamicCommander.name) chooseCommander(state.dynamicCommander); });
  budget.addEventListener('change',()=>{ if(state.dynamicCommander) renderCommanderSummary(state.dynamicCommander); });
  bracket.addEventListener('change',()=>{ if(state.dynamicCommander) renderCommanderSummary(state.dynamicCommander); });
  strategy?.addEventListener('change',()=>{ if(state.dynamicCommander){ renderCommanderSummary(state.dynamicCommander); grid.innerHTML='<p class="builder-empty">方針を変更しました。「相性カード候補を再検討」を押すと候補を組み直します。</p>'; loadSynergyButton.textContent='相性カード候補を再検討'; } });
})();