(() => {
'use strict';
const grid=document.getElementById('pickup-grid');if(!grid)return;
const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
const dialog=node('dialog','card-dialog');dialog.setAttribute('aria-label','カード画像の拡大');const close=node('button','','閉じる');close.type='button';const large=node('img');dialog.append(close,large);document.body.append(dialog);close.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
function imageURL(card){const value=card.image_uris?.normal||card.card_faces?.find(f=>f.image_uris)?.image_uris?.normal||'';try{return new URL(value).protocol==='https:'?value:'';}catch{return '';}}
async function request(url){const response=await fetch(url,{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('card');return response.json();}
async function picture(data,button,status){
 button.disabled=true;status.textContent='カード画像を読み込んでいます…';
 try{
  const key='magsta-card-v2:'+data.en;let card;
  try{const cached=JSON.parse(localStorage.getItem(key));if(cached&&Date.now()-cached.at<86400000)card=cached.card;}catch{}
  if(!card){
   try{const result=await request('https://api.scryfall.com/cards/search?q='+encodeURIComponent('!"'+data.en+'" lang:ja')+'&unique=prints');card=result.data?.[0];}catch{}
   if(!card)card=await request('https://api.scryfall.com/cards/named?exact='+encodeURIComponent(data.en));
   try{localStorage.setItem(key,JSON.stringify({at:Date.now(),card}));}catch{}
  }
  const url=imageURL(card);if(!url)throw Error('image');const img=node('img');img.alt=data.name||data.ja||data.en;img.width=244;img.height=340;img.loading='lazy';img.decoding='async';
  img.addEventListener('load',()=>{button.disabled=false;status.textContent=(card.lang==='ja'?'日本語版':'英語版（日本語版画像なし）')+' / 画像を押すと拡大';});
  img.addEventListener('error',()=>failure(data,button,status),{once:true});img.src=url;button.replaceChildren(img);button.onclick=()=>{large.src=url;large.alt=img.alt;dialog.showModal();};
 }catch{failure(data,button,status);}
}
function failure(data,button,status){button.replaceChildren(node('span','','画像を再読み込み'));button.disabled=false;button.onclick=()=>picture(data,button,status);status.textContent='画像を取得できませんでした。再読み込みできます。';}
async function load(){
 try{const data=await request('pickup-data.json?v='+Math.floor(Date.now()/600000));if(!Array.isArray(data)||!data.length)throw Error('data');grid.replaceChildren();const date=document.querySelector('.pickup-date');date.textContent=data[0].updated?data[0].updated+' 選定':'';
  for(const [i,card]of data.slice(0,3).entries()){
   const item=node('article','card-pick');item.append(node('span','eyebrow',String(i+1).padStart(2,'0')+' / '+(card.label||'注目カード').replace(/[🏆🃏💬]/gu,'')));
   const button=node('button','card-image-button');button.type='button';button.setAttribute('aria-label',(card.name||card.en)+'の画像を拡大');const status=node('p','image-status');item.append(button,status,node('h3','',card.name||card.ja||card.en),node('p','',card.desc||card.reason||''));grid.append(item);await picture(card,button,status);
  }
 }catch{grid.replaceChildren(node('p','feed-error','注目カードを取得できませんでした。ページを再読み込みしてください。'));}
}
load();
})();
