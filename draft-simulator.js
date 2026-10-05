(()=>{'use strict';
const $=id=>document.getElementById(id);
const setSel=$('sim-set'),start=$('sim-start'),reset=$('sim-reset'),next=$('sim-next'),pack=$('sim-pack'),stage=$('sim-stage'),count=$('sim-count'),main=$('sim-main'),colorsEl=$('sim-colors'),curveEl=$('sim-curve'),pickedEl=$('sim-picked');
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
function renderAll(){renderStage();renderColors();renderCurve();renderPicked();}
function clear(){active=false;picked=[];pool=[];jaMap=new Map();pack.innerHTML='<p class="sim-loading">「ドラフト開始」を押してください。</p>';next.disabled=true;renderAll();}
start.addEventListener('click',loadPool);reset.addEventListener('click',clear);next.addEventListener('click',newPack);setSel.addEventListener('change',()=>{if(active)clear();});renderAll();
})();