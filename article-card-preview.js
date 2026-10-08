(()=>{'use strict';
const body=document.querySelector('.article-body');if(!body)return;
const API='https://api.scryfall.com';
const CACHE_PREFIX='magsta-article-card-v1:';
const TTL=7*24*60*60*1000;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let lastApi=0;
async function api(url){
  const wait=Math.max(0,120-(Date.now()-lastApi));if(wait)await sleep(wait);
  lastApi=Date.now();
  const r=await fetch(url,{signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error('card');
  return r.json();
}
function cardImage(card){
  return card?.image_uris?.normal||card?.card_faces?.find(f=>f.image_uris)?.image_uris?.normal||'';
}
function cardText(card){
  if(card?.printed_text)return card.printed_text;
  if(card?.oracle_text)return card.oracle_text;
  if(Array.isArray(card?.card_faces))return card.card_faces.map(f=>f.printed_text||f.oracle_text||'').filter(Boolean).join('\n\n');
  return '';
}
function cardType(card){
  if(card?.printed_type_line)return card.printed_type_line;
  if(card?.type_line)return card.type_line;
  return '';
}
function readCache(name){
  try{const v=JSON.parse(localStorage.getItem(CACHE_PREFIX+name)||'null');return v&&Date.now()-v.at<TTL?v.card:null;}catch{return null;}
}
function writeCache(name,card){try{localStorage.setItem(CACHE_PREFIX+name,JSON.stringify({at:Date.now(),card}));}catch{}}
async function findCard(name){
  const cached=readCache(name);if(cached)return cached;
  let card=null;
  try{
    const result=await api(API+'/cards/search?q='+encodeURIComponent('name:"'+name+'" lang:ja')+'&unique=prints');
    card=result?.data?.[0]||null;
  }catch{}
  if(!card){
    try{card=await api(API+'/cards/named?fuzzy='+encodeURIComponent(name));}catch{}
  }
  if(!card){
    try{const result=await api(API+'/cards/search?q='+encodeURIComponent('"'+name+'"')+'&unique=cards');card=result?.data?.[0]||null;}catch{}
  }
  if(!card)throw Error('not-found');
  writeCache(name,card);
  return card;
}
const dialog=document.createElement('dialog');
dialog.className='article-card-dialog';
dialog.innerHTML='<button type="button" class="article-card-close" aria-label="閉じる">×</button><div class="article-card-dialog-inner"><div class="article-card-visual"></div><div class="article-card-info"><span class="section-kicker">CARD INFO</span><h2>カード情報</h2><p class="article-card-status" role="status">読み込み中…</p><div class="article-card-details" hidden><h3></h3><p class="article-card-type"></p><p class="article-card-text"></p><a class="article-card-scryfall" target="_blank" rel="noopener noreferrer">Scryfallで詳しく見る ↗</a></div></div></div>';
document.body.append(dialog);
const visual=dialog.querySelector('.article-card-visual');
const status=dialog.querySelector('.article-card-status');
const details=dialog.querySelector('.article-card-details');
const nameNode=details.querySelector('h3');
const typeNode=details.querySelector('.article-card-type');
const textNode=details.querySelector('.article-card-text');
const scryfall=details.querySelector('.article-card-scryfall');
dialog.querySelector('.article-card-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
async function openCard(name){
  dialog.showModal();
  visual.replaceChildren();
  details.hidden=true;
  status.hidden=false;
  status.textContent='《'+name+'》を読み込んでいます…';
  try{
    const card=await findCard(name);
    const imgUrl=cardImage(card);
    if(imgUrl){
      const img=document.createElement('img');
      img.src=imgUrl;img.alt=(card.printed_name||card.name||name)+'のカード画像';
      img.loading='eager';img.decoding='async';
      visual.replaceChildren(img);
    }else{
      visual.textContent='カード画像はありません。';
    }
    nameNode.textContent=card.printed_name||card.name||name;
    typeNode.textContent=cardType(card);
    textNode.textContent=cardText(card)||'カードテキストを取得できませんでした。';
    scryfall.href=card.scryfall_uri||('https://scryfall.com/search?q='+encodeURIComponent(name));
    details.hidden=false;status.hidden=true;
  }catch{
    status.textContent='カード情報を取得できませんでした。カード名をご確認ください。';
  }
}
function enhance(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
    acceptNode(node){
      if(!node.nodeValue||!node.nodeValue.includes('《'))return NodeFilter.FILTER_REJECT;
      const p=node.parentElement;
      if(!p||p.closest('a,button,script,style,code,pre,.article-card-link'))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  const re=/《([^》]{1,80})》/g;
  for(const node of nodes){
    const text=node.nodeValue;let m,last=0;const frag=document.createDocumentFragment();let changed=false;
    while((m=re.exec(text))){
      changed=true;
      if(m.index>last)frag.append(document.createTextNode(text.slice(last,m.index)));
      const b=document.createElement('button');
      b.type='button';b.className='article-card-link';b.textContent='《'+m[1]+'》';
      b.setAttribute('aria-label',m[1]+'のカード情報を見る');
      b.addEventListener('click',()=>openCard(m[1].trim()));
      frag.append(b);last=re.lastIndex;
    }
    if(!changed)continue;
    if(last<text.length)frag.append(document.createTextNode(text.slice(last)));
    node.replaceWith(frag);
  }
}
enhance(body);
// Show an image next to the first occurrence of each named card in article content.
const seen=new Set();
const buttons=[...body.querySelectorAll('.article-card-link')];
const inlineButtons=buttons.filter(b=>{
  const name=b.textContent.replace(/^《|》$/g,'').trim();
  if(seen.has(name))return false;
  seen.add(name);return true;
});
const imageObserver='IntersectionObserver' in window?new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){imageObserver.unobserve(entry.target);loadInline(entry.target);}});
},{rootMargin:'350px'}):null;
async function loadInline(figure){
  const name=figure.dataset.cardName;
  try{
    const card=await findCard(name);
    const src=cardImage(card);
    if(!src)throw Error('no-image');
    const img=document.createElement('img');
    img.src=src;img.alt='《'+name+'》のカード画像';img.loading='lazy';img.decoding='async';
    img.width=244;img.height=340;
    figure.querySelector('.article-card-inline-image').replaceChildren(img);
    figure.hidden=false;
  }catch{
    figure.querySelector('.article-card-inline-image').textContent='画像を取得できませんでした';
    const link=document.createElement('a');link.href='https://scryfall.com/search?q='+encodeURIComponent(name);link.target='_blank';link.rel='noopener noreferrer';link.textContent='カードを検索する ↗';figure.append(link);
  }
}
inlineButtons.forEach(button=>{
  const name=button.textContent.slice(1,-1).trim();
  const figure=document.createElement('figure');
  figure.className='article-card-inline';figure.dataset.cardName=name;
  figure.innerHTML='<div class="article-card-inline-image" role="status">カード画像を読み込み中…</div><figcaption></figcaption>';
  figure.querySelector('figcaption').textContent='《'+name+'》';
  const heading=button.closest('h2,h3');
  if(heading){heading.insertAdjacentElement('afterend',figure);}
  else{const paragraph=button.closest('p,li');if(paragraph?.parentElement){paragraph.insertAdjacentElement('afterend',figure);}else return;}
  // Start immediately: a lazy observer can leave blank cards on cached pages.
  loadInline(figure);
});
})();