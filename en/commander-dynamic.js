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
  const displayName = c => c?.name || 'Unknown card';
  const displayText = c => c?.oracle_text || c?.card_faces?.map(f=>f.oracle_text || '').join(' // ') || '';
  const oracleText = c => [c?.oracle_text, ...(c?.card_faces || []).map(f=>f.oracle_text)].filter(Boolean).join(' ').toLowerCase();
  const typeText = c => [c?.type_line, ...(c?.card_faces || []).map(f=>f.type_line)].filter(Boolean).join(' ').toLowerCase();

  const strategyNames = { balanced:'Balanced', control:'Interaction', speed:'Speed', combo:'Combos' };
  const initialParams=new URLSearchParams(location.search);
const strategyDescriptions = {
    balanced:'Support the commander theme with ramp and card draw.',
    control:'Keep the commander theme while emphasizing interaction, removal and protection.',
    speed:'Prioritize low-cost ramp and setup to reach your game plan sooner.',
    combo:'Prioritize tutors, card draw, protection and combo pieces that fit the theme.'
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
    .dynamic-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.theme-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.theme-badges span{padding:4px 8px;border-radius:999px;background:#eef3f7;font-size:.72rem;font-weight:800}.synergy-reason{margin-top:7px!important;padding-top:7px;border-top:1px dashed var(--line);font-size:.74rem!important}.synergy-alt{margin:8px 0;padding:8px;border:1px solid var(--line);border-radius:7px;background:#f8fafb;font-size:.75rem}.synergy-alt strong,.synergy-alt a,.synergy-alt span,.synergy-alt small{display:block}.synergy-alt a{font-weight:800;margin:3px 0}.synergy-alt small{color:var(--muted);margin-top:2px}
    .commander-goals{margin:18px 0;padding:18px;border:1px solid var(--line);border-radius:10px;background:#fff}.commander-goals h3{margin:0 0 5px}.commander-goal-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}.commander-goal{min-height:74px;padding:12px;border:1px solid var(--line);border-radius:9px;background:#f8fafb;text-align:left;cursor:pointer;font:inherit}.commander-goal strong{display:block;margin-bottom:4px}.commander-goal small{color:var(--muted);line-height:1.35}.commander-goal.is-active{border-color:#80501f;box-shadow:0 0 0 2px #80501f18;background:#fffaf4}
    @media(max-width:900px){.any-results{grid-template-columns:repeat(2,1fr)}.commander-goal-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.any-search-row{grid-template-columns:1fr}.any-results{grid-template-columns:repeat(2,minmax(0,1fr))}.commander-goal-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const controls = select.closest('.commander-builder-controls');
  const box = document.createElement('section');
  box.className = 'any-commander';
  box.innerHTML = `
    <span class="section-kicker">COMMANDER SEARCH</span>
    <h3>Search for a commander</h3>
    <p>Find candidates that fit the themes in your commander’s abilities.</p>
    <div class="any-search-row"><input id="any-commander-input" type="search" aria-label="Search commanders" placeholder="Example: Atraxa / Cloud"><button id="any-commander-button" class="button primary" type="button">Search</button></div>
    <div id="any-commander-results" class="any-results"></div>
    <div id="any-commander-status" class="dynamic-note" role="status" aria-live="polite"></div>
    <div class="dynamic-actions"><button id="load-synergy-button" class="button secondary" type="button" hidden>Show synergy candidates</button></div>`;
  controls.before(box);

  const goalBox = document.createElement('section');
  goalBox.className = 'commander-goals';
  goalBox.innerHTML = `
    <span class="section-kicker">YOUR GAME PLAN</span>
    <h3>Choose how you want the deck to play</h3>
    <p class="dynamic-note">Choose a plan to change candidate priorities while retaining the commander’s themes.</p>
    <div class="commander-goal-grid">
      <button type="button" class="commander-goal" data-strategy="balanced"><strong>Build a balanced deck</strong><small>Support the theme, ramp and card draw</small></button>
      <button type="button" class="commander-goal" data-strategy="control"><strong>Focus on interaction</strong><small>Emphasize removal, counters and protection</small></button>
      <button type="button" class="commander-goal" data-strategy="speed"><strong>Speed up the deck</strong><small>Prioritize efficient ramp and cost reduction</small></button>
      <button type="button" class="commander-goal" data-strategy="combo"><strong>Build toward combos</strong><small>Prioritize tutors, protection and combo pieces</small></button>
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
    try {
      const data = await window.MAGSTAEnglishTools.json(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=edhrec&unique=${unique}`);
      return data.data || [];
    } catch(error) { if(error.status===404)return []; throw error; }
  }

  async function enrichJapanese(cards) {
    const seen=new Set();return cards.filter(card=>{const key=card.oracle_id||card.name;if(seen.has(key))return false;seen.add(key);return true;}).slice(0,8);
  }

  async function searchCommanders() {
    const q = input.value.trim();
    if (q.length < 2) { status.textContent = 'Enter at least two characters.'; return; }
    button.disabled = true; results.innerHTML = '<div class="dynamic-loading">Searching…</div>'; status.textContent = '';
    try {
      let cards = [];
      cards = await fetchSearch(`is:commander game:paper lang:en name:${JSON.stringify(q)}`);
      cards = await enrichJapanese(cards);
      if (!cards.length) { results.innerHTML=''; status.textContent='No candidates found. Try part of an English card name.'; return; }
      results.innerHTML = cards.map((c,i) => {
        const jp = displayName(c), en = c.name || jp;
        return `<button type="button" class="any-result" data-i="${i}">${imgOf(c)?`<img src="${imgOf(c)}" loading="lazy" decoding="async" alt="${esc(jp)}">`:''}<span><strong>${esc(jp)}</strong>${jp!==en?`<small>${esc(en)}</small>`:''}<span class="identity-badges">${(c.color_identity?.length?c.color_identity:['C']).map(x=>`<span>${x}</span>`).join('')}</span></span><span class="any-result-meta"><span class="any-select-label">Choose this commander</span></span></button>`;
      }).join('');
      results.querySelectorAll('.any-result').forEach(el => el.addEventListener('click', () => chooseCommander(cards[Number(el.dataset.i)])));
      status.textContent = cards.length === 1 ? 'One candidate found. Select the card to continue.' : `${cards.length} candidates found. Compare the images and names to choose one.`;
    } catch(e) { results.innerHTML=''; status.textContent='Search failed. Check your connection and try again.'; }
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
    return { key:'tribal', label:`Tribal: ${labels.join(' / ')}`, score:8, query:`(${labels.map(t=>`t:${JSON.stringify(t)}`).join(' OR ')})`, fallback:`(${labels.map(t=>`oracle:${JSON.stringify(t)}`).join(' OR ')})`, reason:`The commander directly references ${labels.join(', ')}` };
  }

  function detectThemes(card) {
    const text = oracleText(card), type = typeText(card), themes = [];
    const add = (key,label,score,re,query,fallback,reason) => {
      const hits = (text.match(re) || []).length + (type.match(re) || []).length;
      if (hits) themes.push({key,label,score:score+Math.min(hits,3),query,fallback,reason});
    };
    add('tokens','Tokens',5,/\btoken\b|amass|populate|create .* creature/gi,'otag:token','(oracle:"create" oracle:"token")','Supports token creation and token-related abilities');
    add('sacrifice','Sacrifice',6,/sacrific|dies|died/gi,'otag:sacrifice','(oracle:"sacrifice" OR oracle:"dies")','Supports sacrifice and death triggers');
    add('graveyard','Graveyard',6,/graveyard|mill|reanimate/gi,'otag:graveyard','(oracle:"graveyard" OR oracle:"mill")','Supports using the graveyard as a resource');
    add('counters','Counters',6,/\+1\/\+1 counter|counter on|counters on/gi,'otag:counter','(oracle:"counter on" OR oracle:"+1/+1 counter")','Supports placing and increasing counters');
    add('proliferate','Proliferate',9,/proliferate/gi,'otag:proliferate','oracle:"proliferate"','Supports proliferate');
    add('spells','Spellslinger',6,/instant|sorcery|noncreature spell|whenever you cast|cast .* spell/gi,'otag:spellslinger','(oracle:"instant or sorcery" OR oracle:"whenever you cast")','Turns repeated spellcasting into value');
    add('artifact','Artifacts',6,/artifact/gi,'otag:artifact','(t:artifact OR oracle:"artifact")','Supports artifact-related abilities');
    add('enchantment','Enchantments',6,/enchantment|aura|enchanted/gi,'otag:enchant','(t:enchantment OR oracle:"enchantment")','Supports enchantments and Auras');
    add('equipment','Equipment',7,/equipment|equip |equipped/gi,'otag:equipment','(t:equipment OR oracle:"equipped")','Supports Equipment-related abilities');
    add('lifegain','Lifegain',6,/gain life|gained life|life total/gi,'otag:lifegain','oracle:"gain life"','Turns gaining life into value');
    add('lands','Lands',6,/landfall|land enters|additional land|lands? you control/gi,'otag:land','(oracle:"landfall" OR oracle:"additional land" OR oracle:"land enters")','Supports land development and land triggers');
    add('combat','Combat',5,/attacks|attacking|combat damage|beginning of combat/gi,'otag:combat','(oracle:"attacks" OR oracle:"combat damage")','Supports attack and combat-damage triggers');
    add('draw','Card draw',5,/whenever you draw|draw .* card|second card/gi,'otag:draw','oracle:"draw"','Supports card-draw synergies');
    add('discard','Discard',6,/discard|cycling|madness/gi,'otag:discard','oracle:"discard"','Turns discarding into value');
    add('treasure','Treasure',7,/treasure/gi,'otag:treasure','oracle:"treasure"','Supports creating and spending Treasures');
    add('blink','Blink / ETB',7,/exile .* return|enters the battlefield|enters under your control/gi,'otag:blink','(oracle:"exile" oracle:"return" OR oracle:"enters the battlefield")','Supports reusing enter-the-battlefield abilities');
    const tribe = detectTribe(card); if (tribe) themes.push(tribe);
    const unique = new Map();
    themes.sort((a,b)=>b.score-a.score).forEach(t=>{ if(!unique.has(t.key)) unique.set(t.key,t); });
    return [...unique.values()].slice(0,3);
  }

  function strategySpecsFor(mode) {
    if (mode === 'control') return [
      {label:'Interaction',query:'otag:counterspell',fallback:'(oracle:"counter target" OR oracle:"return target")',reason:'Supports an interaction-focused plan'},
      {label:'Removal',query:'otag:removal',fallback:'(oracle:"destroy target" OR oracle:"exile target")',reason:'Answers opponents’ important cards'}
    ];
    if (mode === 'speed') return [
      {label:'Fast development',query:'otag:ramp mv<=2',fallback:'((oracle:"add {" OR t:artifact) mv<=2)',reason:'Helps deploy the commander and key cards sooner'},
      {label:'Cost reduction',query:'otag:cost-reduction',fallback:'(oracle:"cost" oracle:"less")',reason:'Improves development speed'}
    ];
    if (mode === 'combo') return [
      {label:'Tutors',query:'otag:tutor',fallback:'oracle:"search your library"',reason:'Helps find required combo pieces'},
      {label:'Combo protection',query:'otag:protection',fallback:'(oracle:"counter target" OR oracle:"hexproof" OR oracle:"indestructible")',reason:'Protects the win condition from interaction'}
    ];
    return [
      {label:'Ramp',query:'otag:ramp mv<=3',fallback:'((oracle:"add {" OR t:artifact) mv<=3)',reason:'Supports consistent development'},
      {label:'Card draw',query:'otag:card-draw',fallback:'oracle:"draw"',reason:'Helps avoid running out of cards'}
    ];
  }

  async function fetchSpec(spec, identity, commanderName) {
    const prefix = `legal:commander game:paper ${identityQuery(identity)} -name:${JSON.stringify(commanderName)}`;
    for (const q of [spec.query,spec.fallback].filter(Boolean)) {
      try {
        const data = await window.MAGSTAEnglishTools.json(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(`${prefix} ${q} lang:en`)}&order=edhrec&unique=cards`);
        const cards = (data.data || []).slice(0,12);
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

  function findBudgetAlternative(item, groups) {
    if (budget.value === 'open') return null;
    const price = cardUsd(item.card), cap = budgetCardCapUsd();
    if (price == null || price <= cap) return null;
    const pool = groups.flat().filter(x => x.role === item.role && (x.card.oracle_id || x.card.name) !== (item.card.oracle_id || item.card.name));
    const cheaper = pool
      .map(x=>({ ...x, usd:cardUsd(x.card) }))
      .filter(x=>x.usd != null && x.usd <= cap)
      .sort((a,b)=>a.usd-b.usd);
    return cheaper[0] || null;
  }

  function cardUsd(card) {
    const values = [card?.prices?.usd, card?.prices?.usd_foil].map(Number).filter(Number.isFinite);
    return values.length ? Math.min(...values) : null;
  }

  function budgetCardCapUsd() {
    if (budget.value === '50') return 4;
    if (budget.value === '100') return 8;
    if (budget.value === '300') return 25;
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
    if (budget.value === '50') return 'Mostly cards around $4 or less';
    if (budget.value === '100') return 'Mostly cards around $8 or less';
    if (budget.value === '300') return 'Mostly cards around $25 or less';
    return 'No price cap';
  }

  function priceSummary(items) {
    const known = items.map(item=>cardUsd(item.card)).filter(v=>v != null);
    const unknown = items.length - known.length;
    const totalUsd = known.reduce((sum,v)=>sum+v,0);
    const budgetUsd = budget.value === 'open' ? null : Number(budget.value);
    const remaining = budgetUsd == null ? null : Math.max(0, budgetUsd - totalUsd);
    return { known:known.length, unknown, totalUsd, budgetUsd, remaining };
  }

  function priceSummaryLabel(items) {
    const p = priceSummary(items);
    const suffix = p.unknown ? ` (${p.unknown} without price data)` : '';
    return `About ${p.totalUsd.toFixed(2)}${suffix}`;
  }

  function remainingBudgetLabel(items) {
    if (budget.value === 'open') return 'No limit';
    const p = priceSummary(items);
    return `About ${p.remaining.toFixed(2)}`;
  }

  function renderCommanderSummary(card) {
    const picked = displayName(card), identity = card.color_identity || [], colors = identity.length ? identity.join(' / ') : 'Colorless';
    const budgetText = budget.value === 'open' ? 'No limit' : `About ${Number(budget.value).toLocaleString('en-US')}`;
    const mode = strategy?.value || 'balanced';
    state.themes = detectThemes(card);
    const themeText = state.themes.length ? state.themes.map(t=>`<span>${esc(t.label)}</span>`).join('') : '<span>Ability-based</span>';
    summary.innerHTML = `<strong>${esc(picked)}</strong>${picked!==card.name?`<small>${esc(card.name)}</small>`:''}Color identity: ${esc(colors)} / Budget guidance: ${budgetText} / Bracket ${esc(bracket.value)} / Strategy: ${esc(strategyNames[mode])}.<br><small>${esc(strategyDescriptions[mode])}</small><div class="theme-badges">${themeText}</div>`;
  }

  function chooseCommander(card) {
    state.dynamicCommander = card;
    if (![...select.options].some(o=>o.value===card.name)) {
      const o=document.createElement('option'); o.value=card.name; o.textContent=displayName(card); o.title=card.name; o.dataset.dynamic='1'; select.appendChild(o);
    }
    select.value = card.name; renderCommanderSummary(card); results.innerHTML=''; input.value='';
    grid.innerHTML = '<p class="builder-empty">Themes detected. Select Show synergy candidates to fetch cards for this commander.</p>';
    state.suggestions=[]; loadSynergyButton.hidden=false; status.textContent=`${displayName(card)} selected as your commander.`;
  }

  async function renderDynamic() {
    const c = state.dynamicCommander; if (!c || select.value !== c.name) return;
    loadSynergyButton.disabled=true; loadSynergyButton.textContent='Finding theme candidates…';
    grid.innerHTML='<div class="dynamic-loading">Matching abilities, themes and strategy…</div>';
    const identity=c.color_identity || [], mode=strategy?.value || 'balanced';
    try {
      const detected = detectThemes(c);
      const specs = [...detected.map(t=>({label:t.label,query:t.query,fallback:t.fallback,reason:t.reason})), ...strategySpecsFor(mode)];
      const groups=[];
      for (const spec of specs) { groups.push(await fetchSpec(spec,identity,c.name)); await new Promise(r=>setTimeout(r,110)); }
      state.suggestions=mergeCandidates(groups,10); state.suggestions.forEach(item=>item.alternative=findBudgetAlternative(item,groups)); state.suggestions=applyBudgetFilter(state.suggestions,10);
      if (!state.suggestions.length) { grid.innerHTML='<p class="builder-empty">No matching candidates found. Try another strategy.</p>'; return; }
      grid.innerHTML=state.suggestions.map(({card,role,reason})=>{
        const jp=displayName(card), en=card.name||jp, text=displayText(card), usd=cardUsd(card);
        const price=usd==null?'Price unavailable':`About ${usd.toFixed(2)}`;
        return `<article class="synergy-card"><div class="synergy-image">${imgOf(card)?`<a href="${esc(card.scryfall_uri)}" target="_blank" rel="noopener noreferrer"><img src="${imgOf(card)}" loading="lazy" decoding="async" alt="${esc(jp)}"></a>`:''}</div><div class="synergy-body"><span class="synergy-role">${esc(role)}</span><h3>${esc(jp)}</h3>${jp!==en?`<small>${esc(en)}</small>`:''}<p class="synergy-price"><strong>Reference price: </strong>${esc(price)}</p><p>${esc(text.slice(0,110))}${text.length>110?'…':''}</p><p class="synergy-reason"><strong>Why it fits: </strong>${esc(reason)}</p></div></article>`;
      }).join('');
      const high=Number(bracket.value)>=4, lands=high?'34–36':'36–38', themeLabel=detected.map(t=>t.label).join(' / ') || 'Ability-based';
      if (plan) plan.innerHTML=[['Detected themes',themeLabel],['Strategy',strategyNames[mode]],['Lands',lands],['Budget filter',budgetFilterLabel()],['Estimated cost of 10 candidates',priceSummaryLabel(state.suggestions)],['Budget remaining',remainingBudgetLabel(state.suggestions)],['Candidate mix','Theme first, then strategy support / up to 2 generic staples']].map(([k,v])=>`<div><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join('');
      status.textContent=`Showing theme candidates for ${displayName(c)}.`;
    } catch(e) { grid.innerHTML='<p class="builder-empty">Unable to load candidates. Check your connection and try again.</p>'; } finally { loadSynergyButton.disabled=false; loadSynergyButton.textContent='Refresh synergy candidates'; }
  }

  button.addEventListener('click',searchCommanders);
  loadSynergyButton.addEventListener('click',renderDynamic);
  input.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();searchCommanders();} });
  select.addEventListener('change',()=>{ if(state.dynamicCommander && select.value===state.dynamicCommander.name) chooseCommander(state.dynamicCommander); });
  budget.addEventListener('change',()=>{ if(state.dynamicCommander) renderCommanderSummary(state.dynamicCommander); });
  bracket.addEventListener('change',()=>{ if(state.dynamicCommander) renderCommanderSummary(state.dynamicCommander); });
  strategy?.addEventListener('change',()=>{ if(state.dynamicCommander){ renderCommanderSummary(state.dynamicCommander); grid.innerHTML='<p class="builder-empty">Strategy changed. Select Refresh synergy candidates to rebuild the suggestions.</p>'; loadSynergyButton.textContent='Refresh synergy candidates'; } });
})();