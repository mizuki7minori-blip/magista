(() => {
  const commanders = [
    {rank:1,name:"Y'shtola, Night's Blessed",decks:"55,459",note:"FFコラボから人気が急上昇したエスパー統率者。"},
    {rank:2,name:"Edgar Markov",decks:"51,322",note:"吸血鬼部族の定番。展開力の高いマルドゥ統率者。"},
    {rank:3,name:"The Ur-Dragon",decks:"51,168",note:"5色ドラゴンの代表格。大型ドラゴンを豪快に展開。"},
    {rank:4,name:"Atraxa, Praetors' Voice",decks:"45,170",note:"増殖を軸に幅広い戦略を取れる人気統率者。"},
    {rank:5,name:"Krenko, Mob Boss",decks:"44,295",note:"ゴブリンを大量展開する赤単の定番。"},
    {rank:6,name:"Vivi Ornitier",decks:"41,314",note:"FF出身。呪文連打とコンボを組みやすい人気統率者。"},
    {rank:7,name:"Sauron, the Dark Lord",decks:"40,257",note:"指輪物語の人気統率者。動員とカード選択を活用。"},
    {rank:8,name:"Kaalia of the Vast",decks:"39,966",note:"天使・デーモン・ドラゴンを踏み倒す豪快な統率者。"},
    {rank:9,name:"Teval, the Balanced Scale",decks:"39,242",note:"スゥルタイ色の墓地活用を得意とする統率者。"},
    {rank:10,name:"Fire Lord Azula",decks:"38,192",note:"攻撃的な呪文戦略を組みやすい人気統率者。"}
  ];

  const synergyDB = {
    "Y'shtola, Night's Blessed": [
      ["Sol Ring","加速","まず欲しい定番マナ加速。"],["Arcane Signet","加速","固有色に合わせやすい2マナ加速。"],["Esper Sentinel","ドロー","相手の呪文から手札差を作る。"],["Rhystic Study","ドロー","長期戦で継続的に手札を増やす。"],["Swords to Plowshares","除去","軽量で扱いやすい単体除去。"],["Counterspell","妨害","重要な呪文を止める基本枠。"],["Teferi's Protection","防御","盤面とライフをまとめて守る。"],["Demonic Tutor","サーチ","必要な勝ち筋や回答札へアクセス。"],["Smothering Tithe","加速","多人数戦で大量マナを得やすい。"],["Cyclonic Rift","全体干渉","終盤のテンポ逆転に使いやすい。"]
    ],
    "Edgar Markov": [
      ["Sol Ring","加速","吸血鬼展開を早める定番。"],["Arcane Signet","加速","3色を安定させる。"],["Skullclamp","ドロー","小型吸血鬼を手札に変える。"],["Welcoming Vampire","ドロー","小型展開と好相性。"],["Shared Animosity","勝ち筋","部族横並びの打点を大幅強化。"],["Captivating Vampire","部族強化","吸血鬼全体を強化しつつ制圧。"],["Swords to Plowshares","除去","軽量除去。"],["Path to Exile","除去","追加の軽量除去。"],["Vanquisher's Banner","部族強化","部族強化と継続ドロー。"],["Kindred Dominance","全体除去","自軍の部族を残しやすい。"]
    ],
    "The Ur-Dragon": [
      ["Sol Ring","加速","重いドラゴンを早く出す。"],["Arcane Signet","加速","5色基盤を補助。"],["Dragon's Hoard","加速/ドロー","ドラゴンデッキ専用の便利枠。"],["Herald's Horn","軽減","ドラゴンのコストを下げる。"],["Urza's Incubator","軽減","大型ドラゴンを連打しやすくする。"],["Temur Ascendancy","ドロー","大型クリーチャー展開で手札補充。"],["Dragon Tempest","勝ち筋","ドラゴン展開を直接打点へ変換。"],["Scourge of Valkas","勝ち筋","ドラゴン枚数を火力に変える。"],["Crux of Fate","全体除去","ドラゴンを残す選択肢が取れる。"],["Swords to Plowshares","除去","軽い回答札。"]
    ],
    "Atraxa, Praetors' Voice": [
      ["Sol Ring","加速","4色統率者を早く着地。"],["Arcane Signet","加速","色安定。"],["Evolution Sage","増殖","土地を置くだけで増殖。"],["Flux Channeler","増殖","非クリーチャー呪文で増殖。"],["Tekuthal, Inquiry Dominus","増殖","増殖回数を強化。"],["Deepglow Skate","増殖","各種カウンターを一気に倍化。"],["Swords to Plowshares","除去","軽量除去。"],["Farewell","全体除去","盤面を広くリセット。"],["Rhystic Study","ドロー","長期戦向けの手札補充。"],["Teferi's Protection","防御","育てた盤面を守る。"]
    ],
    "Krenko, Mob Boss": [
      ["Sol Ring","加速","クレンコ着地を早める。"],["Skirk Prospector","加速","ゴブリンをマナに変換。"],["Goblin Chieftain","部族強化","速攻付与と全体強化。"],["Goblin Warchief","軽減","ゴブリン展開を高速化。"],["Impact Tremors","勝ち筋","大量トークンを直接ダメージへ。"],["Purphoros, God of the Forge","勝ち筋","横並びを大ダメージに変換。"],["Skullclamp","ドロー","トークンを手札へ変える。"],["Goblin Matron","サーチ","必要なゴブリンを探す。"],["Goblin Recruiter","サーチ","デッキ上をゴブリンで整える。"],["Chaos Warp","除去","赤で触りにくい永久物への回答。"]
    ]
  };

  const style=document.createElement('style');
  style.textContent=`.commander-search-wrap{display:grid;grid-template-columns:1fr auto;gap:10px;margin:14px 0 4px}.commander-search-wrap input{min-height:46px;padding:10px 13px;border:1px solid var(--line);border-radius:7px;font:inherit}.commander-search-results{display:flex;flex-wrap:wrap;gap:7px;margin:8px 0 14px}.commander-chip{border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 10px;cursor:pointer;font:inherit}.commander-chip:hover{background:#f3f5f7}.deck-template{margin-top:22px;border-top:1px solid var(--line);padding-top:20px}.deck-template-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.deck-template-actions{display:flex;gap:8px;flex-wrap:wrap}.deck-template-actions button{border:1px solid var(--line);background:#fff;border-radius:7px;padding:8px 12px;cursor:pointer}.deck-groups{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}.deck-group{border:1px solid var(--line);border-radius:8px;padding:14px;background:#fff}.deck-group h3{font-size:.95rem;margin:0 0 7px}.deck-group ul{margin:0;padding-left:1.2rem}.deck-group li{font-size:.82rem;margin:.2rem 0}.deck-total{margin-top:12px;font-weight:800}.deck-copy-status{font-size:.8rem;color:var(--muted)}@media(max-width:850px){.deck-groups{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.commander-search-wrap{grid-template-columns:1fr}.deck-groups{grid-template-columns:1fr}}`;
  document.head.appendChild(style);

  const grid = document.getElementById('commander-ranking');
  const placeholder = (name) => `https://placehold.co/488x680?text=${encodeURIComponent(name)}`;
  const cardCache = new Map();

  async function getCard(name){
    if(cardCache.has(name)) return cardCache.get(name);
    try {
      const res = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
      if(!res.ok) throw new Error('not found');
      const data = await res.json();
      const image = data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal || placeholder(name);
      let result = {name:data.name,image,url:data.scryfall_uri};
      const jaRes = await fetch(`https://api.scryfall.com/cards/${data.set}/${data.collector_number}/ja`);
      if(jaRes.ok){
        const ja = await jaRes.json();
        result = {name:ja.printed_name || ja.name || name,image:ja.image_uris?.normal || ja.card_faces?.[0]?.image_uris?.normal || image,url:ja.scryfall_uri || data.scryfall_uri};
      }
      cardCache.set(name,result); return result;
    } catch(e){
      const result = {name,image:placeholder(name),url:`https://scryfall.com/search?q=${encodeURIComponent('!"'+name+'"')}`};
      cardCache.set(name,result); return result;
    }
  }

  if(grid){
    grid.innerHTML = commanders.map(c => `<article class="commander-card" data-name="${c.name.replace(/"/g,'&quot;')}"><div class="commander-rank">#${c.rank}</div><div class="commander-image-wrap"><div class="commander-image-placeholder">画像読み込み中</div></div><div class="commander-card-body"><h3>${c.name}</h3><p>${c.note}</p><div class="commander-meta"><span>EDHREC ${c.decks} decks</span></div></div></article>`).join('');
    const cards = [...grid.querySelectorAll('.commander-card')];
    const batch = async (start=0) => {
      const slice = cards.slice(start,start+3);
      await Promise.all(slice.map(async el => {
        const c = commanders[cards.indexOf(el)];
        const card = await getCard(c.name);
        el.querySelector('h3').textContent = card.name;
        el.querySelector('.commander-image-wrap').innerHTML = `<a href="${card.url}" target="_blank" rel="noopener noreferrer"><img src="${card.image}" loading="lazy" alt="${card.name}"></a>`;
      }));
      if(start+3 < cards.length) setTimeout(()=>batch(start+3),120);
    };
    batch();
  }

  const commanderSelect = document.getElementById('commander-select');
  const budgetSelect = document.getElementById('budget-select');
  const bracketSelect = document.getElementById('bracket-select');
  const synergyGrid = document.getElementById('synergy-grid');
  const summary = document.getElementById('builder-summary');
  const budgetPlan = document.getElementById('budget-plan');
  if(!commanderSelect || !synergyGrid) return;

  Object.keys(synergyDB).forEach((name,i)=>{
    const option=document.createElement('option'); option.value=name; option.textContent=name; if(i===0) option.selected=true; commanderSelect.appendChild(option);
  });

  const controls=commanderSelect.closest('.commander-builder-controls');
  const searchWrap=document.createElement('div');
  searchWrap.className='commander-search-wrap';
  searchWrap.innerHTML='<input id="commander-search" type="search" placeholder="統率者名を検索（英語名の一部でもOK）"><button class="button secondary" type="button" id="commander-search-clear">クリア</button>';
  controls.before(searchWrap);
  const results=document.createElement('div'); results.className='commander-search-results'; searchWrap.after(results);
  const searchInput=searchWrap.querySelector('#commander-search');
  const clearBtn=searchWrap.querySelector('#commander-search-clear');

  function renderSearch(q=''){
    const text=q.trim().toLowerCase();
    const pool=Object.keys(synergyDB).filter(n=>!text || n.toLowerCase().includes(text)).slice(0,8);
    results.innerHTML=pool.map(n=>`<button class="commander-chip" type="button" data-name="${n.replace(/"/g,'&quot;')}">${n}</button>`).join('');
    results.querySelectorAll('.commander-chip').forEach(btn=>btn.addEventListener('click',()=>{commanderSelect.value=btn.dataset.name;renderBuilder();searchInput.value='';renderSearch('');}));
  }
  searchInput.addEventListener('input',e=>renderSearch(e.target.value));
  clearBtn.addEventListener('click',()=>{searchInput.value='';renderSearch('');searchInput.focus();});
  renderSearch('');

  function planFor(budget,bracket){
    const high = Number(bracket)>=4;
    if(budget==='5000') return [['土地','37前後'],['加速','10〜12'],['ドロー','9〜11'],['除去・妨害',high?'10〜12':'8〜10']];
    if(budget==='10000') return [['土地','36〜37'],['加速','10前後'],['ドロー','10〜12'],['除去・妨害',high?'11〜13':'9〜11']];
    if(budget==='30000') return [['土地','35〜37'],['加速','10〜12'],['ドロー','10〜13'],['除去・妨害',high?'12〜14':'10〜12']];
    return [['土地','34〜37'],['加速','10〜13'],['ドロー','11〜14'],['除去・妨害',high?'12〜16':'10〜13']];
  }

  const deckTemplate=document.createElement('section');
  deckTemplate.className='deck-template';
  deckTemplate.innerHTML='<div class="deck-template-head"><div><span class="section-kicker">99-CARD TEMPLATE</span><h2>99枚の構築ひな型</h2></div><div class="deck-template-actions"><button type="button" id="deck-refresh">ひな型を更新</button><button type="button" id="deck-copy">テキストをコピー</button></div></div><p class="commander-note">実カード99枚を固定するのではなく、まず役割ごとの枚数と核カードを組みます。そこから予算と好みに合わせて差し替えます。</p><div id="deck-groups" class="deck-groups"></div><div class="deck-total" id="deck-total"></div><div class="deck-copy-status" id="deck-copy-status"></div>';
  budgetPlan.after(deckTemplate);

  function buildTemplate(name,budget,bracket){
    const high=Number(bracket)>=4;
    const lands=budget==='open'?(high?34:35):budget==='30000'?35:budget==='10000'?36:37;
    const ramp=high?12:10;
    const draw=high?12:10;
    const interaction=high?12:10;
    const wipes=high?3:4;
    const protection=high?6:5;
    const grave=3;
    const tutors=high?5:(budget==='5000'?1:2);
    const synergy=Math.max(0,99-(lands+ramp+draw+interaction+wipes+protection+grave+tutors));
    const core=(synergyDB[name]||[]).map(x=>x[0]);
    return [
      ['土地',lands,['基本土地・2色土地・多色土地を固有色に合わせて調整']],
      ['マナ加速',ramp,core.filter((_,i)=>['加速','加速/ドロー','軽減'].includes((synergyDB[name]||[])[i]?.[1])).slice(0,4)],
      ['ドロー',draw,core.filter((_,i)=>String((synergyDB[name]||[])[i]?.[1]).includes('ドロー')).slice(0,4)],
      ['除去・妨害',interaction,core.filter((_,i)=>['除去','妨害','全体干渉'].includes((synergyDB[name]||[])[i]?.[1])).slice(0,4)],
      ['全体除去',wipes,core.filter((_,i)=>String((synergyDB[name]||[])[i]?.[1]).includes('全体')).slice(0,3)],
      ['防御',protection,core.filter((_,i)=>String((synergyDB[name]||[])[i]?.[1]).includes('防御')).slice(0,3)],
      ['墓地対策',grave,['墓地利用が多い卓なら増量']],
      ['サーチ',tutors,core.filter((_,i)=>String((synergyDB[name]||[])[i]?.[1]).includes('サーチ')).slice(0,3)],
      ['統率者シナジー・勝ち筋',synergy,core.filter((_,i)=>['勝ち筋','部族強化','増殖'].some(r=>String((synergyDB[name]||[])[i]?.[1]).includes(r))).slice(0,6)]
    ];
  }

  function renderDeckTemplate(){
    const name=commanderSelect.value,budget=budgetSelect.value,bracket=bracketSelect.value;
    const groups=buildTemplate(name,budget,bracket);
    const wrap=document.getElementById('deck-groups');
    wrap.innerHTML=groups.map(([label,count,examples])=>`<article class="deck-group"><h3>${label}：${count}枚</h3><ul>${(examples.length?examples:['好みと予算に合わせて選択']).map(x=>`<li>${x}</li>`).join('')}</ul></article>`).join('');
    const total=groups.reduce((s,g)=>s+g[1],0);
    document.getElementById('deck-total').textContent=`統率者1枚 + メイン${total}枚 = 合計${total+1}枚`;
  }

  function deckText(){
    const name=commanderSelect.value,budget=budgetSelect.value,bracket=bracketSelect.value;
    const groups=buildTemplate(name,budget,bracket);
    return [`【MAGSTA 統率者デッキひな型】`,`統率者: ${name}`,`予算: ${budget==='open'?'上限なし':Number(budget).toLocaleString('ja-JP')+'円前後'}`,`Bracket: ${bracket}`,'',...groups.flatMap(([label,count,examples])=>[`${label} ${count}枚`,...(examples||[]).map(x=>`- ${x}`),''])].join('\n');
  }

  deckTemplate.querySelector('#deck-refresh').addEventListener('click',renderDeckTemplate);
  deckTemplate.querySelector('#deck-copy').addEventListener('click',async()=>{
    const status=document.getElementById('deck-copy-status');
    try{await navigator.clipboard.writeText(deckText());status.textContent='ひな型をコピーしました。';}
    catch(e){status.textContent='コピーできませんでした。ブラウザの権限をご確認ください。';}
  });

  async function renderBuilder(){
    const name=commanderSelect.value, budget=budgetSelect.value, bracket=bracketSelect.value;
    const list=synergyDB[name]||[];
    summary.innerHTML=`<strong>${name}</strong>予算：${budget==='open'?'上限なし':Number(budget).toLocaleString('ja-JP')+'円前後'} / Bracket ${bracket}。役割の重複を避けながら、まず10枚の核候補を選びます。`;
    synergyGrid.innerHTML=list.map(([card,role,note])=>`<article class="synergy-card" data-card="${card.replace(/"/g,'&quot;')}"><div class="synergy-image"><div class="commander-image-placeholder">画像読み込み中</div></div><div class="synergy-body"><span class="synergy-role">${role}</span><h3>${card}</h3><p>${note}</p></div></article>`).join('');
    budgetPlan.innerHTML=planFor(budget,bracket).map(([k,v])=>`<div><strong>${k}</strong><span>${v}</span></div>`).join('');
    renderDeckTemplate();
    const els=[...synergyGrid.querySelectorAll('.synergy-card')];
    for(let i=0;i<els.length;i+=3){
      await Promise.all(els.slice(i,i+3).map(async el=>{
        const key=el.dataset.card; const card=await getCard(key);
        el.querySelector('h3').textContent=card.name;
        el.querySelector('.synergy-image').innerHTML=`<a href="${card.url}" target="_blank" rel="noopener noreferrer"><img src="${card.image}" loading="lazy" alt="${card.name}"></a>`;
      }));
    }
  }

  [commanderSelect,budgetSelect,bracketSelect].forEach(el=>el.addEventListener('change',renderBuilder));
  renderBuilder();
})();
