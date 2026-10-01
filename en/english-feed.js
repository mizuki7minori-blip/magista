(() => {
  'use strict';
  const CACHE_URL='../rss-cache.json';
  const MAX_HOME=5, MAX_ARTICLES=14;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const parseDate=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?null:d};
  const fmt=v=>{const d=parseDate(v);return d?d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}):'Date unavailable'};
  const labels={news:'NEWS',deck:'DECKS & META','new-card':'NEW CARDS',tournament:'TOURNAMENT',price:'MARKET',community:'COMMUNITY'};
  const tagClass=k=>k==='price'?'price':k==='new-card'?'card':k==='community'?'matome':'news';
  const unique=items=>Array.from(new Map(items.filter(x=>x&&x.link&&x.title).map(x=>[x.link,x])).values());
  function card(a,featured=false){
    const el=document.createElement('article');el.className=`article-card ${featured?'featured':'compact'} en-rss-card`;
    const desc=(a.description||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    el.innerHTML=`<div class="article-meta"><span class="tag ${tagClass(a.categoryKey)}">${esc(labels[a.categoryKey]||'MTG')}</span><span>${esc(fmt(a.pubDate))} / ${esc(a.sourceName||'Source')}</span></div><h3>${esc(a.title)}</h3>${desc?`<p>${esc(desc.slice(0,220))}${desc.length>220?'…':''}</p>`:''}<a class="read-more" href="${esc(a.link)}" target="_blank" rel="noopener noreferrer">Read source →</a>`;
    return el;
  }
  function renderHome(items){
    const wrap=$('en-latest-feed'); if(!wrap)return;
    wrap.replaceChildren(...items.slice(0,MAX_HOME).map((a,i)=>card(a,i===0)));
    const status=$('en-feed-status'); if(status)status.textContent=items.length?'Live English sources from the MAGSTA feed.':'No English feed items are available right now.';
  }
  function renderArticles(items){
    const wrap=$('en-article-feed'); if(!wrap)return;
    wrap.replaceChildren(...items.slice(0,MAX_ARTICLES).map(a=>card(a,false)));
    const status=$('en-article-feed-status'); if(status)status.textContent=items.length?`${Math.min(items.length,MAX_ARTICLES)} recent English-language items`:'No English feed items are available right now.';
  }
  function renderCategory(items){
    const wrap=$('en-category-feed'); if(!wrap)return;
    const key=new URLSearchParams(location.search).get('cat')||'news';
    const map={news:['news','tournament','new-card'],deck:['deck'],matome:['community'],card:['new-card'],price:['price']};
    const allowed=new Set(map[key]||['news']);
    const filtered=items.filter(a=>allowed.has(a.categoryKey));
    wrap.replaceChildren(...filtered.slice(0,MAX_ARTICLES).map(a=>card(a,false)));
    const status=$('en-category-feed-status'); if(status)status.textContent=filtered.length?`${Math.min(filtered.length,MAX_ARTICLES)} recent items in this category`:'No recent items in this category.';
  }
  async function init(){
    try{
      const r=await fetch(`${CACHE_URL}?v=${Math.floor(Date.now()/600000)}`,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const data=await r.json();
      let items=unique((data.items||[]).filter(a=>a.language==='en'));
      items.sort((a,b)=>(parseDate(b.pubDate)?.getTime()||0)-(parseDate(a.pubDate)?.getTime()||0));
      renderHome(items);renderArticles(items);renderCategory(items);
    }catch(e){console.warn('[MAGSTA EN] feed unavailable',e);['en-feed-status','en-article-feed-status','en-category-feed-status'].forEach(id=>{const el=$(id);if(el)el.textContent='English feed is temporarily unavailable.';});}
  }
  document.addEventListener('DOMContentLoaded',init);
})();
