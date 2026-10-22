(()=>{'use strict';
const slots=[...document.querySelectorAll('.magsta-static-card[data-card-name]')];
if(!slots.length)return;
const knownEnglish={
 'コーリ鋼の短刀':'Cori-Steel Cutter',
 'ウギンの迷宮':"Ugin's Labyrinth"
};
const namedImage=name=>'https://api.scryfall.com/cards/named?exact='+encodeURIComponent(name)+'&format=image&version=normal';
const searchUrl=name=>'https://api.scryfall.com/cards/search?q='+encodeURIComponent('!"'+name+'"');
async function findImage(name){
 const candidates=[name,knownEnglish[name]].filter(Boolean);
 for(const term of candidates){
  try{
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),7000);
   let r;
   try{r=await fetch('https://api.scryfall.com/cards/named?fuzzy='+encodeURIComponent(term),{signal:controller.signal});}
   finally{clearTimeout(timer);}
   if(!r.ok)continue;
   const c=await r.json();
   const uri=c.image_uris?.normal||c.card_faces?.find(f=>f.image_uris)?.image_uris?.normal;
   if(uri)return uri;
  }catch{}
 }
 return '';
}
function showImage(media,url,name,onFailure){
 const img=new Image();
 img.alt='《'+name+'》のカード画像';
 img.width=244;img.height=340;
 img.decoding='async';
 // Image must start downloading now; do not use lazy with an application timeout.
 img.loading='eager';
 img.onload=()=>media.replaceChildren(img);
 img.onerror=()=>onFailure();
 img.src=url;
}
function showFallback(media,name){
 const english=knownEnglish[name];
 if(english){
  showImage(media,namedImage(english),name,()=>{
   media.textContent='画像を取得できませんでした。下のカード検索から確認してください。';
  });
 }else{
  media.textContent='画像を取得できませんでした。下のカード検索から確認してください。';
 }
}
for(const slot of slots){
 const name=slot.dataset.cardName;
 const media=slot.querySelector('.magsta-static-card-media');
 if(!name||!media)continue;
 // Known names can render through the image endpoint without a preceding JSON fetch.
 if(knownEnglish[name]){
  showImage(media,namedImage(knownEnglish[name]),name,async()=>{
   const url=await findImage(name);
   if(url)showImage(media,url,name,()=>showFallback(media,name));
   else showFallback(media,name);
  });
 }else{
  findImage(name).then(url=>{
   if(url)showImage(media,url,name,()=>showFallback(media,name));
   else showFallback(media,name);
  });
 }
}
})();
