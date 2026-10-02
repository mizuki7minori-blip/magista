(()=>{'use strict';
const $=id=>document.getElementById(id);
const setSel=$('tracker-set'),archSel=$('tracker-arch'),search=$('tracker-search'),results=$('tracker-search-results'),pickedEl=$('tracker-picked'),pickedCount=$('tracker-picked-count'),packEl=$('tracker-pack'),pickEl=$('tracker-pick'),autoEl=$('tracker-auto'),stageStatus=$('tracker-stage-status'),stageAdvice=$('tracker-stage-advice'),colorBars=$('tracker-color-bars'),colorNote=$('tracker-color-note'),recText=$('tracker-recommend-text'),recEl=$('tracker-recommendations'),reset=$('tracker-reset'),creaturesEl=$('tracker-creatures'),removalEl=$('tracker-removal'),advantageEl=$('tracker-advantage'),finisherEl=$('tracker-finisher'),curveEl=$('tracker-curve'),curveNote=$('tracker-curve-note'),mainCountEl=$('tracker-main-count'),mainStatusEl=$('tracker-main-status'),imageGrid=$('tracker-image-grid'),refreshCards=$('tracker-refresh-cards'),filterReset=$('tracker-filter-reset'),colorFilter=$('tracker-color-filter'),manaFilter=$('tracker-mana-filter');
if(!setSel)return;
const NAMES={W:'白',U:'青',B:'黒',R:'赤',G:'緑'};
let cards=[],jaCards=[],ranking=[],picked=[],imageOffset=0;
const roleFor=card=>{if(!card)return'優先ピック';const t=(card.oracle_text||card.card_faces?.map(f=>f.oracle_text||'').join(' ')||'').toLowerCase(),type=(card.type_line||'').toLowerCase(),mv=Number(card.cmc||0);if(/destroy target|exile target|deals? \d+ damage to target|gets -\d+\/-\d+/.test(t))return'除去';if(type.includes('creature')&&mv>0&&mv<=2)return'序盤要員';if(type.includes('creature')&&mv>=5)return'フィニッシャー';if(/draw (a|two|three|\d+) card|draw cards/.test(t))return'アドバンテージ';if((card.colors||[]).length>=2)return'アーキ中核';return'優先ピック';};
const storeKey=()=>`magsta-limited-picks-${setSel.value}`;
const loadPicked=()=>{try{picked=JSON.parse(localStorage.getItem(storeKey())||'[]');if(!Array.isArray(picked))picked=[];}catch{picked=[];}};
const savePicked=()=>{try{localStorage.setItem(storeKey(),JSON.stringify(picked));}catch{}};
const jaMap=()=>{const m=new Map();jaCards.forEach(c=>{if(c?.name)m.set(c.name,c)});return m;};
const byName=()=>new Map(cards.map(c=>[c.name,c]));
const displayName=name=>jaMap().get(name)?.printed_name||name;
const fetchPaged=async q=>{let url='https://api.scryfall.com/cards/search?q='+encodeURIComponent(q)+'&unique=prints&order=set',out=[],n=0;while(url&&n<5){const r=await fetch(url);if(!r.ok)break;const d=await r.json();out.push(...(d.data||[]));url=d.has_more?d.next_page:'';n++;}return out;};
const fetchData=async()=>{const set=setSel.value;const [snap,eng,ja]=await Promise.all([fetch('limited-ranking-data.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null),fetchPaged('set:'+set),fetchPaged('set:'+set+' lang:ja')]);cards=eng;jaCards=ja;const s=snap?.sets?.[set]||{};ranking=(archSel.value!=='ALL'&&s.archetypeCards?.[archSel.value]?.length?s.archetypeCards[archSel.value]:s.ranking)||[];renderAll();};
const syncStage=()=>{const auto=autoEl.checked;packEl.disabled=auto;pickEl.disabled=auto;if(auto){const next=Math.min(42,picked.length+1),pack=Math.min(3,Math.floor((next-1)/14)+1),pick=((next-1)%14)+1;packEl.value=pack;pickEl.value=pick;stageStatus.textContent=picked.length>=42?'ドラフト完了':`次：${pack}-${pick}`;}else stageStatus.textContent='手動';const p=Number(packEl.value),k=Number(pickEl.value);let title='',body='';if(p===1&&k<=5){title='序盤：色を開けておく';body='単体性能を優先し、まだ色を固定しすぎない段階です。';}else if(p===1){title='1パック後半：流れを読む';body='流れてくる色を見て主色候補を絞ります。';}else if(p===2&&k<=5){title='2パック序盤：軸を固める';body='色とアーキタイプに寄せていく段階です。';}else if(p===2){title='2パック後半：不足を埋める';body='除去・低マナ域・枚数不足を埋めます。';}else if(p===3&&k<=5){title='3パック序盤：完成度を上げる';body='完成色に沿ってメイン採用カードを優先します。';}else{title='終盤：23枚を完成させる';body='マナカーブと不足役割を最終調整します。';}stageAdvice.innerHTML='<strong>'+title+'</strong><p>'+body+'</p>';};
const colorProfile=()=>{const map=byName(),counts={W:0,U:0,B:0,R:0,G:0};picked.forEach(n=>(map.get(n)?.colors||[]).forEach(c=>counts[c]++));return Object.entries(counts).sort((a,b)=>b[1]-a[1]);};
const renderColors=()=>{const rows=colorProfile();colorBars.innerHTML=rows.map(([c,n])=>`<div class="tracker-color"><strong>${NAMES[c]}</strong><span>${n}票</span></div>`).join('');const total=rows.reduce((s,x)=>s+x[1],0);if(!total){colorNote.textContent='まだ色の傾向はありません。';return;}const [a,b,c]=rows,pack=Number(packEl.value),pick=Number(pickEl.value);if((pack===1&&pick<=5)||picked.length<5){colorNote.textContent=`現在は${NAMES[a[0]]}がやや多め。まだ色を切らず様子を見る段階です。`;return;}if(a[1]>=b[1]+3&&a[1]>=5){colorNote.textContent=`主色候補は${NAMES[a[0]]}、副色候補は${NAMES[b[0]]}。現在は${NAMES[a[0]]+NAMES[b[0]]}寄りです。${c&&c[1]<=1?' '+NAMES[c[0]]+'はかなり薄めです。':''}`;return;}colorNote.textContent=`現在は${NAMES[a[0]]+NAMES[b[0]]}が中心候補です。`;};
const counts=()=>{const map=byName();let cr=0,rm=0,ad=0,fi=0;picked.forEach(n=>{const c=map.get(n);if(!c)return;if((c.type_line||'').toLowerCase().includes('creature'))cr++;const r=roleFor(c);if(r==='除去')rm++;if(r==='アドバンテージ')ad++;if(r==='フィニッシャー')fi++;});return{cr,rm,ad,fi};};
const renderCurve=()=>{
  if(!curveEl||!curveNote)return;
  const map=byName(), bins={1:0,2:0,3:0,4:0,5:0,'6+':0};
  let nonlands=0;
  picked.forEach(n=>{
    const card=map.get(n);if(!card)return;
    if((card.type_line||'').toLowerCase().includes('land'))return;
    nonlands++;
    const mv=Math.max(0,Number(card.cmc||0));
    const key=mv>=6?'6+':String(Math.max(1,Math.floor(mv)));
    if(bins[key]!==undefined)bins[key]++;
  });
  curveEl.innerHTML=Object.entries(bins).map(([k,n])=>'<div class="tracker-curve-col"><span>'+k+'マナ</span><strong>'+n+'</strong></div>').join('');
  const low=bins['2']+bins['3'], high=bins['5']+bins['6+'];
  let note='マナカーブはバランスしています。';
  if(nonlands<8)note='まだ序盤です。2〜3マナ域を意識しながらピックを進めます。';
  else if(low<5)note='2〜3マナ域が少なめです。序盤に動けるカードを優先したい状態です。';
  else if(high>=6&&high>low/2)note='5マナ以上が多めです。これ以上の重いカードは慎重に選びましょう。';
  else if(bins['2']<3)note='2マナ域が薄めです。テンポを崩さないため、2マナのクリーチャーや妨害を優先候補に。';
  curveNote.textContent=note;
  if(mainCountEl)mainCountEl.textContent=Math.min(nonlands,23)+' / 23';
  if(mainStatusEl){
    mainStatusEl.textContent=nonlands>=23?'メイン候補到達':nonlands>=18?'完成間近':nonlands>=10?'骨格形成中':'まだ序盤';
  }
};
const fitColor=card=>{if(picked.length<5)return 0;const top=colorProfile(),main=top[0]?.[0],second=top[1]?.[0],pack=Number(packEl.value);let s=0;(card.colors||[]).forEach(c=>{if(c===main)s+=pack===1?.5:1.5;else if(c===second)s+=pack===1?.2:1;else if(pack>=2)s-=1;});return s;};
const renderRecommendations=()=>{const c=counts();creaturesEl.textContent=c.cr;removalEl.textContent=c.rm;advantageEl.textContent=c.ad;finisherEl.textContent=c.fi;const needs=[['序盤要員','クリーチャー',Math.max(0,15-c.cr)],['除去','除去',Math.max(0,4-c.rm)],['アドバンテージ','アドバンテージ',Math.max(0,3-c.ad)],['フィニッシャー','フィニッシャー',Math.max(0,2-c.fi)]].sort((a,b)=>b[2]-a[2]),need=needs[0],map=byName(),early=Number(packEl.value)===1&&Number(pickEl.value)<=5;const curve={2:0,3:0,5:0,6:0};picked.forEach(n=>{const card=map.get(n);if(!card||(card.type_line||'').toLowerCase().includes('land'))return;const mv=Number(card.cmc||0);if(mv===2)curve[2]++;if(mv===3)curve[3]++;if(mv===5)curve[5]++;if(mv>=6)curve[6]++;});const lowNeed=curve[2]+curve[3]<5,highHeavy=curve[5]+curve[6]>=6;const pool=ranking.map(i=>({item:i,card:map.get(i.name)})).filter(x=>x.card).map(x=>{let s=Number(x.item.wr||0)+fitColor(x.card);if(!early&&roleFor(x.card)===need[0])s+=need[2]*2;const mv=Number(x.card.cmc||0);if(lowNeed&&mv>=2&&mv<=3)s+=2.5;if(highHeavy&&mv>=5)s-=2.5;return{...x,s};}).sort((a,b)=>b.s-a.s).slice(0,3);let curveText=lowNeed?' 2〜3マナ域も不足しています。':highHeavy?' 重いカードは増やしすぎない方がよさそうです。':'';recText.textContent=(need[2]>0?`今は「${need[1]}」が不足気味です。`:'大きな役割不足はありません。')+curveText;recEl.innerHTML=pool.map(({item,card},i)=>`<div class="tracker-rec"><span><strong>${i+1}位 ${displayName(card.name)}</strong><small>${roleFor(card)} / ${Number(card.cmc||0)}マナ / GIH WR ${Number(item.wr||0).toFixed(1)}%</small></span><button class="tracker-add" data-pick="${card.name.replace(/"/g,'&quot;')}">＋ピック</button></div>`).join('');};
const matchesFilters=card=>{
  if(!card)return false;
  const color=colorFilter?.value||'ALL', mana=manaFilter?.value||'ALL';
  const colors=card.colors||[];
  if(color!=='ALL'){
    if(color==='C'){if(colors.length) return false;}
    else if(!colors.includes(color)) return false;
  }
  if(mana!=='ALL'){
    const mv=Number(card.cmc||0);
    if(mana==='6+'){if(mv<6)return false;}
    else if(Math.floor(mv)!==Number(mana))return false;
  }
  return true;
};
const imageFor=card=>card?.image_uris?.normal||card?.card_faces?.find(f=>f.image_uris)?.image_uris?.normal||'';
const renderImagePicker=()=>{
  if(!imageGrid)return;
  const map=byName();
  const source=ranking.map(i=>map.get(i.name)).filter(Boolean);
  const fallback=cards.filter(c=>{
    const allowed=archSel.value==='ALL'?null:new Set(({WU:['W','U'],UB:['U','B'],BR:['B','R'],RG:['R','G'],GW:['G','W'],WB:['W','B'],BG:['B','G'],GU:['G','U'],UR:['U','R'],RW:['R','W']})[archSel.value]||[]);
    return !allowed||(c.colors||[]).every(x=>allowed.has(x));
  });
  const pool=(source.length?source:fallback).filter(matchesFilters);
  if(!pool.length){imageGrid.innerHTML='<span class="limited-series-note">候補カードを準備中です。</span>';return;}
  const unique=[];const seen=new Set();
  [...pool,...fallback.filter(matchesFilters)].forEach(card=>{if(card?.name&&!seen.has(card.name)){seen.add(card.name);unique.push(card);}});
  const n=unique.length,start=imageOffset%n;
  const picks=[];for(let i=0;i<Math.min(10,n);i++)picks.push(unique[(start+i)%n]);
  imageGrid.innerHTML=picks.map(card=>{const img=imageFor(jaMap().get(card.name)||card),name=displayName(card.name);return `<button type="button" class="tracker-image-card" data-pick="${card.name.replace(/"/g,'&quot;')}">${img?`<img src="${img}" alt="${name}" loading="lazy" decoding="async">`:''}<strong>${name}</strong><small>${roleFor(card)} / ${Number(card.cmc||0)}マナ</small></button>`;}).join('');
};
const renderPicked=()=>{pickedCount.textContent=picked.length;if(!picked.length){pickedEl.innerHTML='<span class="limited-series-note">カードを検索して追加してください。</span>';return;}pickedEl.innerHTML=picked.map((n,i)=>`<span class="tracker-chip">${displayName(n)} <button data-remove="${i}">×</button></span>`).join('');};
const renderSearch=()=>{const q=search.value.trim().toLowerCase();if(!q){results.innerHTML='';return;}const jm=jaMap(),matches=[];for(const c of cards){if(!matchesFilters(c))continue;const j=jm.get(c.name),ja=(j?.printed_name||'').toLowerCase(),en=c.name.toLowerCase();if(ja.includes(q)||en.includes(q)){matches.push(c);if(matches.length>=10)break;}}results.innerHTML=matches.length?matches.map(c=>`<div class="tracker-result"><span>${displayName(c.name)}<small>${c.name}</small></span><button class="tracker-add" data-pick="${c.name.replace(/"/g,'&quot;')}">＋ピック</button></div>`).join(''):'<span class="limited-series-note">該当カードが見つかりません。</span>';};
const renderAll=()=>{syncStage();renderColors();renderCurve();renderRecommendations();renderImagePicker();renderPicked();renderSearch();savePicked();};
document.addEventListener('click',e=>{const a=e.target.closest('[data-pick]');if(a){picked.push(a.dataset.pick);renderAll();return;}const r=e.target.closest('[data-remove]');if(r){picked.splice(Number(r.dataset.remove),1);renderAll();}});
search.addEventListener('input',renderSearch);[colorFilter,manaFilter].filter(Boolean).forEach(el=>el.addEventListener('change',()=>{imageOffset=0;renderImagePicker();renderSearch();}));if(filterReset)filterReset.addEventListener('click',()=>{if(colorFilter)colorFilter.value='ALL';if(manaFilter)manaFilter.value='ALL';imageOffset=0;renderImagePicker();renderSearch();});if(refreshCards)refreshCards.addEventListener('click',()=>{imageOffset+=10;renderImagePicker();});reset.addEventListener('click',()=>{picked=[];renderAll();});autoEl.addEventListener('change',renderAll);packEl.addEventListener('input',renderAll);pickEl.addEventListener('input',renderAll);archSel.addEventListener('change',()=>{imageOffset=0;fetchData();});setSel.addEventListener('change',()=>{imageOffset=0;loadPicked();fetchData();});
const p=new URLSearchParams(location.search);if(p.get('set'))setSel.value=p.get('set');if(p.get('arch'))archSel.value=p.get('arch').toUpperCase();loadPicked();fetchData();
})();
(()=>{const s=document.createElement('script');s.src='limited-tracker-synergy.js?v=20261002-dedupe2';s.defer=true;document.body.appendChild(s);})();
