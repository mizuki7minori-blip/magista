(() => {
'use strict';
const cached=new Map(),pending=new Map();
let startQueue=Promise.resolve();
async function apiSlot(){
 const slot=startQueue;
 startQueue=slot.then(()=>new Promise(resolve=>setTimeout(resolve,120)));
 await slot;
}
function json(url){
 const entry=cached.get(url);
 if(entry&&Date.now()-entry.at<(url.startsWith('https:')?86400000:600000))return Promise.resolve(entry.data);
 if(pending.has(url))return pending.get(url);
 const task=(async()=>{
  if(url.startsWith('https://api.scryfall.com/'))await apiSlot();
  const response=await fetch(url,{signal:AbortSignal.timeout(12000)});
  if(!response.ok){const error=new Error('Data request failed: '+response.status);error.status=response.status;throw error;}
  const data=await response.json();cached.set(url,{at:Date.now(),data});return data;
 })();
 pending.set(url,task);
 task.then(()=>pending.delete(url),()=>pending.delete(url));
 return task;
}
const queryCache=new Map();
function cardsForQuery(query){
 if(queryCache.has(query))return queryCache.get(query);
 const task=(async()=>{
  let url='https://api.scryfall.com/cards/search?q='+encodeURIComponent(query)+'&unique=cards&order=set';
  const cards=[];
  for(let page=0;url&&page<5;page++){
   const data=await json(url);cards.push(...(data.data||[]));
   url=data.has_more?data.next_page:'';
  }
  return cards;
 })();
 queryCache.set(query,task);
 task.catch(()=>queryCache.delete(query));
 return task;
}
window.MAGSTAEnglishTools={json,cardsForQuery};
})();