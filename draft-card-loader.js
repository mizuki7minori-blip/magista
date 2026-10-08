/* Complete responses only; cancelled sessions never populate the cache. */
(function(root){'use strict';
const cache=new Map(),TTL=24*60*60*1000;
const abortError=()=>Object.assign(new Error('Cancelled'),{name:'AbortError'});
const check=signal=>{if(signal?.aborted)throw abortError();};
function pause(ms,signal){return new Promise((resolve,reject)=>{
 check(signal);const cancel=()=>{clearTimeout(timer);reject(abortError());};
 const timer=setTimeout(()=>{signal?.removeEventListener('abort',cancel);resolve();},ms);
 signal?.addEventListener('abort',cancel,{once:true});
});}
async function json(url,{signal,timeout=15000,retries=2,cache:cacheMode='default'}={}){
 for(let attempt=0;;attempt++){
  check(signal);const controller=new AbortController();
  const cancel=()=>controller.abort();signal?.addEventListener('abort',cancel,{once:true});
  const timer=setTimeout(()=>controller.abort(),timeout);
  let retryDelay=250*(attempt+1);
  try{
   const response=await fetch(url,{signal:controller.signal,cache:cacheMode});
   if(!response.ok){
    const error=Object.assign(new Error('HTTP '+response.status),{status:response.status,retryable:response.status===429||response.status>=500});
    const seconds=Number(response.headers?.get('Retry-After'));
    if(seconds>0)retryDelay=Math.min(2000,seconds*1000);
    throw error;
   }
   const data=await response.json();check(signal);return data;
  }catch(error){
   check(signal);
   if(attempt>=retries||error.retryable===false||error instanceof SyntaxError)throw error;
  }finally{
   clearTimeout(timer);signal?.removeEventListener('abort',cancel);
  }
  await pause(retryDelay,signal);
 }
}
async function paged(query,{signal}={}){
 check(signal);const saved=cache.get(query);
 if(saved&&Date.now()-saved.time<TTL)return saved.cards.slice();
 let url='https://api.scryfall.com/cards/search?q='+encodeURIComponent(query)+'&unique=cards&order=set';
 const cards=[],visited=new Set();let expectedTotal=null;
 while(url){
  check(signal);
  const parsed=new URL(url);
  if(parsed.origin!=='https://api.scryfall.com'||visited.has(url)||visited.size>=100)throw new Error('Invalid pagination');
  visited.add(url);
  let data;
  try{data=await json(url,{signal});}catch(error){if(error.status===404&&cards.length===0&&visited.size===1)return [];throw error;}
  if(!Array.isArray(data.data)||data.has_more&&!data.next_page)throw new Error('Incomplete card response');
  if(expectedTotal===null&&Number.isInteger(data.total_cards))expectedTotal=data.total_cards;
  cards.push(...data.data);
  url=data.has_more?data.next_page:null;
  if(url)await pause(100,signal);
 }
 check(signal);
 if(expectedTotal!==null&&cards.length!==expectedTotal)throw new Error('Incomplete card count');
 cache.set(query,{time:Date.now(),cards});return cards.slice();
}
const api={json,paged};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MagstaDraftCardLoader=api;
})(typeof window!=='undefined'?window:globalThis);
