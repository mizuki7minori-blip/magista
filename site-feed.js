(() => {
'use strict';
const categories={news:['ニュース',null],tournament:['大会','tournament'],card:['新カード','new-card'],deck:['デッキ・環境','deck'],matome:['コミュニティ','community'],standard:['スタンダード',/standard|スタンダード/i],modern:['モダン',/modern|モダン/i],commander:['統率者',/commander|統率者|EDH/i],pioneer:['パイオニア',/pioneer|パイオニア/i],legacy:['レガシー',/legacy|レガシー/i],pauper:['パウパー',/pauper|パウパー/i]};
const labels={news:'ニュース',tournament:'大会',deck:'デッキ・環境','new-card':'新カード',community:'コミュニティ',price:'相場'};
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
const safe=v=>{try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}};
const clean=v=>{const doc=new DOMParser().parseFromString(String(v||''),'text/html');return(doc.body.textContent||'').replace(/\s+/g,' ').trim();};
function day(value){return Number.isFinite(Date.parse(value))?new Date(value).toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo'}):'日付不明';}
function card(a,compact=false){
 const item=el('article',compact?'feed-row':'feed-card');
 item.append(el('span','tag '+a.categoryKey,labels[a.categoryKey]||'ニュース'));
 const heading=el('h3'),link=el('a','',a.title);link.href=safe(a.link);link.target='_blank';link.rel='noopener noreferrer';heading.append(link);item.append(heading);
 const description=clean(a.description);
 if(description&&description!==a.title){const details=el('details');details.append(el('summary','',a.language==='en'?'配信元の概要（英語）':'配信元の概要'));details.append(el('p','',description));item.append(details);}
 item.append(el('small','source',`${day(a.pubDate)} · ${a.sourceName||'配信元'}${a.language==='en'?' · 英語':''}`));return item;
}
function error(target,retry){target.replaceChildren();const box=el('div','feed-error','記事を取得できませんでした。');const btn=el('button','','再読み込み');btn.type='button';btn.addEventListener('click',retry);box.append(btn);target.append(box);}
async function editorialCards(limit=3, newsOnly=false){
 try{
  const r=await fetch(`articles.html?v=${Math.floor(Date.now()/600000)}`,{signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw Error('editorial');
  const doc=new DOMParser().parseFromString(await r.text(),'text/html');
  return [...doc.querySelectorAll('.article-list .article-card')].map(node=>{
   const a=node.querySelector('a.read-more'),h=node.querySelector('h2'),meta=[...node.querySelectorAll('.article-meta span')].map(x=>x.textContent.trim());
   if(!a||!h||!/^article/i.test(a.getAttribute('href')||''))return null;
   if(newsOnly&&!node.querySelector('.tag.news'))return null;
   return {title:h.textContent.trim(),link:a.getAttribute('href'),description:node.querySelector('p')?.textContent?.trim()||'',meta};
  }).filter(Boolean).slice(0,limit);
 }catch{return [];}
}
function editorialCard(a){
 const item=el('article','feed-card editorial-feed-card');
 item.append(el('span','tag deck','MAGSTA記事'));
 const h=el('h3'),link=el('a','',a.title);link.href=a.link;h.append(link);item.append(h);
 if(a.description)item.append(el('p','',a.description));
 item.append(el('small','source',a.meta.filter(Boolean).join(' · ')||'MAGSTA編集部'));
 return item;
}
const feedCacheKey='magsta-feed-cache-v1';
function validFeed(data){
 return data&&Array.isArray(data.items)&&Number.isFinite(Date.parse(data.updatedAt));
}
async function fetchFeed(){
 try{
  const response=await fetch(`rss-cache.json?v=${Math.floor(Date.now()/600000)}`,{signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('feed');
  const data=await response.json();
  if(!validFeed(data))throw Error('feed format');
  // Storage can be unavailable or full; successful network reads still work.
  try{localStorage.setItem(feedCacheKey,JSON.stringify({savedAt:Date.now(),data:{updatedAt:data.updatedAt,items:data.items.slice(0,300),staleSources:data.staleSources}}));}catch{}
  return {data,cached:false};
 }catch(networkError){
  try{
   const saved=JSON.parse(localStorage.getItem(feedCacheKey)||'null');
   const age=Date.now()-saved?.savedAt;
   const feedAge=Date.now()-Date.parse(saved?.data?.updatedAt);
   if(validFeed(saved?.data)&&age>=0&&age<=7*86400000&&feedAge>=0&&feedAge<=7*86400000){
    return {data:saved.data,cached:true};
   }
  }catch{}
  throw networkError;
 }
}
async function load(){
 const category=document.getElementById('category-rss-list');
 const latest=category?null:document.getElementById('latest-list');
 const requested=new URLSearchParams(location.search).get('cat')||'news';
 const key=Object.hasOwn(categories,requested)?requested:'news';
 if(category){
  const [name,match]=categories[key];
  document.title=`${name}｜MAGSTA`;
  document.getElementById('category-title').textContent=name;
  document.getElementById('category-description').textContent=match instanceof RegExp?'見出し・概要にフォーマット名を含む記事を表示しています。':'配信元の記事を新しい順に掲載しています。';
  document.querySelectorAll('[data-cat]').forEach(a=>{
   a.classList.toggle('active',a.dataset.cat===key);
   if(a.dataset.cat===key)a.setAttribute('aria-current','page');
   else a.removeAttribute('aria-current');
  });
 }
 let editorial=[];
 // Editorial articles do not depend on the external news feed.
 const editorialTask=(latest||(category&&key==='news'))?editorialCards(category?10:3,Boolean(category)).then(articles=>{
  editorial=articles;
  if(articles.length){
   if(latest)latest.replaceChildren(...articles.map(editorialCard));
   else {
    category.querySelector('.feed-error')?.remove();
    category.prepend(...articles.map(editorialCard));
   }
  }
  return articles;
 }):Promise.resolve([]);
 const status=document.getElementById(category?'category-status':'feed-status');
 if(status)status.textContent='記事を読み込んでいます…';
 try{
  const {data,cached}=await fetchFeed();
  const seen=new Set();const items=(data.items||[]).filter(a=>{
   if(!a||!a.title||!safe(a.link))return false;const url=new URL(a.link);url.hash='';[...url.searchParams.keys()].filter(k=>/^utm_|^(ref|fbclid|gclid)$/i.test(k)).forEach(k=>url.searchParams.delete(k));const key=url.href;if(seen.has(key))return false;seen.add(key);return true;
  }).sort((a,b)=>(Date.parse(b.pubDate)||0)-(Date.parse(a.pubDate)||0));
  let stamp=Number.isFinite(Date.parse(data.updatedAt))?new Date(data.updatedAt).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'}):'不明';
  const stale=Date.now()-Date.parse(data.updatedAt)>21600000;
  if(status){
   status.textContent=`配信データ更新：${stamp}（日本時間）${cached?' / 通信に失敗したため、前回取得したニュースを表示しています':stale?' / 更新が遅れています':''}${data.staleSources?.length?' / 一部は前回取得分':''}`;
   if(cached){
    const retry=el('button','','再読み込み');retry.type='button';
    retry.addEventListener('click',()=>{retry.disabled=true;load();});status.append(retry);
   }
  }
  if(category){
   const [,match]=categories[key];
   const selected=items.filter(a=>match instanceof RegExp?match.test(a.title+' '+clean(a.description)):match?a.categoryKey===match:a.categoryKey==='news');
   category.replaceChildren(...editorial.map(editorialCard),...selected.slice(0,40).map(a=>card(a)));
   if(!selected.length&&!editorial.length){
    editorialTask.then(articles=>{
     if(!articles.length)category.append(el('p','feed-error','このカテゴリーの記事は現在ありません。ほかのカテゴリーをご覧ください。'));
    });
   }
  }else{
   const ja=items.filter(a=>a.language==='ja'),en=items.filter(a=>a.language==='en');
   if(latest&&!editorial.length){
    const cards=ja.slice(0,3).map(a=>card(a,false));
    latest.replaceChildren(...cards);
    if(!cards.length)latest.append(el('p','','現在、表示できる記事はありません。'));
   }
   for(const [id,list,count] of [['feed-ja',ja,8],['feed-en',en,8]]){const target=document.getElementById(id);if(target){target.replaceChildren(...list.slice(0,count).map(a=>card(a,true)));if(!list.length)target.append(el('p','','現在、表示できる記事はありません。'));}}
  }
 }catch{
  await editorialTask;
  if(status)status.textContent=editorial.length?'ニュース配信データを読み込めませんでした。MAGSTAの編集記事は表示しています。':'配信データを読み込めませんでした。';
  for(const id of category?['category-rss-list']:['latest-list','feed-ja','feed-en']){
   if((id==='latest-list'||id==='category-rss-list')&&editorial.length)continue;
   const target=document.getElementById(id);if(target)error(target,load);
  }
 }
}
load();
})();
