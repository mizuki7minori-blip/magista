#!/usr/bin/env node
/* Offline only; all inputs must be complete snapshots. No HTTP during picks. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const model=require('../draft-evaluation.js'),pack=require('../draft-pack.js');
const diagnostics=require('./draft_diagnostics.cjs');
const root=path.resolve(__dirname,'..');
const PAIRS=['WU','UB','BR','RG','GW','WB','UR','BG','RW','GU'];
const pairCode=cols=>PAIRS.find(p=>p.length===cols.length&&[...p].every(c=>cols.includes(c)))||cols.join('');
const cardKey=c=>c.oracle_id||model.identifiers(c)[0]||c.name;
const finite=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
function correlation(pairs){if(pairs.length<3)return null;const mx=pairs.reduce((s,p)=>s+p[0],0)/pairs.length,my=pairs.reduce((s,p)=>s+p[1],0)/pairs.length;let xy=0,xx=0,yy=0;for(const [x,y]of pairs){xy+=(x-mx)*(y-my);xx+=(x-mx)**2;yy+=(y-my)**2;}return xx&&yy?xy/Math.sqrt(xx*yy):null;}
function analyze(cards,data,rounds,seed,options={}){
 const rnd=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
 const selected=cards.filter(c=>c&&c.name&&c.booster!==false&&!/\bToken\b/i.test(c.type_line||''));
 const pool=[...new Map(selected.map(c=>[cardKey(c),c])).values()];
 const specials=options.special||{spg:[],archive:[]};
 const all=[...new Map([...pool,...specials.spg,...specials.archive].map(c=>[cardKey(c),c])).values()];
 const values=all.map(c=>({name:c.name,base:model.base(c,data).value,value:model.evaluate(c,[],data).value,type:c.type_line,land:model.land(c),colors:c.colors}));
 const invalid=values.filter(x=>!Number.isFinite(x.base)||!Number.isFinite(x.value));if(invalid.length)throw new Error('non-finite card ratings');
 const scores=[],archetypes=Object.fromEntries(PAIRS.map(x=>[x,0])),colorPicks={},finalColors=Object.fromEntries('WUBRG'.split('').map(x=>[x,0])),orders=new Map(),landCounts={},packRarityCounts={},slotCounts={normal:0,special:0},extremes=[];
 let switches=0,earlyCommit=0,totalPicks=0;const manaSummary={decks:0,earlyDoublePipLow:0,splashLow:0,zeroSources:0,moreThanTwoColors:0,incomplete:0,twoColorComplete:0,splash:0,playable23:0,totalLands:0,unmodelledCosts:0,assumptions:null};
 for(const c of all)orders.set(cardKey(c),{card:c,appearances:0,total:0,p1p1:0,p1Early:0,p1Appearances:0,lastPick:0,componentTotals:{},reasonCounts:{}});
 for(let table=0;table<rounds;table++){
  const seats=Array.from({length:8},()=>[]),at10=[];
  for(let round=0;round<3;round++){
   let packs=Array.from({length:8},()=>pack.make(pool,{set:data.code.toLowerCase(),special:specials,random:rnd}));
   if(packs.some(p=>p.length!==14))throw new Error('pool cannot supply complete 14-card packs');
   packs.forEach(p=>{for(const c of p){packRarityCounts[c.rarity||'unknown']=(packRarityCounts[c.rarity||'unknown']||0)+1;const specialKeys=new Set([...specials.spg,...specials.archive].map(cardKey));slotCounts[specialKeys.has(cardKey(c))?'special':'normal']++;}const n=p.filter(model.land).length;landCounts[n]=(landCounts[n]||0)+1;});
   for(let pick=0;pick<14;pick++){
    for(let seat=0;seat<8;seat++){
     const candidates=packs[seat].map((c,i)=>{const evaluation=model.evaluate(c,seats[seat],data);return {i,evaluation,value:evaluation.value+(rnd()-.5)*.8};}).sort((a,b)=>b.value-a.value);
     const chosen=packs[seat].splice(candidates[0].i,1)[0],order=orders.get(cardKey(chosen));const evaluation=candidates[0].evaluation;for(const [part,amount]of Object.entries(evaluation.components))order.componentTotals[part]=(order.componentTotals[part]||0)+amount;for(const reason of evaluation.reasons)order.reasonCounts[reason]=(order.reasonCounts[reason]||0)+1;order.appearances++;order.total+=pick+1;order.lastPick+=pick===13?1:0;if(round===0){order.p1Appearances++;if(pick===0)order.p1p1++;if(pick<5)order.p1Early++;}totalPicks++;
     const cols=chosen.colors||chosen.card_faces?.[0]?.colors||[],group=cols.length===0?'C':cols.length>1?'multicolor':cols[0];colorPicks[group]=(colorPicks[group]||0)+1;
     seats[seat].push(chosen);if(seats[seat].length===5&&model.plan(seats[seat],data).commitment>.5)earlyCommit++;
     if(seats[seat].length===10)at10[seat]=pairCode(model.plan(seats[seat],data).colors);
    }
    const old=packs;packs=old.map((_,i)=>old[(i+(round===1?7:1))%8]);
   }
  }
  seats.forEach((h,i)=>{const g=model.grade(h,data),code=pairCode(model.plan(h,data).colors);archetypes[code]=(archetypes[code]||0)+1;if(code!==at10[i])switches++;scores.push(g.total);const colors=new Set(g.deck.flatMap(c=>c.colors||c.card_faces?.[0]?.colors||[]));for(const c of colors)finalColors[c]++;const manaCheck=diagnostics.manaDiagnostics(g.deck,h,data);manaSummary.decks++;manaSummary.totalLands+=manaCheck.mana.landCount;if(g.deck.length===23)manaSummary.playable23++;if(g.deck.length===23&&!manaCheck.moreThanTwoColors)manaSummary.twoColorComplete++;if(manaCheck.moreThanTwoColors)manaSummary.splash++;manaSummary.assumptions=manaCheck.assumptions;for(const key of ['earlyDoublePipLow','splashLow','zeroSources','moreThanTwoColors','incomplete','unmodelledCosts'])if(manaCheck[key])manaSummary[key]++;extremes.push({score:g.total,colors:code,parts:g.parts,cards:g.deck.map(c=>({key:cardKey(c),name:c.name})),mana:manaCheck});});
 }
 const sorted=scores.slice().sort((a,b)=>a-b),mean=scores.reduce((s,x)=>s+x,0)/scores.length,buckets={'<40':0,'40-49':0,'50-59':0,'60-69':0,'70-79':0,'80-89':0,'>=90':0};scores.forEach(s=>buckets[s<40?'<40':s>=90?'>=90':Math.floor(s/10)*10+'-'+(Math.floor(s/10)*10+9)]++);
 const wrCount=pool.filter(c=>model.base(c,data).wr!==null).length,methods={};pool.forEach(c=>{const m=model.matchRating(c,data)?.method||'unmatched';methods[m]=(methods[m]||0)+1;});
 const comparable=options.metricDefinitions?.ata==='17Lands avg_pick: average pick position when taken'&&options.event==='PremierDraft';
 const matched=[...orders.values()].map(o=>{const row=model.matchRating(o.card,data)?.row,average=o.appearances?o.total/o.appearances:null,ata=finite(row?.ata)?Number(row.ata):null,alsa=finite(row?.alsa)?Number(row.alsa):null;return {key:cardKey(o.card),name:o.card.name,appearances:o.appearances,averagePick:average,p1Appearances:o.p1Appearances,p1p1Count:o.p1p1,p1p1Rate:o.p1Appearances?o.p1p1/o.p1Appearances:null,p1p5Rate:o.p1Appearances?o.p1Early/o.p1Appearances:null,lastPickRate:o.appearances?o.lastPick/o.appearances:null,survivesTo15Rate:null,survivesTo15Status:'not-applicable-14-card-packs',wr:model.base(o.card,data).wr,gihWR:finite(row?.gih_wr)?Number(row.gih_wr):null,ohWR:finite(row?.oh_wr)?Number(row.oh_wr):null,ata,alsa,ataDifference:comparable&&ata!==null&&average!==null?average-ata:null,baseValue:model.base(o.card,data).value,heuristicValue:model.base(o.card,data).heuristic,wrContribution:model.base(o.card,data).wrContribution,meanColorAdjustment:o.appearances?(o.componentTotals.color||0)/o.appearances:null,meanSynergyAdjustment:o.appearances?(o.componentTotals.synergy||0)/o.appearances:null,meanCurveAdjustment:o.appearances?(o.componentTotals.curve||0)/o.appearances:null,meanRemovalAdjustment:o.appearances?(o.componentTotals.removal||0)/o.appearances:null,meanDuplicateAdjustment:o.appearances?(o.componentTotals.duplicate||0)/o.appearances:null,meanComponents:Object.fromEntries(Object.entries(o.componentTotals).map(([k,v])=>[k,v/o.appearances])),reasonCounts:o.reasonCounts,reasons:o.appearances?Object.entries(o.reasonCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]):model.evaluate(o.card,[],data).reasons};}).sort((a,b)=>a.key.localeCompare(b.key));
 const compared=matched.filter(c=>c.ataDifference!==null),ascending=compared.slice().sort((a,b)=>a.ataDifference-b.ataDifference);
 const matchedRows=new Set(pool.map(c=>model.matchRating(c,data)?.row).filter(Boolean));
 const unmatchedRatingRecords=(data.ranking||[]).filter(r=>!matchedRows.has(r)).length;
 const missingFields=pool.filter(c=>!c.type_line||!c.rarity||!finite(c.cmc)).length;
 const result={status:'measured-card-pool',rawCardCount:cards.length,draftPoolCount:pool.length,excludedNonDraft:cards.length-selected.length,performanceVariantsCollapsed:selected.length-pool.length,packEligibility:{officialVerified:false,method:'Scryfall booster flag and legacy special pool targeting; not a verified print sheet'},wrCount,wrCoverage:wrCount/pool.length,missingWR:pool.length-wrCount,joinMethods:methods,ratingRecordsNotMatchedToDraftPool:unmatchedRatingRecords,drafts:rounds,cpus:scores.length,totalPicks,errors:0,
 cardKinds:{lands:pool.filter(model.land).length,basicLands:pool.filter(model.basic).length,creatures:pool.filter(model.creature).length,multicolor:pool.filter(c=>(c.colors||c.card_faces?.[0]?.colors||[]).length>1).length,colorless:pool.filter(c=>(c.colors||c.card_faces?.[0]?.colors||[]).length===0).length,doubleFaced:pool.filter(c=>c.card_faces?.length>1).length},ratings:{minimum:Math.min(...values.map(x=>x.base)),maximum:Math.max(...values.map(x=>x.base)),invalid,missingStructuralFields:missingFields,extremes:values.filter(x=>x.base<0||x.base>100)},
 scores:{mean,atMost40:scores.filter(s=>s<=40).length,median:(sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.floor(sorted.length/2)])/2,standardDeviation:Math.sqrt(scores.reduce((s,x)=>s+(x-mean)**2,0)/scores.length),min:sorted[0],max:sorted.at(-1),buckets},colorPicks,finalColorAdoption:Object.fromEntries(Object.entries(finalColors).map(([c,n])=>[c,{decks:n,rate:n/scores.length}])),archetypes,mainPairChangesAfterP1P10:switches,earlyCommitAtP1P5:earlyCommit,landCounts,packRarityCounts,packRarityRates:Object.fromEntries(Object.entries(packRarityCounts).map(([rarity,count])=>[rarity,count/totalPicks])),slotCounts,slotRates:{normal:slotCounts.normal/totalPicks,special:slotCounts.special/totalPicks},scryfallIdMatchRate:(methods.id||0)/pool.length,constructionRates:{playable23:manaSummary.playable23/scores.length,twoColorComplete:manaSummary.twoColorComplete/scores.length,splash:manaSummary.splash/scores.length,averageLands:manaSummary.totalLands/scores.length},pickOrders:matched,
 attainmentComparison:comparable?'ATA comparison enabled; ALSA kept separate':'unavailable-or-incompatible-metric-definitions',ataComparison:{status:'diagnostic-only-unverified-collation',cards:compared.length,pearson:correlation(compared.map(c=>[c.ata,c.averagePick])),spearman:diagnostics.spearman(compared.map(c=>[c.ata,c.averagePick]),correlation),pickedEarlier:ascending.slice(0,20),pickedLater:ascending.slice(-20).reverse()},manaSummary,extremeDecks:[extremes.sort((a,b)=>a.score-b.score)[0],extremes.at(-1)]};
 result.anomalies=diagnostics.anomalies({scores:result.scores,archetypes,cpus:scores.length,cards:matched,mana:manaSummary});
 for(const [color,adoption]of Object.entries(result.finalColorAdoption))if(adoption.rate>.9)result.anomalies.push({type:'colorConcentration:'+color,rate:adoption.rate,threshold:.9});
 return result;
}
const csv=rows=>{if(!rows.length)return '';const keys=Object.keys(rows[0]);const quote=v=>'"'+String(v===null||v===undefined?'':typeof v==='object'?JSON.stringify(v):v).replace(/"/g,'""')+'"';return keys.map(quote).join(',')+'\n'+rows.map(r=>keys.map(k=>quote(r[k])).join(',')).join('\n')+'\n';};
function main(){
 const args=process.argv.slice(2),option=(flag,fallback)=>{const i=args.indexOf(flag);return i>=0?args[i+1]:fallback;};
 const input=option('--cards-dir',path.join(root,'data/draft-cards')),ratingsDir=option('--ratings-dir',path.join(root,'data/draft-ratings')),output=option('--output',path.join(root,'reports/draft-calibration.json')),dir=option('--report-dir',path.join(root,'reports/draft-calibration')),rounds=Number(option('--tables','100')),seed=Number(option('--seed','873'));
 if(!Number.isInteger(rounds)||rounds<1||rounds>1000)throw new Error('--tables must be 1..1000');if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw new Error('--seed must be uint32');
 const snapshot=JSON.parse(fs.readFileSync(path.join(root,'limited-ranking-data.json'))),report={generatedAt:new Date().toISOString(),seed,requestedTablesPerSet:rounds,statisticsSource:snapshot.source,sets:{}};fs.mkdirSync(dir,{recursive:true});
 const requested=[...new Set(option('--sets',Object.keys(snapshot.sets).join(',')).split(',').map(s=>s.trim().toLowerCase()))];let failures=0;
 for(const set of requested){
  if(!snapshot.sets[set])throw new Error('unsupported set '+set);
  let data=snapshot.sets[set],metadata=null;const ratingFile=path.join(ratingsDir,set+'.json'),file=path.join(input,set+'.json');
  const entry={officialCollation:pack.PACK_CONFIG[set],savedWRCount:data.ranking.length,fullCardCount:null,wrCoverage:null,drafts:0,cpus:0,totalPicks:0,errors:0,status:'unavailable-no-real-card-pool',reason:'No complete card snapshot; fetch inputs in a network-enabled environment.'};
  try{
   if(args.includes('--require-full-ratings')&&!fs.existsSync(ratingFile))throw new Error('full ratings snapshot required; top-60 fallback disabled');
   if(fs.existsSync(ratingFile)){metadata=JSON.parse(fs.readFileSync(ratingFile));if(metadata.complete!==true||metadata.set!==set||!Array.isArray(metadata.ranking)||!metadata.source)throw new Error('invalid ratings snapshot');if((option('--start-date',null)&&metadata.startDate!==option('--start-date',null))||(option('--end-date',null)&&metadata.endDate!==option('--end-date',null)))throw new Error('cached rating window differs from requested window');data={...data,ranking:metadata.ranking};entry.ratingSource=metadata.source;entry.ratingFetchedAt=metadata.fetchedAt??null;entry.ratingValidation=metadata.validation;entry.ratingWindow={event:metadata.event,startDate:metadata.startDate,endDate:metadata.endDate};}
   if(fs.existsSync(file)){
    const payload=JSON.parse(fs.readFileSync(file));if(payload.set!==set||payload.complete!==true||!payload.source||!Array.isArray(payload.cards))throw new Error('requires complete matching card snapshot with provenance');
    const guestFile=path.join(input,'spg.json');let guests=[];if(set==='fra'&&fs.existsSync(guestFile)){const guest=JSON.parse(fs.readFileSync(guestFile));if(guest.complete!==true||guest.set!=='spg')throw new Error('incomplete SPG pool');guests=guest.cards;}
    const special=pack.specialPools(set,payload.cards,guests);
    const colorsFile=path.join(ratingsDir,set+'-colors.json');entry.actualColorResults=null;if(fs.existsSync(colorsFile)){const colors=JSON.parse(fs.readFileSync(colorsFile));if(colors.complete&&colors.set===set&&colors.startDate===metadata?.startDate&&colors.endDate===metadata?.endDate)entry.actualColorResults=colors;}
    entry.ratingMode=metadata?'full-rating-snapshot':'presentation-top60-fallback';entry.fullPrintWRCount=payload.cards.filter(c=>model.base(c,data).wr!==null).length;
    Object.assign(entry,{inputSource:payload.source,inputFetchedAt:payload.fetchedAt,inputSHA256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),statisticsSHA256:crypto.createHash('sha256').update(JSON.stringify(data.ranking)).digest('hex'),apiTotal:payload.apiTotal??null,acquisitionDuplicates:payload.duplicates??null,acquisitionMissingIdentity:payload.missingIdentity??null,acquisitionInvalidValues:payload.invalidValues??null,acquisitionCardsMissingFields:payload.cardsMissingFields??null,fullCardCount:payload.cards.length,specialInputSHA256:crypto.createHash('sha256').update(JSON.stringify(special)).digest('hex'),specialPools:{spg:special.spg.length,archive:special.archive.length,status:'legacy-targeting-official-unverified'}});
    entry.poolDiagnostics={boosterFlags:Object.fromEntries(['true','false','missing'].map(flag=>[flag,payload.cards.filter(c=>flag==='missing'?c.booster===undefined:String(c.booster)===flag).length])),rarities:Object.fromEntries(['common','uncommon','rare','mythic'].map(r=>[r,payload.cards.filter(c=>c.rarity===r).length])),uniqueOracles:new Set(payload.cards.map(c=>c.oracle_id||c.id||c.name)).size,samples:payload.cards.slice(0,3).map(c=>Object.fromEntries(['id','oracle_id','name','rarity','type_line','booster','collector_number'].map(k=>[k,c[k]])))};
    Object.assign(entry,analyze(payload.cards,data,rounds,seed,{special,metricDefinitions:metadata?.definitions,event:metadata?.event}));
   }else failures++;
  }catch(e){entry.status='input-error';entry.reason=e.message;entry.errors=1;failures++;}
  entry.savedWRIntegrity={checked:data.ranking.length,nonFinite:data.ranking.filter(x=>!Number.isFinite(model.base({name:x.name},data).value)).length};report.sets[set]=entry;
  const {pickOrders,...summary}=entry;fs.writeFileSync(path.join(dir,set.toUpperCase()+'-summary.json'),JSON.stringify(summary,null,2)+'\n');fs.writeFileSync(path.join(dir,set.toUpperCase()+'-cards.csv'),csv(pickOrders||[]));fs.writeFileSync(path.join(dir,set.toUpperCase()+'-archetypes.csv'),csv(Object.entries(entry.archetypes||{}).map(([pair,decks])=>({pair,decks,rate:decks/entry.cpus}))));
  const compared=(pickOrders||[]).filter(c=>c.ataDifference!==null);fs.writeFileSync(path.join(dir,set.toUpperCase()+'-score-distribution.csv'),csv(Object.entries(entry.scores?.buckets||{}).map(([band,count])=>({band,count,rate:count/entry.cpus}))));
  fs.writeFileSync(path.join(dir,set.toUpperCase()+'-ata-comparison.csv'),csv(compared));
  fs.writeFileSync(path.join(dir,set.toUpperCase()+'-outliers.csv'),csv([...(entry.ataComparison?.pickedEarlier||[]),...(entry.ataComparison?.pickedLater||[])].filter((c,i,a)=>a.findIndex(x=>x.key===c.key)===i)));
  fs.writeFileSync(path.join(dir,set.toUpperCase()+'-anomalies.json'),JSON.stringify(entry.anomalies||[],null,2)+'\n');
 }
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log('Report written: '+output);if(failures)process.exitCode=2;
}
if(require.main===module)main();module.exports={analyze,correlation,csv};
