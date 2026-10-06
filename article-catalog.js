(()=>{'use strict';
const INDEX_URL='article-index.json';
const stamp=Math.floor(Date.now()/600000);
const esc=v=>String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const date=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).replaceAll('/','.');};
async function load(){
 const r=await fetch(INDEX_URL+'?v='+stamp,{signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Error('article index');
 const data=await r.json();
 return Array.isArray(data.items)?data.items:[];
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
 list.replaceChildren(...cards,...compact);
 document.dispatchEvent(new CustomEvent('magsta:article-index-rendered'));
}
function renderHome(items){
 if(!items.length)return;
 const latest=items[0],second=items[1];
 const story=document.querySelector('.feature-story');
 if(story){
  const tag=story.querySelector('.tag'),h1=story.querySelector('h1'),p=story.querySelector('p'),link=story.querySelector('.button.primary'),small=story.querySelector('small');
  if(tag){tag.textContent=latest.label||'最新記事';tag.className='tag '+(latest.category||'news');}
  if(h1)h1.textContent=latest.title;
  if(p)p.textContent=latest.lead||latest.desc||'';
  if(link)link.href=latest.path;
  if(small)small.textContent=(date(latest.published)||'更新')+' / 犬居';
 }
 const side=document.querySelector('.feature-side article');
 if(side&&second){
  const tag=side.querySelector('.tag'),h2=side.querySelector('h2 a'),p=side.querySelector('p'),small=side.querySelector('small');
  if(tag){tag.textContent=second.label||'記事';tag.className='tag '+(second.category||'news');}
  if(h2){h2.textContent=second.title;h2.href=second.path;}
  if(p)p.textContent=second.desc||second.lead||'';
  if(small)small.textContent=date(second.published);
 }
}
load().then(items=>{renderArticles(items);renderHome(items);}).catch(()=>{});
})();