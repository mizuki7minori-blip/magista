const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const response=data=>({ok:true,status:200,json:async()=>data});
const failure=status=>({ok:false,status,headers:{get:()=>null},json:async()=>({})});
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function runtime(fetch){
 const elements=new Map();
 function element(id){if(!elements.has(id))elements.set(id,{value:id==='sim-set'?'tmt':'',innerHTML:'',textContent:'',style:{},events:{},hidden:false,disabled:false,addEventListener(event,fn){this.events[event]=fn;},querySelectorAll(){return [];}});return elements.get(id);}
 const sandbox={document:{getElementById:element},localStorage:{getItem:()=>null,setItem(){}},console,Math,Date,AbortController,URL,setTimeout,clearTimeout,fetch};
 sandbox.window=sandbox;vm.createContext(sandbox);
 for(const path of ['draft-mana.js','draft-card-loader.js'])vm.runInContext(fs.readFileSync(require.resolve('../'+path),'utf8'),sandbox);
 let controller=fs.readFileSync(require.resolve('../draft-simulator.js'),'utf8');
 controller=controller.replace("start.addEventListener('click',loadPool);", "window.testDraft={loadPool,clear,read:()=>({active,loading,pool,jaMap,currentPack,picked}),pick:()=>pickCard(currentPack[0],currentPack)};start.addEventListener('click',loadPool);");
 vm.runInContext(controller,sandbox);return {sandbox,element,api:sandbox.testDraft,loader:sandbox.MagstaDraftCardLoader};
}
const cards=tag=>Array.from({length:80},(_,i)=>({name:tag+i,oracle_id:tag+i,mana_cost:'{1}{U}',cmc:2,colors:['U'],type_line:'Creature',power:'2',toughness:'2',rarity:['common','common','uncommon','rare','mythic'][i%5]}));
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 // More than five pages, complete-cache reuse and failed-page cache exclusion.
 let calls=0;
 const paging=runtime(async url=>{calls++;const page=Number(new URL(url).searchParams.get('page')||1);return response({data:[{name:'Page '+page}],has_more:page<6,next_page:'https://api.scryfall.com/cards/search?page='+(page+1)});});
 assert.equal((await paging.loader.paged('six-pages')).length,6);assert.equal(calls,6);
 assert.equal((await paging.loader.paged('six-pages')).length,6);assert.equal(calls,6);
 let fail=true,partialCalls=0;
 const partial=runtime(async url=>{partialCalls++;return url.includes('page=2')?(fail?failure(503):response({data:[{name:'Second'}],has_more:false})):response({data:[{name:'First'}],has_more:true,next_page:'https://api.scryfall.com/cards/search?page=2'});});
 await assert.rejects(partial.loader.paged('partial'),/503/);assert.equal(partialCalls,4);
 fail=false;assert.equal((await partial.loader.paged('partial')).length,2);assert.equal(partialCalls,6);
 let tries=0;
 const retry=runtime(async()=>++tries===1?failure(429):response({data:[{name:'Retried'}],has_more:false}));
 assert.equal((await retry.loader.paged('retry')).length,1);assert.equal(tries,2);
 let timeouts=0;
 const timed=runtime((url,{signal})=>new Promise((resolve,reject)=>{timeouts++;signal.addEventListener('abort',()=>reject(Object.assign(new Error('Timed out'),{name:'AbortError'})),{once:true});}));
 await assert.rejects(timed.loader.json('timeout',{timeout:5,retries:1}),/Timed out/);assert.equal(timeouts,2);
 const cycle=runtime(async()=>response({data:[],has_more:true,next_page:'https://api.scryfall.com/cards/search?q=loop&unique=cards&order=set'}));
 await assert.rejects(cycle.loader.paged('loop'),/pagination/);
 const malformed=runtime(async()=>response({data:[],has_more:true}));await assert.rejects(malformed.loader.paged('invalid'),/Incomplete/);
 const missing=runtime(async()=>response({data:[{name:'Only one'}],total_cards:2,has_more:false}));await assert.rejects(missing.loader.paged('missing'),/Incomplete card count/);
 // Cancel a request even when its underlying transport resolves after reset.
 const old=deferred(),signals=[];
 const reset=runtime(async(url,{signal})=>{signals.push(signal);return old.promise;});
 const pending=reset.api.loadPool();await tick();reset.element('sim-reset').events.click();
 assert.ok(signals.every(s=>s.aborted));assert.equal(reset.api.read().loading,false);assert.equal(reset.element('sim-start').disabled,false);
 old.resolve(response({data:cards('Old'),has_more:false}));await pending;await tick();
 assert.equal(reset.api.read().active,false);assert.equal(reset.api.read().pool.length,0);
 assert.match(reset.element('sim-pack').innerHTML,/ドラフト開始/);
 // A new session with the same set cannot receive stale Japanese images/names.
 const japanese=deferred();let japaneseCalls=0,network=0;
 const same=runtime(async url=>{network++;if(url.includes('limited-ranking'))return response({sets:{}});if(decodeURIComponent(url).includes('lang:ja')&&++japaneseCalls===1)return japanese.promise;return response({data:cards('Current'),has_more:false});});
 await same.api.loadPool();await same.api.loadPool();await tick();
 japanese.resolve(response({data:[{name:'Current0',printed_name:'Stale Japanese'}],has_more:false}));await tick();await tick();
 assert.notEqual(same.api.read().jaMap.get('Current0')?.printed_name,'Stale Japanese');
 const initialNetwork=network;for(let i=0;i<42;i++)same.api.pick();assert.equal(network,initialNetwork);assert.equal(same.api.read().picked.length,42);
 // Set changes during loading release the button and invalidate prior work.
 const waiting=deferred();const change=runtime(async()=>waiting.promise);
 const switching=change.api.loadPool();change.element('sim-set').value='hob';change.element('sim-set').events.change();
 waiting.resolve(response({data:cards('TMT'),has_more:false}));await switching;
 assert.equal(change.api.read().active,false);assert.equal(change.element('sim-start').disabled,false);
 // Optional ratings failure does not block cards; double clicks start one load.
 let cardRequests=0;
 const optional=runtime(async url=>{if(url.includes('limited-ranking'))throw new Error('Offline ratings');cardRequests++;return response({data:cards('Playable'),has_more:false});});
 const first=optional.api.loadPool();await optional.api.loadPool();await first;assert.equal(cardRequests,2);assert.equal(optional.api.read().active,true);
 console.log('PASS full pagination/cache, retry, timeout, incomplete/cyclic pages, reset cancellation, same-set stale names, set switching, optional ratings, double start and zero requests during 42 picks');
})().catch(error=>{console.error(error);process.exitCode=1;});
