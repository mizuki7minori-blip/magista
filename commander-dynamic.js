(() => {
  const select = document.getElementById('commander-select');
  const budget = document.getElementById('budget-select');
  const bracket = document.getElementById('bracket-select');
  const strategy = document.getElementById('strategy-select');
  const summary = document.getElementById('builder-summary');
  const grid = document.getElementById('synergy-grid');
  const plan = document.getElementById('budget-plan');
  if (!select || !summary || !grid) return;

  const state = { dynamicCommander: null, suggestions: [], themes: [], draftDeck: [], lands: [], domesticPrices: {}, domesticPriceMeta: {} };
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
    .dynamic-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.theme-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.theme-badges span{padding:4px 8px;border-radius:999px;background:#eef3f7;font-size:.72rem;font-weight:800}.synergy-reason{margin-top:7px!important;padding-top:7px;border-top:1px dashed var(--line);font-size:.74rem!important}.synergy-alt{margin:8px 0;padding:8px;border:1px solid var(--line);border-radius:7px;background:#f8fafb;font-size:.75rem}.synergy-alt strong,.synergy-alt a,.synergy-alt span,.synergy-alt small{display:block}.synergy-alt a{font-weight:800;margin:3px 0}.synergy-alt small{color:var(--muted);margin-top:2px}.synergy-alt .synergy-swap{margin-top:8px;width:100%;font-size:.75rem;padding:7px 9px}.synergy-save{margin-top:8px;width:100%;font-size:.75rem;padding:7px 9px}.wisdom-price-link{display:inline-block;margin-top:4px;font-size:.74rem;font-weight:800}.draft-deck{margin:22px 0;padding:18px;border:1px solid var(--line);border-radius:10px;background:#fff}.draft-deck-head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}.draft-deck-list{display:grid;gap:8px;margin-top:12px}.draft-deck-row{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:8px}.draft-deck-row small{color:var(--muted)}.draft-deck-empty{color:var(--muted);margin-top:10px}.draft-deck-actions{display:flex;gap:8px;flex-wrap:wrap}.draft-export{margin-top:16px;padding:14px;border:1px solid var(--line);border-radius:9px;background:#fff}.draft-export-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}.draft-export-group{padding:10px;border:1px solid var(--line);border-radius:8px;background:#f8fafb}.draft-export-group h4{margin:0 0 6px}.draft-export-group ul{margin:0;padding-left:18px}.draft-copy-status{margin-top:8px;color:var(--muted);font-size:.78rem}@media(max-width:700px){.draft-export-grid{grid-template-columns:1fr}}.draft-diagnosis{margin-top:14px;padding:14px;border:1px solid var(--line);border-radius:9px;background:#f8fafb}.draft-diagnosis-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}.deck-score{margin:0 0 14px;padding:14px;border:1px solid var(--line);border-radius:10px;background:#fff}.deck-score-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.deck-score-value{font-size:1.6rem;font-weight:900}.deck-score-bar{height:10px;border-radius:999px;background:#e8edf2;overflow:hidden;margin:10px 0}.deck-score-bar span{display:block;height:100%;background:currentColor}.deck-score-notes{margin:8px 0 0;padding-left:18px;font-size:.8rem;color:var(--muted)}.draft-diagnosis-item{padding:10px;border:1px solid var(--line);border-radius:8px;background:#fff}.draft-diagnosis-item strong,.draft-diagnosis-item span{display:block}.draft-diagnosis-item small{display:block;color:var(--muted);margin-top:3px}.draft-role-btn{margin-top:8px;width:100%;font-size:.72rem;padding:6px 8px}.role-search-results{margin-top:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.role-search-card{padding:10px;border:1px solid var(--line);border-radius:8px;background:#fff}.role-search-card img{width:100%;aspect-ratio:488/680;object-fit:cover;border-radius:6px;background:#eef1f4}.role-search-card h4{margin:7px 0 4px;font-size:.9rem}.role-search-card small{display:block;color:var(--muted)}@media(max-width:700px){.role-search-results{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.draft-diagnosis-grid{grid-template-columns:repeat(2,1fr)}}
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

  loadDomesticPrices();

  const input = box.querySelector('#any-commander-input');
  const button = box.querySelector('#any-commander-button');
  const results = box.querySelector('#any-commander-results');
  const status = box.querySelector('#any-commander-status');
  const loadSynergyButton = box.querySelector('#load-synergy-button');

  button.addEventListener('click',searchCommanders);
  input.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();searchCommanders();} });


  const draftDeckBox = document.createElement('section');
  draftDeckBox.className = 'draft-deck';
  draftDeckBox.innerHTML = `
    <div class="draft-deck-head"><div><span class="section-kicker">仮デッキリスト</span><h3>保存した候補カード</h3></div><div class="draft-deck-actions"><button type="button" id="draft-add-all" class="button secondary">候補10枚を追加</button><button type="button" id="draft-auto-build" class="button primary">99枚たたき台を自動補充</button><button type="button" id="draft-clear" class="button secondary">クリア</button></div></div>
    <div id="draft-deck-summary" class="dynamic-note"></div>
    <div id="draft-deck-list" class="draft-deck-list"></div><div id="draft-export" class="draft-export"><div class="draft-deck-head"><strong>カテゴリ別デッキリスト</strong><div class="draft-deck-actions"><button type="button" id="draft-copy" class="button secondary">デッキリストをコピー</button><button type="button" id="draft-copy-import" class="button secondary">Moxfield / Archidekt用コピー</button></div></div><div id="draft-export-grid" class="draft-export-grid"></div><div id="draft-copy-status" class="draft-copy-status"></div></div><div id="draft-diagnosis" class="draft-diagnosis"></div>`;
  const commanderMain = controls.closest('.commander-page') || controls.closest('main') || document.querySelector('main');
  if (commanderMain) commanderMain.appendChild(draftDeckBox); else controls.after(draftDeckBox);
  const affiliateBox = document.getElementById('commander-affiliate-products');
  if (commanderMain && affiliateBox) commanderMain.appendChild(affiliateBox);
  const draftList = draftDeckBox.querySelector('#draft-deck-list');
  const draftSummary = draftDeckBox.querySelector('#draft-deck-summary');
  const draftAddAll = draftDeckBox.querySelector('#draft-add-all');
  const draftAutoBuild = draftDeckBox.querySelector('#draft-auto-build');
  const draftClear = draftDeckBox.querySelector('#draft-clear');
  const draftDiagnosis = draftDeckBox.querySelector('#draft-diagnosis');
  const draftExportGrid = draftDeckBox.querySelector('#draft-export-grid');
  const draftCopy = draftDeckBox.querySelector('#draft-copy');
  const draftCopyImport = draftDeckBox.querySelector('#draft-copy-import');
  const draftCopyStatus = draftDeckBox.querySelector('#draft-copy-status');
  const DRAFT_KEY = 'magsta-commander-draft-ja';

  function loadDraftDeck(){
    try { const saved=JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'); state.draftDeck=Array.isArray(saved)?saved:(saved.cards||[]); state.lands=Array.isArray(saved)?[]:(saved.lands||[]); }
    catch(e){ state.draftDeck = []; }
    renderDraftDeck();
  }
  function saveDraftDeck(){ localStorage.setItem(DRAFT_KEY, JSON.stringify({cards:state.draftDeck,lands:state.lands||[]})); renderDraftDeck(); }
  function addDraftCard(item){
    const key=item.card.oracle_id||item.card.name;
    if(state.draftDeck.some(x=>x.key===key)) return;
    const ref=domesticPriceInfo(item.card); state.draftDeck.push({key,name:displayName(item.card),role:item.role,usd:cardUsd(item.card),jpy:ref.jpy,priceSource:ref.source});
    saveDraftDeck();
  }
  function roleBucket(role){
    const s=String(role||'');
    if(/マナ加速|高速展開|コスト軽減|Ramp/i.test(s)) return 'ramp';
    if(/カード補充|ドロー|Card draw/i.test(s)) return 'draw';
    if(/除去|妨害|Interaction|Removal/i.test(s)) return 'interaction';
    if(/保護|Protection/i.test(s)) return 'protection';
    if(/墓地|Graveyard/i.test(s)) return 'graveyard';
    if(/サーチ|Tutors/i.test(s)) return 'tutor';
    return 'theme';
  }


  function roleSearchSpec(key){
    const map={
      ramp:{label:'マナ加速',query:'otag:ramp mv<=3',fallback:'((oracle:"add {" OR t:artifact) mv<=3)',reason:'不足しているマナ加速枠を補うため'},
      draw:{label:'カード補充',query:'otag:card-draw',fallback:'oracle:"draw"',reason:'不足しているドロー枠を補うため'},
      interaction:{label:'除去・妨害',query:'(otag:removal OR otag:counterspell)',fallback:'(oracle:"destroy target" OR oracle:"exile target" OR oracle:"counter target")',reason:'不足している除去・妨害枠を補うため'},
      protection:{label:'保護',query:'otag:protection',fallback:'(oracle:"hexproof" OR oracle:"indestructible")',reason:'不足している保護枠を補うため'},
      graveyard:{label:'墓地対策',query:'otag:graveyard-hate',fallback:'(oracle:"exile" oracle:"graveyard")',reason:'不足している墓地対策枠を補うため'},
      tutor:{label:'サーチ',query:'otag:tutor',fallback:'oracle:"search your library"',reason:'不足しているサーチ枠を補うため'}
    };
    return map[key]||null;
  }

  async function searchRoleCandidates(key){
    if(!state.dynamicCommander){ status.textContent='先に統率者を選択してください。'; return; }
    const spec=roleSearchSpec(key); if(!spec) return;
    const identity=state.dynamicCommander.color_identity||[];
    draftDiagnosis.insertAdjacentHTML('beforeend','<div id="role-search-results" class="role-search-results"><div class="dynamic-loading">候補を検索中…</div></div>');
    const wrap=draftDiagnosis.querySelector('#role-search-results');
    const found=await fetchSpec(spec,identity,state.dynamicCommander.name);
    const seen=new Set(state.draftDeck.map(x=>x.key));
    const cap=budgetCardCapUsd();
    const filtered=found.filter(x=>!seen.has(x.card.oracle_id||x.card.name)).sort((a,b)=>{
      const pa=cardUsd(a.card), pb=cardUsd(b.card);
      const aa=pa!=null&&pa<=cap?0:1, bb=pb!=null&&pb<=cap?0:1;
      return aa-bb || (pa??9999)-(pb??9999);
    }).slice(0,6);
    wrap.innerHTML=filtered.length?filtered.map((item,i)=>{
      const card=item.card, usd=cardUsd(card), price=usd==null?'価格不明':'約'+Math.round(usd*USD_TO_JPY).toLocaleString('ja-JP')+'円';
      return `<article class="role-search-card">${imgOf(card)?`<img src="${imgOf(card)}" loading="lazy" decoding="async" alt="${esc(displayName(card))}">`:''}<h4>${esc(displayName(card))}</h4><small>${esc(price)}</small><button type="button" class="button secondary role-add" data-i="${i}">仮デッキに追加</button></article>`;
    }).join(''):'<p class="draft-deck-empty">候補を取得できませんでした。</p>';
    wrap.querySelectorAll('.role-add').forEach(btn=>btn.addEventListener('click',()=>{
      const item=filtered[Number(btn.dataset.i)]; if(!item) return;
      addDraftCard(item); status.textContent=`${displayName(item.card)} を仮デッキに追加しました。`;
    }));
  }

  function deckScoreData(){
    const high=Number(bracket?.value)>=4;
    const targets={ramp:high?12:10,draw:high?12:10,interaction:high?12:10,protection:high?6:5,graveyard:3,tutor:high?5:2};
    const counts={ramp:0,draw:0,interaction:0,protection:0,graveyard:0,tutor:0,theme:0};
    state.draftDeck.forEach(x=>counts[roleBucket(x.role)]++);
    const landTarget=high?35:37, landCount=state.lands?.length||0;
    const roleKeys=['ramp','draw','interaction','protection','graveyard','tutor'];
    const roleScore=roleKeys.reduce((sum,key)=>sum+Math.min(1,(counts[key]||0)/targets[key]),0)/roleKeys.length*70;
    const landScore=Math.max(0,1-Math.abs(landCount-landTarget)/8)*15;
    const total=1+state.draftDeck.length+landCount;
    const totalScore=Math.max(0,1-Math.abs(total-100)/12)*15;
    const score=Math.max(0,Math.min(100,Math.round(roleScore+landScore+totalScore)));
    const notes=[];
    const labels={ramp:'マナ加速',draw:'ドロー',interaction:'除去・妨害',protection:'保護',graveyard:'墓地対策',tutor:'サーチ'};
    roleKeys.forEach(key=>{const need=Math.max(0,targets[key]-(counts[key]||0));if(need)notes.push(`${labels[key]}をあと${need}枚ほど追加すると安定します。`);});
    if(landCount<landTarget) notes.push(`土地をあと${landTarget-landCount}枚ほど追加するのが目安です。`);
    if(landCount>landTarget+2) notes.push(`土地がやや多めです。${landCount-landTarget}枚ほど減らす余地があります。`);
    if(total!==100) notes.push(`現在${total}枚です。100枚になるよう調整してください。`);
    if(!notes.length) notes.push('主要カテゴリと枚数バランスは良好です。あとはテーマ枠とマナカーブを微調整してください。');
    return {score,notes};
  }

  function renderDraftDiagnosis(){
    if(!draftDiagnosis) return;
    const counts={ramp:0,draw:0,interaction:0,protection:0,graveyard:0,tutor:0,theme:0};
    state.draftDeck.forEach(x=>counts[roleBucket(x.role)]++);
    const high=Number(bracket?.value)>=4;
    const targets={
      ramp:high?12:10,
      draw:high?12:10,
      interaction:high?12:10,
      protection:high?6:5,
      graveyard:3,
      tutor:high?5:2
    };
    const rows=[
      ['マナ加速','ramp'],['ドロー','draw'],['除去・妨害','interaction'],
      ['保護','protection'],['墓地対策','graveyard'],['サーチ','tutor']
    ];
    const totalSaved=state.draftDeck.length;
    const recommendedLands=high?35:37;
    const targetNonlands=99-recommendedLands;
    const stillNeeded=Math.max(0,targetNonlands-totalSaved);
    const scoreData=deckScoreData();
    draftDiagnosis.innerHTML=`<div class="deck-score"><div class="deck-score-head"><strong>デッキ診断スコア</strong><span class="deck-score-value">${scoreData.score}/100</span></div><div class="deck-score-bar"><span style="width:${scoreData.score}%"></span></div><ul class="deck-score-notes">${scoreData.notes.slice(0,4).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><strong>99枚構築の不足診断</strong><small>目安：土地 ${recommendedLands}枚 / 非土地 ${targetNonlands}枚</small><div class="draft-diagnosis-grid">${rows.map(([label,key])=>{const have=counts[key]||0, need=Math.max(0,targets[key]-have);return `<div class="draft-diagnosis-item"><strong>${label}</strong><span>${have} / ${targets[key]}枚</span><small>${need? 'あと'+need+'枚':'目安達成'}</small>${need?`<button type="button" class="button secondary draft-role-btn" data-role="${key}">この役割の候補を見る</button>`:''}</div>`;}).join('')}</div><p class="dynamic-note">現在の保存カード：${totalSaved}枚。非土地枠はあと約${stillNeeded}枚。テーマカードは役割が重複する場合があるため、最終調整時に再確認してください。</p>`;
    draftDiagnosis.querySelectorAll('.draft-role-btn').forEach(btn=>btn.addEventListener('click',()=>searchRoleCandidates(btn.dataset.role)));
  }

  async function autoBuildDraft(){
    if(!state.dynamicCommander){status.textContent='先に統率者を選択してください。';return;}
    draftAutoBuild.disabled=true; draftAutoBuild.textContent='自動補充中…';
    const identity=state.dynamicCommander.color_identity||[], high=Number(bracket?.value)>=4;
    const targets={ramp:high?12:10,draw:high?12:10,interaction:high?12:10,protection:high?6:5,graveyard:3,tutor:high?5:2};
    const landTarget=high?35:37, nonlandTarget=99-landTarget;
    const counts={ramp:0,draw:0,interaction:0,protection:0,graveyard:0,tutor:0,theme:0};
    state.draftDeck.forEach(x=>counts[roleBucket(x.role)]++);
    const seen=new Set(state.draftDeck.map(x=>x.key)), cap=budgetCardCapUsd();
    const addItems=(items,key,max)=>{
      for(const item of items){
        if(state.draftDeck.length>=nonlandTarget || (counts[key]||0)>=max) break;
        const id=item.card.oracle_id||item.card.name, price=cardUsd(item.card);
        if(seen.has(id)) continue;
        if(budget.value!=='open' && price!=null && price>cap) continue;
        seen.add(id); counts[key]=(counts[key]||0)+1;
        const ref=domesticPriceInfo(item.card); state.draftDeck.push({key:id,name:displayName(item.card),role:item.role,usd:price,jpy:ref.jpy,priceSource:ref.source});
      }
    };
    try{
      for(const key of ['ramp','draw','interaction','protection','graveyard','tutor']){
        const spec=roleSearchSpec(key), found=await fetchSpec(spec,identity,state.dynamicCommander.name);
        addItems(found,key,targets[key]); await new Promise(r=>setTimeout(r,100));
      }
      const themes=detectThemes(state.dynamicCommander);
      for(const theme of themes){
        if(state.draftDeck.length>=nonlandTarget) break;
        const found=await fetchSpec({label:theme.label,query:theme.query,fallback:theme.fallback,reason:theme.reason},identity,state.dynamicCommander.name);
        addItems(found,'theme',nonlandTarget); await new Promise(r=>setTimeout(r,100));
      }
      if(state.draftDeck.length<nonlandTarget && state.suggestions.length){
        addItems(state.suggestions,'theme',nonlandTarget);
      }
      state.lands=buildLandPackage();
      const check=normalizeDeckTo100();
      saveDraftDeck();
      status.textContent=`最終チェック完了：統率者1枚 + 非土地 ${state.draftDeck.length}枚 + 土地 ${state.lands.length}枚 = ${check.total}枚です。`;
    }catch(e){status.textContent='自動補充に失敗しました。もう一度試してください。';}
    finally{draftAutoBuild.disabled=false;draftAutoBuild.textContent='99枚たたき台を自動補充';}
  }

  function basicLandName(color){
    return {W:'平地',U:'島',B:'沼',R:'山',G:'森'}[color] || '荒地';
  }

  function buildLandPackage(){
    if(!state.dynamicCommander) return [];
    const identity=state.dynamicCommander.color_identity||[], high=Number(bracket?.value)>=4;
    const target=high?35:37, lands=[];
    const add=(name,count=1)=>{for(let i=0;i<count;i++)lands.push({name,role:'土地'});};
    if(!identity.length){add('荒地',target);return lands;}
    if(identity.length===1){add(basicLandName(identity[0]),target);return lands;}
    const utility=['統率の塔','風変わりな果樹園','祖先の道'];
    utility.slice(0,Math.min(3,target)).forEach(x=>add(x));
    const remaining=target-lands.length, per=Math.floor(remaining/identity.length), extra=remaining%identity.length;
    identity.forEach((color,i)=>add(basicLandName(color),per+(i<extra?1:0)));
    return lands;
  }

  function normalizeDeckTo100(){
    if(!state.dynamicCommander) return {total:state.draftDeck.length+(state.lands?.length||0), adjusted:false};
    const targetMain=99;
    if(!Array.isArray(state.lands) || !state.lands.length) state.lands=buildLandPackage();
    let mainCount=state.draftDeck.length+state.lands.length, adjusted=false;
    if(mainCount<targetMain){
      const identity=state.dynamicCommander.color_identity||[];
      const fillers=identity.length?identity.map(basicLandName):['荒地'];
      let i=0;
      while(mainCount<targetMain){state.lands.push({name:fillers[i%fillers.length],role:'土地'});i++;mainCount++;adjusted=true;}
    }else if(mainCount>targetMain){
      const over=mainCount-targetMain;
      state.lands.splice(Math.max(0,state.lands.length-over),Math.min(over,state.lands.length));
      mainCount=state.draftDeck.length+state.lands.length; adjusted=true;
    }
    return {total:mainCount+1,main:mainCount,adjusted};
  }

  function draftGroups(){
    const groups={ramp:[],draw:[],interaction:[],protection:[],graveyard:[],tutor:[],theme:[]};
    state.draftDeck.forEach(x=>(groups[roleBucket(x.role)]||groups.theme).push(x));
    return groups;
  }

  function collapseNamedItems(items){
    const map=new Map();
    items.forEach(x=>{
      const name=x?.name||'';
      if(!name) return;
      const row=map.get(name);
      if(row) row.count+=1;
      else map.set(name,{name,count:1});
    });
    return [...map.values()];
  }

  function renderDraftExport(){
    if(!draftExportGrid) return;
    const groups=draftGroups();
    const labels={ramp:'マナ加速',draw:'ドロー',interaction:'除去・妨害',protection:'保護',graveyard:'墓地対策',tutor:'サーチ',theme:'テーマ・その他'};
    const landItems=state.lands||[]; draftExportGrid.innerHTML=(Object.entries(groups).filter(([,items])=>items.length).map(([key,items])=>{const rows=collapseNamedItems(items);return `<section class="draft-export-group"><h4>${labels[key]}（${items.length}）</h4><ul>${rows.map(x=>`<li>${x.count} ${esc(x.name)}</li>`).join('')}</ul></section>`;}).join('') + (landItems.length?(()=>{const rows=collapseNamedItems(landItems);return `<section class="draft-export-group"><h4>土地（${landItems.length}）</h4><ul>${rows.map(x=>`<li>${x.count} ${esc(x.name)}</li>`).join('')}</ul></section>`;})():'')) || '<p class="draft-deck-empty">カードを追加するとカテゴリ別に表示されます。</p>';
  }

  function importDeckText(){
    const commanderName=state.dynamicCommander?displayName(state.dynamicCommander):'';
    const landItems=(state.lands&&state.lands.length)?state.lands:buildLandPackage();
    const lines=[];
    if(commanderName) lines.push(`1 ${commanderName}`);
    state.draftDeck.forEach(x=>lines.push(`1 ${x.name}`));
    const counts=new Map();
    landItems.forEach(x=>counts.set(x.name,(counts.get(x.name)||0)+1));
    counts.forEach((count,name)=>lines.push(`${count} ${name}`));
    return lines.join('\n');
  }

  function draftText(){
    const groups=draftGroups(), labels={ramp:'マナ加速',draw:'ドロー',interaction:'除去・妨害',protection:'保護',graveyard:'墓地対策',tutor:'サーチ',theme:'テーマ・その他'};
    const commanderName=state.dynamicCommander?displayName(state.dynamicCommander):'未選択';
    const landItems=(state.lands&&state.lands.length)?state.lands:buildLandPackage(), landTarget=landItems.length;
    const lines=[`【MAGSTA 統率者デッキ案】`,`統率者: ${commanderName}`,`ブラケット: ${bracket?.value||'-'}`,`土地: ${landTarget}枚`,''];
    Object.entries(groups).forEach(([key,items])=>{if(!items.length)return;lines.push(`## ${labels[key]} (${items.length})`,...items.map(x=>`1 ${x.name}`),'');});
    lines.push(`## 土地 (${landTarget})`,...landItems.map(x=>`1 ${x.name}`));
    return lines.join('\n');
  }

  function renderDraftDeck(){
    const totalJpy=state.draftDeck.map(x=>Number(x.jpy ?? (Number.isFinite(Number(x.usd))?Number(x.usd)*USD_TO_JPY:null))).filter(Number.isFinite).reduce((a,b)=>a+b,0);
    const check=normalizeDeckTo100(); draftSummary.textContent=`${state.draftDeck.length}枚保存 / 土地 ${state.lands.length}枚 / 合計 ${check.total}枚 / 概算 ${totalJpy.toLocaleString('ja-JP')}円（この端末のブラウザに保存）`;
    draftList.innerHTML=state.draftDeck.length?state.draftDeck.map((x,i)=>`<div class="draft-deck-row"><div><strong>${esc(x.name)}</strong><small>${esc(x.role||'候補')}</small></div><span>${x.jpy==null?'価格不明':'約'+Number(x.jpy).toLocaleString('ja-JP')+'円'}${x.priceSource?`<small>${esc(x.priceSource)}</small>`:''}</span><button type="button" class="button secondary draft-remove" data-index="${i}">削除</button></div>`).join(''):'<p class="draft-deck-empty">まだカードは保存されていません。</p>';
    draftList.querySelectorAll('.draft-remove').forEach(btn=>btn.addEventListener('click',()=>{state.draftDeck.splice(Number(btn.dataset.index),1);saveDraftDeck();}));
    renderDraftExport();
    renderDraftDiagnosis();
  }
  draftAddAll.addEventListener('click',()=>{state.suggestions.forEach(addDraftCard);status.textContent='現在の候補を仮デッキリストに保存しました。';});
  draftAutoBuild.addEventListener('click',autoBuildDraft);
  draftClear.addEventListener('click',()=>{state.draftDeck=[];state.lands=[];saveDraftDeck();});
  draftCopy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(draftText());draftCopyStatus.textContent='デッキリストをコピーしました。';}catch(e){draftCopyStatus.textContent='コピーできませんでした。';}});
  draftCopyImport.addEventListener('click',async()=>{try{const check=normalizeDeckTo100();await navigator.clipboard.writeText(importDeckText());draftCopyStatus.textContent=`Moxfield / Archidekt用に ${check.total}枚のリストをコピーしました。`;}catch(e){draftCopyStatus.textContent='インポート用リストをコピーできませんでした。';}});
  try { loadDraftDeck(); } catch(e) { console.warn('MAGSTA draft init failed', e); state.draftDeck=[]; state.lands=[]; if(draftSummary) draftSummary.textContent='仮デッキの保存データを読み込めませんでした。検索機能は利用できます。'; }

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

  async function japaneseDisplayCard(card) {
    if (!card) return card;
    try {
      const r = await fetch(`https://api.scryfall.com/cards/${card.set}/${card.collector_number}/ja`);
      if (!r.ok) return card;
      const ja = await r.json();
      return {
        ...card,
        printed_name: ja.printed_name || ja.name || card.printed_name || card.name,
        printed_text: ja.printed_text || card.printed_text || card.oracle_text,
        image_uris: ja.image_uris || card.image_uris,
        card_faces: ja.card_faces || card.card_faces
      };
    } catch(e) {
      return card;
    }
  }

  async function localizeSuggestionItem(item) {
    if (!item?.card) return item;
    const card = await japaneseDisplayCard(item.card);
    let alternative = item.alternative;
    if (alternative?.card) {
      alternative = { ...alternative, card: await japaneseDisplayCard(alternative.card) };
    }
    return { ...item, card, alternative };
  }

  async function fetchSpec(spec, identity, commanderName) {
    const prefix = `legal:commander game:paper ${identityQuery(identity)} -name:${JSON.stringify(commanderName)}`;
    for (const q of [spec.query,spec.fallback].filter(Boolean)) {
      try {
        const r = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(`${prefix} ${q}`)}&order=edhrec&unique=cards`);
        if (!r.ok) continue;
        const data = await r.json();
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

  function cardKey(card) {
    return card?.oracle_id || card?.name || card?.printed_name || '';
  }

  function findBudgetAlternative(item, groups, usedKeys = new Set()) {
    if (budget.value === 'open') return null;
    const price = cardUsd(item.card), cap = budgetCardCapUsd();
    if (price == null || price <= cap) return null;
    const currentKey = cardKey(item.card);
    const pool = groups.flat().filter(x => {
      if (x.role !== item.role) return false;
      const key = cardKey(x.card);
      return key && key !== currentKey && !usedKeys.has(key);
    });
    const cheaper = pool
      .map(x=>({ ...x, usd:cardUsd(x.card) }))
      .filter(x=>x.usd != null && x.usd <= cap)
      .sort((a,b)=>a.usd-b.usd);
    return cheaper[0] || null;
  }

  function cardUsd(card) {
    const values = [card?.prices?.usd, card?.prices?.usd_foil]
      .filter(v => v !== null && v !== undefined && v !== '')
      .map(Number)
      .filter(v => Number.isFinite(v) && v > 0);
    return values.length ? Math.min(...values) : null;
  }

  async function loadDomesticPrices() {
    try {
      const res = await fetch('domestic-prices.json?v=20261005');
      if (!res.ok) return;
      const data = await res.json();
      state.domesticPrices = data.cards || {};
      state.domesticPriceMeta = data || {};
    } catch(e) {}
  }

  function domesticPriceInfo(card) {
    const keys=[card?.oracle_id,card?.name,card?.printed_name].filter(Boolean);
    for(const key of keys){
      const row=state.domesticPrices?.[key];
      if(row && Number.isFinite(Number(row.jpy))){
        return {jpy:Number(row.jpy),source:row.source||state.domesticPriceMeta?.primary_source||'国内価格'};
      }
    }
    const usd=cardUsd(card);
    if(usd==null) return {jpy:null,source:'価格情報なし'};
    return {jpy:Math.round(usd*USD_TO_JPY),source:'Scryfall換算'};
  }

  function cardReferenceYen(card) {
    return domesticPriceInfo(card).jpy;
  }

  function wisdomPriceUrl(card) {
    const name=card?.name || card?.printed_name || '';
    return name ? `https://wonder.wisdom-guild.net/price/${encodeURIComponent(name)}/` : '';
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
    const affordable = [], premiumWithAlt = [], unknown = [];
    for (const item of items) {
      const price = cardUsd(item.card);
      if (price == null) unknown.push(item);
      else if (price <= cap) affordable.push(item);
      else if (item.alternative) premiumWithAlt.push(item);
    }
    return [...affordable, ...premiumWithAlt.slice(0,2), ...unknown].slice(0, limit);
  }

  function budgetFilterLabel() {
    if (budget.value === '5000') return '低価格カード中心';
    if (budget.value === '10000') return '中低価格カード中心';
    if (budget.value === '30000') return '中価格帯まで許容';
    return '価格制限なし';
  }

  const USD_TO_JPY = 150;

  function priceSummary(items) {
    const known = items.map(item=>cardReferenceYen(item.card)).filter(v=>v != null);
    const unknown = items.length - known.length;
    const totalJpy = Math.round(known.reduce((sum,v)=>sum+v,0));
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


  function renderSuggestionCards() {
    grid.innerHTML=state.suggestions.map(({card,role,reason,alternative},index)=>{
      const jp=displayName(card), en=card.name||jp, text=displayText(card), usd=cardUsd(card);
      const ref=domesticPriceInfo(card), price=ref.jpy==null?'価格不明':`約${ref.jpy.toLocaleString('ja-JP')}円`, wisdomUrl=wisdomPriceUrl(card);
      const alt=alternative?.card, altRef=alt?domesticPriceInfo(alt):null, altName=alt?displayName(alt):'', altPrice=altRef?.jpy==null?'':`約${altRef.jpy.toLocaleString('ja-JP')}円`;
      const altHtml=alt?`<div class="synergy-alt"><strong>安い代替候補：</strong><a href="${esc(alt.scryfall_uri)}" target="_blank" rel="noopener noreferrer">${esc(altName)}</a><span>${esc(altPrice)}</span><small>同じ「${esc(role)}」枠の候補</small><button type="button" class="button secondary synergy-swap" data-index="${index}">このカードに差し替える</button></div>`:'';
      return `<article class="synergy-card"><div class="synergy-image">${imgOf(card)?`<a href="${esc(card.scryfall_uri)}" target="_blank" rel="noopener noreferrer"><img src="${imgOf(card)}" loading="lazy" decoding="async" alt="${esc(jp)}"></a>`:''}</div><div class="synergy-body"><span class="synergy-role">${esc(role)}</span><h3>${esc(jp)}</h3>${jp!==en?`<small>${esc(en)}</small>`:''}<p class="synergy-price"><strong>国内参考価格：</strong>${esc(price)}<small>${esc(ref.source)}</small>${wisdomUrl?`<a class="wisdom-price-link" href="${esc(wisdomUrl)}" target="_blank" rel="noopener noreferrer">Wisdom Guildで国内相場を確認</a>`:''}</p>${altHtml}<p>${esc(text.slice(0,110))}${text.length>110?'…':''}</p><p class="synergy-reason"><strong>採用理由：</strong>${esc(reason)}</p><button type="button" class="button secondary synergy-save" data-index="${index}">仮デッキに追加</button></div></article>`;
    }).join('');
    grid.querySelectorAll('.synergy-save').forEach(btn=>btn.addEventListener('click',()=>{const item=state.suggestions[Number(btn.dataset.index)];if(item){addDraftCard(item);status.textContent=`${displayName(item.card)} を仮デッキに保存しました。`;}}));
    grid.querySelectorAll('.synergy-swap').forEach(btn=>btn.addEventListener('click',()=>{
      const index=Number(btn.dataset.index), item=state.suggestions[index], alt=item?.alternative;
      if(!item || !alt) return;
      const altKey=cardKey(alt.card);
      const duplicateIndex=state.suggestions.findIndex((x,i)=>i!==index && cardKey(x.card)===altKey);
      if(duplicateIndex>=0){
        status.textContent=`${displayName(alt.card)} は他の候補ですでに表示中のため、重複を避けて差し替えませんでした。`;
        item.alternative=null;
        renderSuggestionCards();
        return;
      }
      item.card=alt.card; item.reason=alt.reason || item.reason; item.alternative=null;
      renderSuggestionCards();
      refreshBudgetPlan();
      status.textContent=`${displayName(item.card)} に差し替えました。候補合計と予算残額を再計算しました。`;
    }));
  }

  function refreshBudgetPlan() {
    if (!plan) return;
    const mode=strategy?.value || 'balanced';
    const high=Number(bracket.value)>=4, lands=high?'34〜36':'36〜38', themeLabel=state.themes.map(t=>t.label).join(' / ') || '能力ベース';
    plan.innerHTML=[['検出テーマ',themeLabel],['方針',strategyNames[mode]],['土地',lands],['予算フィルター',budgetFilterLabel()],['候補10枚の概算',priceSummaryLabel(state.suggestions)],['予算残額',remainingBudgetLabel(state.suggestions)],['候補構成','テーマ優先＋方針補助 / 汎用定番は最大2枚']].map(([k,v])=>`<div><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join('');
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
      state.suggestions=mergeCandidates(groups,10);
      const displayedKeys=new Set(state.suggestions.map(item=>cardKey(item.card)).filter(Boolean));
      const reservedAlternativeKeys=new Set();
      state.suggestions.forEach(item=>{
        const blocked=new Set([...displayedKeys,...reservedAlternativeKeys]);
        blocked.delete(cardKey(item.card));
        item.alternative=findBudgetAlternative(item,groups,blocked);
        const altKey=cardKey(item.alternative?.card);
        if(altKey) reservedAlternativeKeys.add(altKey);
      });
      state.suggestions=applyBudgetFilter(state.suggestions,10);
      if (!state.suggestions.length) { grid.innerHTML='<p class="builder-empty">テーマに合う候補を取得できませんでした。別の方針でも試してください。</p>'; return; }
      state.suggestions = await Promise.all(state.suggestions.map(localizeSuggestionItem));
      renderSuggestionCards();
      refreshBudgetPlan();
      status.textContent=`${displayName(c)} 専用のテーマ候補を表示しました。国内価格データがあるカードはWisdom Guild参考値を優先し、未登録カードはScryfall価格を1ドル=${USD_TO_JPY}円で円換算しています。`;
    } finally { loadSynergyButton.disabled=false; loadSynergyButton.textContent='相性カード候補を再検討'; }
  }

  loadSynergyButton.addEventListener('click',renderDynamic);
  select.addEventListener('change',()=>{ if(state.dynamicCommander && select.value===state.dynamicCommander.name) chooseCommander(state.dynamicCommander); });
  budget.addEventListener('change',()=>{ if(state.dynamicCommander) renderCommanderSummary(state.dynamicCommander); });
  bracket.addEventListener('change',()=>{ if(state.dynamicCommander){ renderCommanderSummary(state.dynamicCommander); if(state.lands.length) state.lands=buildLandPackage(); } renderDraftDeck(); });
  strategy?.addEventListener('change',()=>{ if(state.dynamicCommander){ renderCommanderSummary(state.dynamicCommander); grid.innerHTML='<p class="builder-empty">方針を変更しました。「相性カード候補を再検討」を押すと候補を組み直します。</p>'; loadSynergyButton.textContent='相性カード候補を再検討'; } });
})();