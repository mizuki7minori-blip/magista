(()=>{'use strict';
const slots=[...document.querySelectorAll('.magsta-static-card[data-card-name]')];
if(!slots.length)return;
const knownEnglish={
 'コーリ鋼の短刀':'Cori-Steel Cutter',
 'ウギンの迷宮':"Ugin's Labyrinth"
};
const API='https://api.scryfall.com';
const imageOf=c=>c?.image_uris?.normal||c?.card_faces?.find(f=>f.image_uris?.normal)?.image_uris.normal||'';
const cachePrefix='magsta-static-ja-v2:';
const pending=new Map();
async function request(url){
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8000);
 try{const r=await fetch(url,{signal:ctl.signal});if(!r.ok)throw Error('scryfall');return await r.json();}
 finally{clearTimeout(timer);}
}
async function resolveCards(name){
 const cached=(()=>{try{const c=JSON.parse(localStorage.getItem(cachePrefix+name)||'null');return c&&Date.now()-c.saved<7*86400000?c:null;}catch{return null;}})();
 if(cached)return cached;
 const en=knownEnglish[name];
 let japanese='',fallback='';
 // Search language-specific printings rather than the English-default named endpoint.
 for(const term of [en,name].filter(Boolean)){
  try{
   const d=await request(API+'/cards/search?q='+encodeURIComponent('!"'+term+'" lang:ja')+'&unique=prints');
   const card=d.data?.find(c=>c.lang==='ja'&&imageOf(c));
   if(card){japanese=imageOf(card);break;}
  }catch{}
 }
 if(!japanese){
  try{const c=await request(API+'/cards/named?fuzzy='+encodeURIComponent(en||name));fallback=imageOf(c);}catch{}
 }
 const result={japanese,fallback,saved:Date.now()};
 try{localStorage.setItem(cachePrefix+name,JSON.stringify(result));}catch{}
 return result;
}
function getCard(name){
 if(!pending.has(name))pending.set(name,resolveCards(name).finally(()=>pending.delete(name)));
 return pending.get(name);
}
function render(media,url,name,onError){
 const img=new Image();img.alt='《'+name+'》のカード画像';
 img.width=244;img.height=340;img.decoding='async';img.loading='eager';
 img.onload=()=>media.replaceChildren(img);
 img.onerror=onError;
 img.src=url;
}
for(const slot of slots){
 const name=slot.dataset.cardName,media=slot.querySelector('.magsta-static-card-media');
 if(!name||!media)continue;
 getCard(name).then(({japanese,fallback})=>{
  const fail=()=>{media.textContent='画像を取得できませんでした。下のカード検索から確認してください。';};
  if(japanese)render(media,japanese,name,()=>fallback?render(media,fallback,name,fail):fail());
  else if(fallback)render(media,fallback,name,fail);
  else fail();
 }).catch(()=>{media.textContent='画像を取得できませんでした。下のカード検索から確認してください。';});
}
})();
