(()=>{'use strict';
const $=id=>document.getElementById(id);
const setSel=$('sim-set'),start=$('sim-start'),reset=$('sim-reset'),next=$('sim-next'),pack=$('sim-pack'),stage=$('sim-stage'),count=$('sim-count'),main=$('sim-main'),colorsEl=$('sim-colors'),curveEl=$('sim-curve'),pickedEl=$('sim-picked'),scoreBox=$('sim-score'),scoreTotal=$('sim-score-total'),scoreGrade=$('sim-score-grade'),scoreGrid=$('sim-score-grid'),scoreFeedback=$('sim-score-feedback'),pickReview=$('sim-pick-review'),historyEl=$('sim-history'),bestWorstEl=$('sim-bestworst');
if(!setSel)return;
const colorNames={W:'白',U:'青',B:'黒',R:'赤',G:'緑'};
let pool=[],jaMap=new Map(),picked=[],pickHistory=[],rankingMap=new Map(),active=false,loading=false;
const imgOf=c=>c?.image_uris?.normal||c?.card_faces?.[0]?.image_uris?.normal||'';
const displayName=c=>jaMap.get(c.name)?.printed_name||c.printed_name||c.name;
const keyOf=c=>c.oracle_id||c.name;
const fetchPaged=async q=>{let url='https://api.scryfall.com/cards/search?q='+encodeURIComponent(q)+'&unique=cards&order=set',out=[],n=0;while(url&&n<5){const r=await fetch(url);if(!r.ok)break;const d=await r.json();out.push(...(d.data||[]));url=d.has_more?d.next_page:'';n++;}return out;};
async function loadPool(){loading=true;pack.innerHTML='<p class="sim-loading">カードプールを読み込み中です…</p>';start.disabled=true;try{const set=setSel.value;const [eng,ja,snap]=await Promise.all([fetchPaged('set:'+set+' game:paper'),fetchPaged('set:'+set+' lang:ja game:paper'),fetch('limited-ranking-data.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null)]);pool=eng.filter(c=>!String(c.type_line||'').toLowerCase().includes('token'));jaMap=new Map(ja.map(c=>[c.name,c]));rankingMap=new Map((snap?.sets?.[set]?.ranking||[]).map(x=>[x.name,Number(x.wr)||0]));if(!pool.length)throw new Error('empty');active=true;picked=[];pickHistory=[];renderAll();newPack();}catch(e){pack.innerHTML='<p class="sim-loading">カードを取得できませんでした。もう一度お試しください。</p>';active=false;}finally{loading=false;start.disabled=false;}}
function sample(n){const source=[...pool],out=[];while(source.length&&out.length<n){const i=Math.floor(Math.random()*source.length);out.push(source.splice(i,1)[0]);}return out;}
function newPack(){if(!active||loading)return;if(picked.length>=42){active=false;next.disabled=true;pack.innerHTML='<div class="sim-loading"><strong>ドラフト完了！</strong><br>色配分とマナカーブを確認してください。</div>';renderAll();return;}const cards=sample(14);pack.innerHTML=cards.map((c,i)=>'<button type="button" class="sim-pick" data-i="'+i+'">'+(imgOf(jaMap.get(c.name)||c)?'<img src="'+imgOf(jaMap.get(c.name)||c)+'" loading="lazy" alt="'+displayName(c).replace(/"/g,'&quot;')+'">':'')+'<strong>'+displayName(c)+'</strong><small>'+Math.round(Number(c.cmc||0))+'マナ / '+((c.colors||[]).map(x=>colorNames[x]||x).join('')||'無色')+'</small></button>').join('');pack.querySelectorAll('.sim-pick').forEach(b=>b.addEventListener('click',()=>pickCard(cards[Number(b.dataset.i)],cards)));next.disabled=false;renderStage();}
function currentMainColors(){const c={W:0,U:0,B:0,R:0,G:0};picked.forEach(x=>(x.colors||[]).forEach(k=>{if(c[k]!==undefined)c[k]++;}));return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,2).filter(x=>x[1]>0).map(x=>x[0]);}
function pickValue(card,packCards){const wr=rankingMap.get(card.name)||55;const wrs=packCards.map(c=>rankingMap.get(c.name)||55);const best=Math.max(...wrs);let score=70+(wr-best)*3;const colors=currentMainColors();if(picked.length>=6&&colors.length){const cc=card.colors||[];if(cc.length===0||cc.every(x=>colors.includes(x)))score+=10;else if(cc.some(x=>colors.includes(x)))score+=3;else score-=10;}if(removalLike(card))score+=4;if(Number(card.cmc||0)>=2&&Number(card.cmc||0)<=3)score+=2;score=Math.max(25,Math.min(100,Math.round(score)));return{score,wr,best};}
function pickCard(card,packCards){if(!card||!active)return;const result=pickValue(card,packCards);const pickNo=picked.length+1;pickHistory.push({pickNo,card:card.name,score:result.score,wr:result.wr,bestWr:result.best});picked.push(card);renderAll();newPack();}
function renderStage(){const n=picked.length+1,p=Math.min(3,Math.floor((n-1)/14)+1),k=((n-1)%14)+1;stage.textContent=picked.length>=42?'完了':'次：'+p+'-'+k;count.textContent=picked.length+' / 42ピック';main.textContent='メイン候補 '+Math.min(23,picked.length)+'枚';}
function renderColors(){const c={W:0,U:0,B:0,R:0,G:0};picked.forEach(x=>(x.colors||[]).forEach(k=>{if(c[k]!==undefined)c[k]++;}));colorsEl.innerHTML=Object.entries(c).map(([k,v])=>'<div><span>'+colorNames[k]+'</span><strong>'+v+'</strong></div>').join('');}
function renderCurve(){const b={1:0,2:0,3:0,4:0,5:0,'6+':0};picked.forEach(c=>{if(String(c.type_line||'').toLowerCase().includes('land'))return;const mv=Math.max(1,Math.floor(Number(c.cmc||0)));const k=mv>=6?'6+':String(mv);if(b[k]!==undefined)b[k]++;});curveEl.innerHTML=Object.entries(b).map(([k,v])=>'<div><span>'+k+'マナ</span><strong>'+v+'</strong></div>').join('');}
function renderPicked(){pickedEl.innerHTML=picked.length?picked.map(c=>'<span class="sim-chip">'+displayName(c)+'</span>').join(''):'<span class="sim-note">まだピックしていません。</span>';}
function renderHistory(){if(!pickReview||!historyEl||!bestWorstEl)return;if(!pickHistory.length){pickReview.hidden=true;return;}pickReview.hidden=false;const sorted=[...pickHistory].sort((a,b)=>b.score-a.score);const best=sorted[0],worst=sorted[sorted.length-1];bestWorstEl.innerHTML='<div><span class="section-kicker">BEST PICK</span><strong>'+displayName(pool.find(c=>c.name===best.card)||{name:best.card})+'</strong><small>'+best.pickNo+'手目 / '+best.score+'点</small></div><div><span class="section-kicker">IMPROVE</span><strong>'+displayName(pool.find(c=>c.name===worst.card)||{name:worst.card})+'</strong><small>'+worst.pickNo+'手目 / '+worst.score+'点</small></div>';historyEl.innerHTML=pickHistory.map(x=>{const cls=x.score>=85?'good':x.score>=70?'mid':'bad';const name=displayName(pool.find(c=>c.name===x.card)||{name:x.card});const diff=Math.round((x.bestWr-x.wr)*10)/10;const note=diff<=0.2?'候補内トップ級':diff<=2?'十分良い選択':diff<=5?'他にも強い候補あり':'見直し候補';return '<div class="sim-history-row"><span>'+x.pickNo+'手目</span><div><strong>'+name+'</strong><small>'+note+(rankingMap.has(x.card)?' / WR '+x.wr.toFixed(1)+'%':' / データ不足')+'</small></div><span class="sim-pick-score '+cls+'">'+x.score+'点</span></div>';}).join('');}
function removalLike(card){const t=(card.oracle_text||card.card_faces?.map(f=>f.oracle_text||'').join(' ')||'').toLowerCase();return /destroy target|exile target|counter target|deals? \\d+ damage to target|gets -\\d+\\/-\\d+|fight target/.test(t);}
function advantageLike(card){const t=(card.oracle_text||card.card_faces?.map(f=>f.oracle_text||'').join(' ')||'').toLowerCase();return /draw (a|two|three|\\d+) card|draw cards|return .* from your graveyard|create .* token/.test(t);}
function finalScore(){
  if(picked.length<42){if(scoreBox)scoreBox.hidden=true;return;}
  const counts={W:0,U:0,B:0,R:0,G:0};
  picked.forEach(c=>(c.colors||[]).forEach(k=>{if(counts[k]!==undefined)counts[k]++;}));
  const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0]);
  const playable=picked.filter(c=>{const cols=c.colors||[];return cols.length===0||cols.every(x=>top.includes(x));});
  const cohesion=Math.round(30*Math.min(1,playable.length/34));
  const low=playable.filter(c=>!String(c.type_line||'').toLowerCase().includes('land')&&Number(c.cmc||0)>=1&&Number(c.cmc||0)<=3).length;
  const curve=Math.round(20*Math.min(1,low/14));
  const creatures=playable.filter(c=>String(c.type_line||'').toLowerCase().includes('creature')).length;
  const creatureScore=Math.round(20*Math.max(0,1-Math.abs(creatures-17)/12));
  const interaction=playable.filter(removalLike).length;
  const interactionScore=Math.round(20*Math.min(1,interaction/5));
  const value=playable.filter(advantageLike).length+playable.filter(c=>String(c.type_line||'').toLowerCase().includes('creature')&&Number(c.cmc||0)>=5).length;
  const valueScore=Math.round(10*Math.min(1,value/7));
  const total=Math.max(0,Math.min(100,cohesion+curve+creatureScore+interactionScore+valueScore));
  const grade=total>=90?'S':total>=80?'A':total>=70?'B':total>=60?'C':'D';
  const items=[['色のまとまり',cohesion,30,playable.length+' / 42枚が主2色内'],['序盤の動き',curve,20,'1〜3マナ '+low+'枚'],['クリーチャー',creatureScore,20,creatures+'枚'],['除去・干渉',interactionScore,20,interaction+'枚'],['継戦力',valueScore,10,value+'枚']];
  scoreBox.hidden=false;scoreTotal.textContent=String(total);scoreGrade.textContent='評価 '+grade;
  scoreGrid.innerHTML=items.map(x=>'<div class="sim-score-item"><span>'+x[0]+'</span><strong>'+x[1]+' / '+x[2]+'</strong><small>'+x[3]+'</small></div>').join('');
  const notes=[];
  if(cohesion<24)notes.push('色が散っています。1パック後半〜2パック目で主色2色を絞ると改善します。');
  else notes.push('色のまとまりは良好です。主色2色にしっかり寄せられています。');
  if(low<12)notes.push('2〜3マナ域をもう少し早めに確保すると、デッキが安定します。');
  if(creatures<14)notes.push('クリーチャーが少なめです。盤面を作れるカードを優先すると改善します。');
  if(interaction<4)notes.push('除去・干渉が少なめです。中盤以降は相手の強いカードに触れる手段を確保したいです。');
  if(value<5)notes.push('カード補充やフィニッシャーが少なめです。長期戦用の価値カードを少し増やすと良いです。');
  if(notes.length===1&&total>=85)notes.push('大きな弱点はありません。あとは40枚デッキに絞り込む段階です。');
  scoreFeedback.innerHTML=notes.map(x=>'<li>'+x+'</li>').join('');
}
function renderAll(){renderStage();renderColors();renderCurve();renderPicked();renderHistory();finalScore();}
function clear(){active=false;picked=[];pickHistory=[];pool=[];jaMap=new Map();rankingMap=new Map();pack.innerHTML='<p class="sim-loading">「ドラフト開始」を押してください。</p>';next.disabled=true;if(scoreBox)scoreBox.hidden=true;renderAll();}
start.addEventListener('click',loadPool);reset.addEventListener('click',clear);next.addEventListener('click',newPack);setSel.addEventListener('change',()=>{if(active)clear();});renderAll();
})();