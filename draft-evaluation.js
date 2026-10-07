/* Estimates are ratings, never invented win rates. No network or DOM ownership. */
(function(root){'use strict';
const finite=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const list=v=>Array.isArray(v)?v:[];
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,finite(x,a)));
const mv=c=>clamp(finite(c?.cmc),0,100);
const rows=data=>list(data?.ranking).filter(x=>x&&typeof x==='object');
const type=c=>String(c?.card_faces?.[0]?.type_line||c?.type_line||'').split(' // ')[0];
const land=c=>/\bLand\b/i.test(type(c));
const basic=c=>/\bBasic\b.*\bLand\b/i.test(type(c));
const creature=c=>/\bCreature\b/i.test(type(c));
const text=c=>String(c?.oracle_text||list(c?.card_faces).map(f=>f?.oracle_text||'').join(' ')||'').toLowerCase();
const colors=c=>list(c?.colors||c?.card_faces?.[0]?.colors).filter(x=>'WUBRG'.includes(x)&&typeof x==='string'&&x.length===1);
const key=c=>c?.oracle_id||c?.name;
const indexes=new WeakMap();
const normalizedName=v=>String(v||'').normalize('NFKC').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().toLowerCase();
function identifiers(c){
 const aliases=[];if(c?.scryfall_id||c?.id)aliases.push('id:'+(c.scryfall_id||c.id));
 if(c?.set&&c?.collector_number!==undefined)aliases.push('print:'+String(c.set).toLowerCase()+':'+String(c.collector_number));
 if(c?.oracle_id)aliases.push('oracle:'+c.oracle_id);
 if(c?.name)aliases.push('name:'+normalizedName(c.name));
 if(c?.card_faces?.[0]?.name&&c.card_faces[0].name!==c.name)aliases.push('name:'+normalizedName(c.card_faces[0].name));
 return aliases;
}
function matchRating(c,data={}){
 if(!data||typeof data!=='object')return null;
 let index=indexes.get(data);
 if(!index){index=new Map();for(const row of rows(data)){for(const alias of identifiers(row)){if(index.has(alias)&&index.get(alias)!==row)index.set(alias,null);else index.set(alias,row);}}indexes.set(data,index);}
 for(const alias of identifiers(c)){const row=index.get(alias);if(row)return {row,method:alias.split(':')[0]};}
 return null;
}
function roles(c){
 const t=text(c);let removal=0,kind='';
 if(/(?:destroy|exile) target [^.]{0,45}?(?:creature|permanent|artifact|enchantment)/.test(t)){removal=/with |if |unless |tapped|attacking|blocking/.test(t)?1.5:3;kind=removal===3?'確定除去':'条件付き除去';}
 else if(/deals? \d+ damage to (?:any target|target (?:creature|.+creature))|gets? -\d+\/-\d+/.test(t)){removal=2;kind='火力・マイナス修整';}
 else if(/fight|bites|damage equal to its power/.test(t)){removal=1.5;kind='条件付き除去';}
 else if(/return target .* to (?:its|their) owner|counter target/.test(t)){removal=1.1;kind='バウンス・打ち消し';}
 else if(/tap target (?:creature|permanent)/.test(t)){removal=.5;kind='タップ';}
 const trick=/target creature gets? \+|target creature gains?/.test(t)&&!/enchant creature/.test(t);
 const draw=/draw (?:a|one|two|three|\d+) cards?|return .* from your graveyard to your hand/.test(t);
 return {removal,kind,trick,draw};
}
function base(c={},data={}){
 c=c||{};
 const r=roles(c),cost=mv(c),t=text(c);
 let heuristic=land(c)?(basic(c)?12:45):creature(c)?49:43;
 if(creature(c)){const stats=Number(c.power)+Number(c.toughness);if(Number.isFinite(stats))heuristic+=clamp((stats-cost*2)*.8,-4,4);if(/flying|deathtouch|lifelink|menace|trample/.test(t))heuristic+=2;if(cost>=6)heuristic-=2;}
 heuristic+=r.removal*2.2+(r.draw?2.5:0)+(r.trick?1:0);
 // Rarity is only a small tie breaker in the absence of performance data.
 heuristic+=({rare:.4,mythic:.6}[c.rarity]||0);
 const row=matchRating(c,data)?.row,wr=Number(row?.wr),games=finite(row?.games);
 const hasWR=row&&Number.isFinite(wr)&&wr>0&&wr<=100;
 const trust=hasWR?clamp(games/1000):0;
 return {value:hasWR?heuristic*(1-trust)+wr*trust:heuristic,wr:hasWR?wr:null,trust,heuristic,wrContribution:hasWR?wr*trust:0,heuristicContribution:heuristic*(1-trust),roles:r};
}
function plan(history,data){
 const weights={W:0,U:0,B:0,R:0,G:0};
 history.filter(c=>!land(c)).forEach(c=>{const w=clamp((base(c,data).value-38)/12,.2,2.5);colors(c).forEach(k=>{if(k in weights)weights[k]+=w/Math.max(1,colors(c).length);});});
 const ordered=Object.entries(weights).sort((a,b)=>b[1]-a[1]),total=ordered.reduce((s,x)=>s+x[1],0);
 const main=ordered.slice(0,2).filter(x=>x[1]>0).map(x=>x[0]);
 const share=total?ordered.slice(0,2).reduce((s,x)=>s+x[1],0)/total:0;
 const commitment=clamp((history.length-4)/20)*clamp((share-.45)/.4);
 return {colors:main,commitment,share,code:['W','U','B','R','G'].filter(x=>main.includes(x)).join('')};
}
function synergy(c,history,p,data){
 if(!p.code||!colors(c).every(x=>p.colors.includes(x)))return 0;
 const pair=Object.keys(data?.archetypeCards||{}).find(code=>code.length===p.code.length&&[...code].every(k=>p.code.includes(k)));
 const pairRows=list(data?.archetypeCards?.[pair]);const row=pairRows.find(x=>x.name===c.name),global=matchRating(c,data)?.row;
 if(row&&global&&Number.isFinite(Number(row.wr))&&Number.isFinite(Number(global.wr)))return clamp((Number(row.wr)-Number(global.wr))*.5,-1,3)*clamp(finite(row.games)/1000);
 // Conservative repeated-mechanic estimate; it is not set-specific empirical data.
 const tags=['proliferate','convoke','cycling','surveil','sacrifice','equip','landfall','discard'];
 return Math.min(2,tags.reduce((s,tag)=>s+(text(c).includes(tag)&&history.filter(x=>text(x).includes(tag)&&colors(x).every(k=>p.colors.includes(k))).length>=3?1:0),0));
}
function splashSupport(c,history,p){
 const missing=colors(c).filter(x=>!p.colors.includes(x));
 const mana=String(c?.mana_cost||c?.card_faces?.[0]?.mana_cost||'');
 const sources=missing.map(color=>history.filter(x=>{
  if(land(x))return list(x.produced_mana).includes(color)&&!basic(x);
  return /add (?:one mana|a mana|mana) of any colou?r/.test(text(x));
 }).length);
 // A single late pip with at least two drafted fixing sources is a cautious splash.
 const offPips=(mana.match(/\{[WUBRG]\}/g)||[]).filter(x=>missing.includes(x[1])).length;
 return {missing,sources,supported:missing.length===1&&sources[0]>=2&&mv(c)>=4&&offPips===1};
}
function evaluate(c={},history=[],data={}){
 c=c||{};
 const b=base(c,data),p=plan(history,data),cc=colors(c),on=cc.every(x=>p.colors.includes(x));let value=b.value,reasons=[];
 const components={base:b.value,mana:0,color:0,synergy:0,curve:0,creature:0,removal:0,duplicate:0,fixing:0};const add=(part,amount)=>{value+=amount;components[part]+=amount;};
 const mana=String(c.mana_cost||c.card_faces?.[0]?.mana_cost||''),pips=(mana.match(/\{[WUBRG]\}/g)||[]).length;
 add('mana',-(Math.max(0,cc.length-1)*.6*(1-p.commitment)+Math.max(0,pips-2)*.4));
 reasons.push(b.wr!==null&&b.trust>=.5?'保存WRを参考にした単体評価':'カード情報からの推定単体評価');
 if(p.commitment&&cc.length){const support=splashSupport(c,history,p);const bonus=on?4*p.commitment:-(b.value>=65&&support.supported?5:10)*p.commitment*Math.max(1,support.missing.length);add('color',bonus);if(on)reasons.push('現在の主色に合う');else reasons.push(support.supported?'スプラッシュ用のマナ供給あり':'主色外のマナ供給が不足');}
 const syn=synergy(c,history,p,data)*p.commitment;add('synergy',syn);if(syn>.5)reasons.push('アーキタイプ・共通メカニズムと相性が良い');
 const spells=history.filter(x=>!land(x)&&colors(x).every(k=>p.colors.includes(k))),cost=mv(c),late=clamp((history.length-8)/22);
 if(on&&!land(c)&&b.value>=45){
  if(creature(c)&&[2,3,4].includes(cost)){const n=spells.filter(x=>creature(x)&&mv(x)===cost).length,target={2:5,3:4,4:3}[cost];const bonus=late*(n<target?1.8:-Math.min(2,(n-target)*.5));add('curve',bonus);if(bonus>.5)reasons.push(cost+'マナのクリーチャーを補強');}
  if(cost>=6)add('curve',-late*Math.max(0,spells.filter(x=>mv(x)>=6).length-2)*1.2);
  if(creature(c)&&spells.filter(creature).length<Math.min(15,history.length*.48)){add('creature',late*1.2);if(late>.4)reasons.push('クリーチャー不足を補う');}
  if(b.roles.removal){add('removal',late*Math.max(0,3-spells.filter(x=>roles(x).removal>=1.5).length)*.45);reasons.push(b.roles.kind);}
 }
 const copies=history.filter(x=>key(x)===key(c)).length;
 if(copies&&/\bLegendary\b/i.test(type(c)))add('duplicate',-copies*2.5);
 else if(copies&&b.roles.trick)add('duplicate',-Math.max(0,copies-1)*1.5);
 else if(copies&&cost>=6)add('duplicate',-copies*1.2);
 // Useful cheap creatures and removal do not receive a blanket duplicate penalty.
 if(land(c)&&!basic(c)){const produced=c.produced_mana||[];if(produced.filter(x=>p.colors.includes(x)).length>=2){add('fixing',8*p.commitment);reasons.push('主色のマナ基盤を補強');}}
 return {value,reasons,base:b,plan:p,synergy:syn,components};
}
function recommendMana(deck,history=[],p=plan(deck,{})){
 const demand={};for(const card of deck){
  const cost=String(card.mana_cost||card.card_faces?.[0]?.mana_cost||'');
  const symbols=[...cost.matchAll(/\{([^}]+)\}/g)].flatMap(m=>m[1].split('/').filter(c=>'WUBRG'.includes(c)&&c.length===1));
  const cc=symbols.length?symbols:colors(card);
  for(const c of cc)demand[c]=(demand[c]||0)+1+(mv(card)<=3?.5:0);
 }
 const wanted=Object.keys(demand),fixing=history.filter(c=>land(c)&&!basic(c)&&list(c.produced_mana).some(k=>wanted.includes(k))).slice(0,4);
 const basicCount=17-fixing.length,basics=Object.fromEntries(wanted.map(c=>[c,0]));
 const splash=wanted.filter(c=>!p.colors.includes(c));
 // Preserve source demand in weighted rounding, with conservative main-color minima.
 for(const c of wanted)basics[c]=p.colors.includes(c)?Math.min(6,basicCount):1;
 while(Object.values(basics).reduce((a,x)=>a+x,0)>basicCount){const c=wanted.slice().sort((a,b)=>basics[b]-basics[a])[0];basics[c]--;}
 while(wanted.length&&Object.values(basics).reduce((a,x)=>a+x,0)<basicCount){const c=wanted.slice().sort((a,b)=>demand[b]/(basics[b]+fixing.filter(x=>list(x.produced_mana).includes(b)).length+1)-demand[a]/(basics[a]+fixing.filter(x=>list(x.produced_mana).includes(a)).length+1))[0];basics[c]++;}
 const colorlessBasics=wanted.length?0:basicCount;
 return {deckSize:40,selectedCards:deck.length+17,missingSpells:Math.max(0,23-deck.length),spellCount:deck.length,landCount:17,basicCount,basics,colorlessBasics,nonbasic:fixing.map(c=>({key:key(c),name:c.name,producedMana:list(c.produced_mana)})),weightedColorDemand:demand,splashColors:splash,approximation:'Basic lands supplied; nonbasic fixing drawn from picked pool. Not a probability optimizer.'};
}
function grade(history,data={}){
 const p=plan(history,data),eligible=history.filter(c=>!land(c)&&colors(c).every(x=>p.colors.includes(x)));
 const deck=eligible.slice().sort((a,b)=>evaluate(b,history,data).value-evaluate(a,history,data).value).slice(0,23);
 const splash=history.filter(c=>!land(c)&&!colors(c).every(k=>p.colors.includes(k))&&base(c,data).value>=65&&splashSupport(c,history,p).supported).sort((a,b)=>evaluate(b,history,data).value-evaluate(a,history,data).value)[0];
 if(splash&&(deck.length<23||evaluate(splash,history,data).value>evaluate(deck[deck.length-1],history,data).value+1)){if(deck.length===23)deck.pop();deck.push(splash);}
 const mana=recommendMana(deck,history,p);
 const n=deck.length,avg=deck.reduce((s,c)=>s+base(c,data).value,0)/Math.max(1,n),counts=[2,3,4].map(m=>deck.filter(c=>creature(c)&&mv(c)===m).length);
 const nc=deck.filter(creature).length,rem=deck.reduce((s,c)=>s+roles(c).removal,0),syn=deck.reduce((s,c)=>s+Math.max(0,synergy(c,deck,p,data)),0);
 const high=deck.filter(c=>mv(c)>=6).length;
 const pips=deck.map(c=>(String(c.mana_cost||c.card_faces?.[0]?.mana_cost||'').match(/\{[WUBRG]\}/g)||[]).length);
 const demanding=deck.filter((c,i)=>mv(c)<=3&&pips[i]>=3).length;
 const parts=[['カードパワー',Math.round(30*clamp((avg-40)/30)*n/23),30,'単体評価平均 '+avg.toFixed(1)+'（勝率ではありません）'],
 ['色のまとまり',Math.round(15*clamp(n/23)),15,'採用候補の呪文 '+n+' / 23枚'],
 ['マナカーブ',Math.round(15*clamp((Math.min(counts[0],5)+Math.min(counts[1],4)+Math.min(counts[2],3))/12-Math.max(0,high-3)*.08)),15,'2/3/4マナの生物 '+counts.join('/')+'・6マナ以上 '+high],
 ['クリーチャー',Math.round(10*clamp(1-Math.abs(nc-15)/12)),10,nc+'枚'],
 ['除去・干渉',Math.round(10*clamp(rem/12)),10,'種類別の重み合計 '+rem.toFixed(1)],
 ['シナジー・アーキタイプ',Math.round(10*clamp(syn/15)),10,'保存ペア別WR差・共通メカニズムの補助評価'],
 ['マナ基盤',Math.max(0,10-demanding*2),10,'土地17枚：'+Object.entries(mana.basics).map(([c,n])=>c+n).join('/')+'・非基本 '+mana.nonbasic.length+'・早期3シンボル '+demanding]];
 let total=parts.reduce((s,x)=>s+x[1],0);total=Math.round(total*Math.min(1,n/23));
 return {total,grade:total>=90?'S':total>=80?'A':total>=70?'B':total>=60?'C':total>=50?'D':'E',parts,deck,mana,colors:p.colors,notes:['主色中心の23呪文を自動選択した推定評価です。スプラッシュは供給条件を満たす強カード1枚までです。実際のデッキ構築・勝率ではありません。','基本土地は補充可能とし、ドラフトした基本土地の多さで加点しません。',...(n<23?['主色の呪文が23枚未満です。']:[]),...(nc<13?['クリーチャーが不足しています。']:[]),...(counts[0]<4?['2マナのクリーチャーを補強してください。']:[]),...(rem<7?['安定した除去が不足しています。']:[])]};
}
const api={base,plan,evaluate,grade,roles,land,basic,creature,splashSupport,recommendMana,matchRating,identifiers,normalizedName};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MagstaDraftEvaluation=api;
})(typeof window!=='undefined'?window:globalThis);
