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

  function planFor(budget,bracket){
    const high = Number(bracket)>=4;
    if(budget==='5000') return [['土地','37前後'],['加速','10〜12'],['ドロー','9〜11'],['除去・妨害',high?'10〜12':'8〜10']];
    if(budget==='10000') return [['土地','36〜37'],['加速','10前後'],['ドロー','10〜12'],['除去・妨害',high?'11〜13':'9〜11']];
    if(budget==='30000') return [['土地','35〜37'],['加速','10〜12'],['ドロー','10〜13'],['除去・妨害',high?'12〜14':'10〜12']];
    return [['土地','34〜37'],['加速','10〜13'],['ドロー','11〜14'],['除去・妨害',high?'12〜16':'10〜13']];
  }

  async function renderBuilder(){
    const name=commanderSelect.value, budget=budgetSelect.value, bracket=bracketSelect.value;
    const list=synergyDB[name]||[];
    summary.innerHTML=`<strong>${name}</strong>予算：${budget==='open'?'上限なし':Number(budget).toLocaleString('ja-JP')+'円前後'} / Bracket ${bracket}。まずは役割が重複しすぎないように10枚の候補から核を選びます。`;
    synergyGrid.innerHTML=list.map(([card,role,note])=>`<article class="synergy-card" data-card="${card.replace(/"/g,'&quot;')}"><div class="synergy-image"><div class="commander-image-placeholder">画像読み込み中</div></div><div class="synergy-body"><span class="synergy-role">${role}</span><h3>${card}</h3><p>${note}</p></div></article>`).join('');
    budgetPlan.innerHTML=planFor(budget,bracket).map(([k,v])=>`<div><strong>${k}</strong><span>${v}</span></div>`).join('');
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
