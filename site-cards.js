(() => {
'use strict';
const grid=document.getElementById('pickup-grid');if(!grid)return;
const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
const dialog=node('dialog','card-dialog');dialog.setAttribute('aria-label','カード画像の拡大');const close=node('button','','閉じる');close.type='button';const large=node('img');dialog.append(close,large);document.body.append(dialog);close.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
function imageURL(card){const value=card.image_uris?.normal||card.card_faces?.find(f=>f.image_uris)?.image_uris?.normal||'';try{return new URL(value).protocol==='https:'?value:'';}catch{return '';}}
async function request(url,fresh=false){const response=await fetch(url,{signal:AbortSignal.timeout(10000),cache:fresh?'reload':'default'});if(!response.ok)throw Error('card');return response.json();}
async function picture(data,button,status,fresh=false){
 button.disabled=true;status.textContent='カード画像を読み込んでいます…';
 try{
  const key='magsta-card-v2:'+data.en;let card;
  try{const cached=JSON.parse(localStorage.getItem(key));if(!fresh&&cached&&Date.now()-cached.at<86400000)card=cached.card;}catch{}
  if(!card){
   try{const result=await request('https://api.scryfall.com/cards/search?q='+encodeURIComponent('!"'+data.en+'" lang:ja')+'&unique=prints',fresh);card=result.data?.[0];}catch{}
   if(!card)card=await request('https://api.scryfall.com/cards/named?exact='+encodeURIComponent(data.en),fresh);
   try{localStorage.setItem(key,JSON.stringify({at:Date.now(),card}));}catch{}
  }
  const url=imageURL(card);if(!url)throw Error('image');const img=node('img');img.alt=data.name||data.ja||data.en;img.width=244;img.height=340;img.loading='lazy';img.decoding='async';
  img.addEventListener('load',()=>{button.disabled=false;status.textContent=(card.lang==='ja'?'日本語版':'英語版（日本語版画像なし）')+' / 画像を押すと拡大';});
  img.addEventListener('error',()=>failure(data,button,status),{once:true});img.src=url;button.replaceChildren(img);button.onclick=()=>{large.src=url;large.alt=img.alt;dialog.showModal();};
 }catch{failure(data,button,status);}
}
function failure(data,button,status){button.replaceChildren(node('span','','画像を再読み込み'));button.disabled=false;button.onclick=()=>picture(data,button,status);status.textContent='画像を取得できませんでした。再読み込みできます。';}
const refresh=document.getElementById('pickup-refresh');
const refreshStatus=document.getElementById('pickup-refresh-status');
let busy=false,loaded=false;
async function load(fresh=false){
 if(busy)return;
 busy=true;grid.setAttribute('aria-busy','true');
 if(refresh){refresh.disabled=true;refresh.textContent=fresh?'更新中…':'読み込み中…';}
 if(refreshStatus)refreshStatus.hidden=!fresh;
 if(refreshStatus)refreshStatus.textContent=fresh?'最新のピックアップカードを取得しています…':'';
 try{
  const data=await request('pickup-data.json?v='+(fresh?Date.now():Math.floor(Date.now()/600000)),fresh);
  if(!Array.isArray(data))throw Error('data');
  const cards=data.filter(card=>card&&typeof card.en==='string'&&card.en.trim()).slice(0,3);
  if(!cards.length)throw Error('data');
  const entries=cards.map((card,i)=>{
   const item=node('article','card-pick');
   item.append(node('span','eyebrow',String(i+1).padStart(2,'0')+' / '+(card.label||'注目カード').replace(/[🏆🃏💬]/gu,'')));
   const button=node('button','card-image-button');button.type='button';
   button.setAttribute('aria-label',(card.name||card.en)+'の画像を拡大');
   const status=node('p','image-status');
   item.append(button,status,node('h3','',card.name||card.ja||card.en),node('p','',card.desc||card.reason||''));
   return {item,card,button,status};
  });
  grid.replaceChildren(...entries.map(entry=>entry.item));loaded=true;
  const date=document.querySelector('.pickup-date');
  if(date)date.textContent=cards[0].updated?cards[0].updated+' 選定':'';
  for(const entry of entries)await picture(entry.card,entry.button,entry.status,fresh);
  if(fresh&&refreshStatus)refreshStatus.textContent='最新の選定データを取得しました。画像が表示されない場合は、カードの「画像を再読み込み」を押してください。';
 }catch{
  if(refreshStatus)refreshStatus.hidden=false;
  if(!loaded)grid.replaceChildren(node('p','feed-error','注目カードを取得できませんでした。「更新」ボタンから再試行してください。'));
  if(refreshStatus)refreshStatus.textContent=loaded?'更新できませんでした。表示中のカードを残しています。もう一度お試しください。':'注目カードを取得できませんでした。もう一度お試しください。';
 }finally{
  busy=false;grid.setAttribute('aria-busy','false');
  if(refresh){refresh.disabled=false;refresh.textContent='更新';}
 }
}
if(refresh)refresh.addEventListener('click',()=>load(true));
load();
})();