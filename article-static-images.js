(()=>{'use strict';
const slots=[...document.querySelectorAll('.magsta-static-card[data-card-name]')];if(!slots.length)return;
const api='https://api.scryfall.com/cards/search?q=';
async function fetchCard(name){
 const queries=['name:"'+name+'" lang:ja','"'+name+'"'];
 for(const q of queries){
  try{const r=await fetch(api+encodeURIComponent(q),{headers:{Accept:'application/json'}});if(!r.ok)continue;
   const json=await r.json();const card=json.data?.[0];if(card)return card;
  }catch(e){}
 }
 return null;
}
(async()=>{
 for(const slot of slots){
  const name=slot.dataset.cardName,media=slot.querySelector('.magsta-static-card-media');
  try{
   const card=await fetchCard(name);
   const src=card?.image_uris?.normal||card?.card_faces?.find(f=>f.image_uris)?.image_uris?.normal;
   if(!src)throw new Error('image not found');
   const img=new Image();img.alt='《'+name+'》のカード画像';img.loading='eager';img.decoding='async';
   img.onload=()=>media.replaceChildren(img);
   img.onerror=()=>{media.textContent='画像の取得に失敗しました。下のカード検索から確認してください。';};
   img.src=src;
  }catch(e){media.textContent='画像データが見つかりません。下のカード検索から確認してください。';}
 }
})();
})();