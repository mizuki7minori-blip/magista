(()=>{'use strict';
const $=id=>document.getElementById(id);
const setSel=$('tracker-set'),archSel=$('tracker-arch'),search=$('tracker-search'),results=$('tracker-search-results'),pickedEl=$('tracker-picked'),pickedCount=$('tracker-picked-count'),packEl=$('tracker-pack'),pickEl=$('tracker-pick'),autoEl=$('tracker-auto'),stageStatus=$('tracker-stage-status'),stageAdvice=$('tracker-stage-advice'),colorBars=$('tracker-color-bars'),colorNote=$('tracker-color-note'),recText=$('tracker-recommend-text'),recEl=$('tracker-recommendations'),reset=$('tracker-reset'),creaturesEl=$('tracker-creatures'),removalEl=$('tracker-removal'),advantageEl=$('tracker-advantage'),finisherEl=$('tracker-finisher'),curveEl=$('tracker-curve'),curveNote=$('tracker-curve-note'),mainCountEl=$('tracker-main-count'),mainStatusEl=$('tracker-main-status'),imageGrid=$('tracker-image-grid'),refreshCards=$('tracker-refresh-cards'),filterReset=$('tracker-filter-reset'),colorFilter=$('tracker-color-filter'),manaFilter=$('tracker-mana-filter');
if(!setSel)return;
const NAMES={W:'White',U:'Blue',B:'Black',R:'Red',G:'Green'};
let cards=[],jaCards=[],ranking=[],picked=[],imageOffset=0;
const roleFor=card=>{if(!card)return'Priority pick';const t=(card.oracle_text||card.card_faces?.map(f=>f.oracle_text||'').join(' ')||'').toLowerCase(),type=(card.type_line||'').toLowerCase(),mv=Number(card.cmc||0);if(/destroy target|exile target|deals? \d+ damage to target|gets -\d+\/-\d+/.test(t))return'Removal';if(type.includes('creature')&&mv>0&&mv<=2)return'Early play';if(type.includes('creature')&&mv>=5)return'Finisher';if(/draw (a|two|three|\d+) card|draw cards/.test(t))return'Card advantage';if((card.colors||[]).length>=2)return'Archetype core';return'Priority pick';};
const storeKey=()=>`magsta-en-limited-picks-${setSel.value}`;
const loadPicked=()=>{try{picked=JSON.parse(localStorage.getItem(storeKey())||'[]');if(!Array.isArray(picked))picked=[];}catch{picked=[];}};
const savePicked=()=>{try{localStorage.setItem(storeKey(),JSON.stringify(picked));}catch{}};
const jaMap=()=>{const m=new Map();jaCards.forEach(c=>{if(c?.name)m.set(c.name,c)});return m;};
const byName=()=>new Map(cards.map(c=>[c.name,c]));
const displayName=name=>jaMap().get(name)?.printed_name||name;
const fetchPaged=q=>window.MAGSTAEnglishTools.cardsForQuery(q);
let dataVersion=0;
const fetchData=async()=>{const version=++dataVersion,arch=archSel.value;const set=setSel.value;const [snap,eng,ja]=await Promise.all([window.MAGSTAEnglishTools.json('../limited-ranking-data.json').catch(()=>null),fetchPaged('set:'+set+' lang:en'),Promise.resolve([])]);if(version!==dataVersion)return;cards=eng;jaCards=ja;const s=snap?.sets?.[set]||{};ranking=(arch!=='ALL'&&s.archetypeCards?.[arch]?.length?s.archetypeCards[arch]:s.ranking)||[];renderAll();};
const syncStage=()=>{const auto=autoEl.checked;packEl.disabled=auto;pickEl.disabled=auto;if(auto){const next=Math.min(42,picked.length+1),pack=Math.min(3,Math.floor((next-1)/14)+1),pick=((next-1)%14)+1;packEl.value=pack;pickEl.value=pick;stageStatus.textContent=picked.length>=42?'Draft complete':`Next: ${pack}-${pick}`;}else stageStatus.textContent='Manual';const p=Number(packEl.value),k=Number(pickEl.value);let title='',body='';if(p===1&&k<=5){title='Early picks: keep colors open';body='Prioritize individual strength without locking into colors too early.';}else if(p===1){title='Late pack 1: read the signals';body='Look at the colors being passed and narrow your main-color options.';}else if(p===2&&k<=5){title='Early pack 2: commit to a plan';body='Move toward your colors and archetype.';}else if(p===2){title='Late pack 2: fill the gaps';body='Fill gaps in removal, early plays and playable cards.';}else if(p===3&&k<=5){title='Early pack 3: refine your deck';body='Prioritize main-deck cards in your chosen colors.';}else{title='Final picks: complete your spells';body='Make final adjustments to your curve and missing roles.';}stageAdvice.innerHTML='<strong>'+title+'</strong><p>'+body+'</p>';};
const colorProfile=()=>{const map=byName(),counts={W:0,U:0,B:0,R:0,G:0};picked.forEach(n=>(map.get(n)?.colors||[]).forEach(c=>counts[c]++));return Object.entries(counts).sort((a,b)=>b[1]-a[1]);};
const renderColors=()=>{
 const rows=colorProfile();
 colorBars.innerHTML=rows.map(([c,n])=>`<div class="tracker-color"><strong>${NAMES[c]}</strong><span>${n} picks</span></div>`).join('');
 if(!rows.some(([,n])=>n)){colorNote.textContent='No color preference yet.';return;}
 const [a,b]=rows;
 if((Number(packEl.value)===1&&Number(pickEl.value)<=5)||picked.length<5){colorNote.textContent=`${NAMES[a[0]]} is currently ahead. Keep your options open.`;return;}
 colorNote.textContent=`Leading colors: ${NAMES[a[0]]} / ${NAMES[b[0]]}. Review the cards being passed before committing.`;
};
const counts=()=>{const map=byName();let cr=0,rm=0,ad=0,fi=0;picked.forEach(n=>{const c=map.get(n);if(!c)return;if((c.type_line||'').toLowerCase().includes('creature'))cr++;const r=roleFor(c);if(r==='Removal')rm++;if(r==='Card advantage')ad++;if(r==='Finisher')fi++;});return{cr,rm,ad,fi};};
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
  curveEl.innerHTML=Object.entries(bins).map(([k,n])=>'<div class="tracker-curve-col"><span>'+k+' mana</span><strong>'+n+'</strong></div>').join('');
  const low=bins['2']+bins['3'], high=bins['5']+bins['6+'];
  let note='Your mana curve looks balanced.';
  if(nonlands<8)note='It is still early. Keep 2–3 mana plays in mind as you pick.';
  else if(low<5)note='You have few 2–3 mana plays. Prioritize cards that affect the early game.';
  else if(high>=6&&high>low/2)note='You have many cards costing 5 or more. Be cautious about adding more expensive spells.';
  else if(bins['2']<3)note='You are short on 2-mana plays. Consider early creatures or interaction.';
  curveNote.textContent=note;
  if(mainCountEl)mainCountEl.textContent=Math.min(nonlands,23)+' / 23';
  if(mainStatusEl){
    mainStatusEl.textContent=nonlands>=23?'Main-deck target reached':nonlands>=18?'Nearly complete':nonlands>=10?'Building the core':'Early stage';
  }
};
const fitColor=card=>{if(picked.length<5)return 0;const top=colorProfile(),main=top[0]?.[0],second=top[1]?.[0],pack=Number(packEl.value);let s=0;(card.colors||[]).forEach(c=>{if(c===main)s+=pack===1?.5:1.5;else if(c===second)s+=pack===1?.2:1;else if(pack>=2)s-=1;});return s;};
const renderRecommendations=()=>{const c=counts();creaturesEl.textContent=c.cr;removalEl.textContent=c.rm;advantageEl.textContent=c.ad;finisherEl.textContent=c.fi;const needs=[['Early play','Creatures',Math.max(0,15-c.cr)],['Removal','Removal',Math.max(0,4-c.rm)],['Card advantage','Card advantage',Math.max(0,3-c.ad)],['Finisher','Finisher',Math.max(0,2-c.fi)]].sort((a,b)=>b[2]-a[2]),need=needs[0],map=byName(),early=Number(packEl.value)===1&&Number(pickEl.value)<=5;const curve={2:0,3:0,5:0,6:0};picked.forEach(n=>{const card=map.get(n);if(!card||(card.type_line||'').toLowerCase().includes('land'))return;const mv=Number(card.cmc||0);if(mv===2)curve[2]++;if(mv===3)curve[3]++;if(mv===5)curve[5]++;if(mv>=6)curve[6]++;});const lowNeed=curve[2]+curve[3]<5,highHeavy=curve[5]+curve[6]>=6;const pool=ranking.map(i=>({item:i,card:map.get(i.name)})).filter(x=>x.card).map(x=>{let s=Number(x.item.wr||0)+fitColor(x.card);if(!early&&roleFor(x.card)===need[0])s+=need[2]*2;const mv=Number(x.card.cmc||0);if(lowNeed&&mv>=2&&mv<=3)s+=2.5;if(highHeavy&&mv>=5)s-=2.5;return{...x,s};}).sort((a,b)=>b.s-a.s).slice(0,3);let curveText=lowNeed?' You also need more 2–3 mana plays.':highHeavy?' Avoid adding too many expensive cards.':'';recText.textContent=(need[2]>0?`Your pool needs more ${need[1].toLowerCase()}.`:'No major role gaps detected.')+curveText;recEl.innerHTML=pool.map(({item,card},i)=>`<div class="tracker-rec"><span><strong>${i+1}. ${displayName(card.name)}</strong><small>${roleFor(card)} / ${Number(card.cmc||0)} mana / GIH WR ${Number(item.wr||0).toFixed(1)}%</small></span><button class="tracker-add" data-pick="${card.name.replace(/"/g,'&quot;')}">+ Pick</button></div>`).join('');};
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
  if(!pool.length){imageGrid.innerHTML='<span class="limited-series-note">No cards match the current filters.</span>';return;}
  const unique=[];const seen=new Set();
  [...pool,...fallback.filter(matchesFilters)].forEach(card=>{if(card?.name&&!seen.has(card.name)){seen.add(card.name);unique.push(card);}});
  const n=unique.length,start=imageOffset%n;
  const picks=[];for(let i=0;i<Math.min(10,n);i++)picks.push(unique[(start+i)%n]);
  imageGrid.innerHTML=picks.map(card=>{const img=imageFor(jaMap().get(card.name)||card),name=displayName(card.name);return `<button type="button" class="tracker-image-card" data-pick="${card.name.replace(/"/g,'&quot;')}">${img?`<img src="${img}" alt="${name}" loading="lazy" decoding="async">`:''}<strong>${name}</strong><small>${roleFor(card)} / ${Number(card.cmc||0)} mana</small></button>`;}).join('');
};
const renderPicked=()=>{pickedCount.textContent=picked.length;if(!picked.length){pickedEl.innerHTML='<span class="limited-series-note">Search for cards to add to your pool.</span>';return;}pickedEl.innerHTML=picked.map((n,i)=>`<span class="tracker-chip">${displayName(n)} <button data-remove="${i}">×</button></span>`).join('');};
const renderSearch=()=>{const q=search.value.trim().toLowerCase();if(!q){results.innerHTML='';return;}const jm=jaMap(),matches=[];for(const c of cards){if(!matchesFilters(c))continue;const j=jm.get(c.name),ja=(j?.printed_name||'').toLowerCase(),en=c.name.toLowerCase();if(ja.includes(q)||en.includes(q)){matches.push(c);if(matches.length>=10)break;}}results.innerHTML=matches.length?matches.map(c=>`<div class="tracker-result"><span>${displayName(c.name)}<small>${c.name}</small></span><button class="tracker-add" data-pick="${c.name.replace(/"/g,'&quot;')}">+ Pick</button></div>`).join(''):'<span class="limited-series-note">No matching cards found.</span>';};
const renderAll=()=>{syncStage();renderColors();renderCurve();renderRecommendations();renderImagePicker();renderPicked();renderSearch();savePicked();};
document.addEventListener('click',e=>{const a=e.target.closest('[data-pick]');if(a){picked.push(a.dataset.pick);renderAll();return;}const r=e.target.closest('[data-remove]');if(r){picked.splice(Number(r.dataset.remove),1);renderAll();}});
search.addEventListener('input',renderSearch);[colorFilter,manaFilter].filter(Boolean).forEach(el=>el.addEventListener('change',()=>{imageOffset=0;renderImagePicker();renderSearch();}));if(filterReset)filterReset.addEventListener('click',()=>{if(colorFilter)colorFilter.value='ALL';if(manaFilter)manaFilter.value='ALL';imageOffset=0;renderImagePicker();renderSearch();});if(refreshCards)refreshCards.addEventListener('click',()=>{imageOffset+=10;renderImagePicker();});reset.addEventListener('click',()=>{picked=[];renderAll();});autoEl.addEventListener('change',renderAll);packEl.addEventListener('input',renderAll);pickEl.addEventListener('input',renderAll);archSel.addEventListener('change',()=>{imageOffset=0;fetchData().catch(()=>{imageGrid.textContent='Unable to load card data. Change the set to retry.'});});setSel.addEventListener('change',()=>{imageOffset=0;loadPicked();fetchData().catch(()=>{imageGrid.textContent='Unable to load card data. Change the set to retry.'});});
const p=new URLSearchParams(location.search);if(p.get('set'))setSel.value=p.get('set');if(p.get('arch'))archSel.value=p.get('arch').toUpperCase();loadPicked();fetchData().catch(()=>{imageGrid.textContent='Unable to load card data. Change the set to retry.'});
})();
(()=>{const s=document.createElement('script');s.src='limited-tracker-synergy.js?v=20261005-en1';s.defer=true;document.body.appendChild(s);})();

(()=>{const s=document.createElement('script');s.src='limited-tracker-pack.js?v=20261005-en1';s.defer=true;document.body.appendChild(s);})();
