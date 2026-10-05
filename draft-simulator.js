(()=>{'use strict';
const $=id=>document.getElementById(id);
const setSel=$('sim-set'),start=$('sim-start'),reset=$('sim-reset'),next=$('sim-next'),pack=$('sim-pack'),stage=$('sim-stage'),count=$('sim-count'),main=$('sim-main'),colorsEl=$('sim-colors'),curveEl=$('sim-curve'),pickedEl=$('sim-picked'),scoreBox=$('sim-score'),scoreTotal=$('sim-score-total'),scoreGrade=$('sim-score-grade'),scoreGrid=$('sim-score-grid'),scoreFeedback=$('sim-score-feedback');
if(!setSel)return;
const colorNames={W:'白',U:'青',B:'黒',R:'赤',G:'緑'};
let pool=[],jaMap=new Map(),picked=[],active=false,loading=false;
const imgOf=c=>c?.image_uris?.normal||c?.card_faces?.[0]?.image_uris?.normal||'';
const displayName=c=>jaMap.get(c.name)?.printed_name||c.printed_name||c.name;
const keyOf=c=>c.oracle_id||c.name;
const fetchPaged=async q=>{let url='https://api.scryfall.com/cards/search?q='+encodeURIComponent(q)+'&unique=cards&order=set',out=[],n=0;while(url&&n<5){const r=await fetch(url);if(!r.ok)break;const d=await r.json();out.push(...(d.data||[]));url=d.has_more?d.next_page:'';n++;}return out;};
async function loadPool(){loading=true;pack.innerHTML='<p class="sim-loading">カードプールを読み込み中です…</p>';start.disabled=true;try{const set=setSel.value;const [eng,ja]=await Promise.all([fetchPaged('set:'+set+' game:paper'),fetchPaged('set:'+set+' lang:ja game:paper')]);pool=eng.filter(c=>!String(c.type_line||'').toLowerCase().includes('token'));jaMap=new Map(ja.map(c=>[c.name,c]));if(!pool.length)throw new Error('empty');active=true;picked=[];renderAll();newPack();}catch(e){pack.innerHTML='<p class="sim-loading">カードを取得できませんでした。もう一度お試しください。</p>';active=false;}finally{loading=false;start.disabled=false;}}
function sample(n){const source=[...pool],out=[];while(source.length&&out.length<n){const i=Math.floor(Math.random()*source.length);out.push(source.splice(i,1)[0]);}return out;}
function newPack(){if(!active||loading)return;if(picked.length>=42){active=false;next.disabled=true;pack.innerHTML='<div class="sim-loading"><strong>ドラフト完了！</strong><br>色配分とマナカーブを確認してください。</div>';renderAll();return;}const cards=sample(14);pack.innerHTML=cards.map((c,i)=>'<button type="button" class="sim-pick" data-i="'+i+'">'+(imgOf(jaMap.get(c.name)||c)?'<img src="'+imgOf(jaMap.get(c.name)||c)+'" loading="lazy" alt="'+displayName(c).replace(/"/g,'&quot;')+'">':'')+'<strong>'+displayName(c)+'</strong><small>'+Math.round(Number(c.cmc||0))+'マナ / '+((c.colors||[]).map(x=>colorNames[x]||x).join('')||'無色')+'</small></button>').join('');pack.querySelectorAll('.sim-pick').forEach(b=>b.addEventListener('click',()=>pickCard(cards[Number(b.dataset.i)])));next.disabled=false;renderStage();}
function pickCard(card){if(!card||!active)return;picked.push(card);renderAll();newPack();}
function renderStage(){const n=picked.length+1,p=Math.min(3,Math.floor((n-1)/14)+1),k=((n-1)%14)+1;stage.textContent=picked.length>=42?'完了':'次：'+p+'-'+k;count.textContent=picked.length+' / 42ピック';main.textContent='メイン候補 '+Math.min(23,picked.length)+'枚';}
function renderColors(){const c={W:0,U:0,B:0,R:0,G:0};picked.forEach(x=>(x.colors||[]).forEach(k=>{if(c[k]!==undefined)c[k]++;}));colorsEl.innerHTML=Object.entries(c).map(([k,v])=>'<div><span>'+colorNames[k]+'</span><strong>'+v+'</strong></div>').join('');}
function renderCurve(){const b={1:0,2:0,3:0,4:0,5:0,'6+':0};picked.forEach(c=>{if(String(c.type_line||'').toLowerCase().includes('land'))return;const mv=Math.max(1,Math.floor(Number(c.cmc||0)));const k=mv>=6?'6+':String(mv);if(b[k]!==undefined)b[k]++;});curveEl.innerHTML=Object.entries(b).map(([k,v])=>'<div><span>'+k+'マナ</span><strong>'+v+'</strong></div>').join('');}
function renderPicked(){pickedEl.innerHTML=picked.length?picked.map(c=>'<span class="sim-chip">'+displayName(c)+'</span>').join(''):'<span class="sim-note">まだピックしていません。</span>';}
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
function renderAll(){renderStage();renderColors();renderCurve();renderPicked();finalScore();}
function clear(){active=false;picked=[];pool=[];jaMap=new Map();pack.innerHTML='<p class="sim-loading">「ドラフト開始」を押してください。</p>';next.disabled=true;if(scoreBox)scoreBox.hidden=true;renderAll();}
start.addEventListener('click',loadPool);reset.addEventListener('click',clear);next.addEventListener('click',newPack);setSel.addEventListener('change',()=>{if(active)clear();});renderAll();
})();