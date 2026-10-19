(()=>{'use strict';
const INDEX_URL='article-index.json';
const stamp=Math.floor(Date.now()/600000);
const esc=v=>String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const date=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).replaceAll('/','.');};
async function load(){
 const [indexResult,popularityResult]=await Promise.allSettled([
  fetch(INDEX_URL+'?v='+stamp,{signal:AbortSignal.timeout(8000)}).then(async r=>{if(!r.ok)throw Error('article index');return r.json();}),
  fetch('article-popularity.json?v='+stamp,{signal:AbortSignal.timeout(8000)}).then(async r=>{if(!r.ok)throw Error('article popularity');return r.json();})
 ]);
 const indexData=indexResult.status==='fulfilled'?indexResult.value:{items:[]};
 const popularityData=popularityResult.status==='fulfilled'?popularityResult.value:{items:[]};
 return {items:Array.isArray(indexData.items)?indexData.items.slice().sort((a,b)=>(Date.parse(b.modified||b.published)||0)-(Date.parse(a.modified||a.published)||0)):[],popularity:popularityData};
}
function renderArticles(items){
 const list=document.querySelector('.article-list');
 if(!list||!items.length)return;
 const compact=[...list.querySelectorAll('.article-card.compact')];
 const cards=items.map(item=>{
  const a=document.createElement('article');
  a.className='article-card featured';
  a.dataset.articleCategory=item.category||'news';
  a.innerHTML='<div class="article-meta"><span class="tag '+esc(item.category||'news')+'">'+esc(item.label||'記事')+'</span><span>公開 '+esc(date(item.published))+'</span><span>編集：犬居</span></div><h2>'+esc(item.title)+'</h2><p>'+esc(item.desc||item.lead||'')+'</p><a class="read-more" href="'+esc(item.path)+'">記事を読む</a>';
  return a;
 });
 // Preserve articles already shipped in static HTML if the generated index is stale.
 const existing=[...list.querySelectorAll('.article-card:not(.compact)')];
 const known=new Set(cards.map(card=>card.querySelector('a.read-more')?.getAttribute('href')));
 const preserved=existing.filter(card=>{const path=card.querySelector('a.read-more')?.getAttribute('href');return path&&!known.has(path);});
 list.replaceChildren(...preserved,...cards,...compact);
 document.dispatchEvent(new CustomEvent('magsta:article-index-rendered'));
}
function renderPopular(items,popularity){
 // The homepage's editorial newest articles are authoritative.
 // Analytics rankings must never replace or hide newly published articles.
 const list=document.querySelector('.popular-articles-list');
 if(!list||!Array.isArray(popularity?.items))return;
 const existing=new Set([...list.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')));
 const byPath=new Map(items.map(item=>[item.path,item]));
 const extra=popularity.items.map(row=>byPath.get(row.path)).filter(Boolean).filter(item=>!existing.has(item.path)).slice(0,3);
 extra.forEach(item=>{
  const li=document.createElement('li'),a=document.createElement('a');
  a.href=item.path;
  const rank=document.createElement('span');rank.className='popular-rank';rank.textContent='注目';
  const body=document.createElement('div'),small=document.createElement('small'),strong=document.createElement('strong'),p=document.createElement('p');
  small.textContent=item.label||'記事';strong.textContent=item.title;p.textContent=item.desc||item.lead||'';
  body.append(small,strong,p);a.append(rank,body);li.append(a);list.append(li);
 });
}

function renderHome(items){
 // The published HTML hero is the source of truth.
 // article-index.json is generated asynchronously and may lag behind,
 // so never mutate the hero or its link based on that index.
 const story=document.querySelector('.feature-story');
 if(!story||!items.length)return;
 const link=story.querySelector('.button.primary');
 if(link?.getAttribute('href'))return;
 const latest=items[0];
 if(link&&latest.path)link.href=latest.path;
}

load().then(({items,popularity})=>{renderArticles(items);renderHome(items);renderPopular(items,popularity);}).catch(()=>{});
})();