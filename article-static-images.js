(()=>{'use strict';
const slots=[...document.querySelectorAll('.magsta-static-card[data-card-name]')];if(!slots.length)return;
const api='https://api.scryfall.com/cards/search?q=';
async function fetchCard(name){
 const queries=['name:"'+name+'" lang:ja','"'+name+'"'];
 for(const q of queries){
  try{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),6500);let r;try{r=await fetch(api+encodeURIComponent(q),{headers:{Accept:'application/json'},signal:controller.signal});}finally{clearTimeout(timer);}if(!r.ok)continue;
   const json=await r.json();const card=json.data?.[0];if(card)return card;
  }catch(e){}
 }
 return null;
}
(async()=>{
 await Promise.allSettled(slots.map(async slot=>{
  const name=slot.dataset.cardName,media=slot.querySelector('.magsta-static-card-media');
  try{
   const card=await fetchCard(name);
   const src=card?.image_uris?.normal||card?.card_faces?.find(f=>f.image_uris)?.image_uris?.normal;
   if(!src)throw new Error('image not found');
   const img=new Image();img.alt='《'+name+'》のカード画像';img.loading='lazy';img.decoding='async';
   img.onload=()=>media.replaceChildren(img);
   img.onerror=()=>{media.textContent='画像の取得に失敗しました。下のカード検索から確認してください。';};
   img.src=src;
   // Lazy-loaded images can legitimately remain incomplete while off screen.
   // Never mistake that for a network failure or cancel their load handlers.
  }catch(e){media.textContent='画像データが見つかりません。下のカード検索から確認してください。';}
 }));
})();
})();