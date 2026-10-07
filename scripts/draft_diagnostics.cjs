/* Diagnostic assumptions are explicit; no CPU/scoring coefficients are changed. */
const model=require('../draft-evaluation.js');
function ranks(values){const sorted=values.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v),result=[];for(let i=0;i<sorted.length;){let j=i+1;while(j<sorted.length&&sorted[j].v===sorted[i].v)j++;const rank=(i+j-1)/2+1;for(let k=i;k<j;k++)result[sorted[k].i]=rank;i=j;}return result;}
function spearman(pairs,pearson){const x=ranks(pairs.map(p=>p[0])),y=ranks(pairs.map(p=>p[1]));return pearson(x.map((v,i)=>[v,y[i]]));}
const choose=(n,k)=>{if(k<0||k>n)return 0;let v=1;for(let i=1;i<=k;i++)v=v*(n-k+i)/i;return v;};
function probabilityAtLeast(deckSize,sources,draws,required){if(![deckSize,sources,draws,required].every(Number.isInteger)||deckSize<1||sources<0||sources>deckSize||draws<0||draws>deckSize||required<0)return null;if(required===0)return 1;if(required>Math.min(sources,draws))return 0;const denominator=choose(deckSize,draws);if(!denominator)return null;let bad=0;for(let k=0;k<required;k++)bad+=choose(sources,k)*choose(deckSize-sources,draws-k)/denominator;return Math.max(0,Math.min(1,1-bad));}
function manaDiagnostics(deck,history,data){
 const main=model.plan(history,data),mana=model.recommendMana(deck,history,main),rows=[];let unmodelledCosts=0;
 for(const card of deck){const cost=Number(card.cmc),text=String(card.mana_cost||card.card_faces?.[0]?.mana_cost||'');if(!Number.isFinite(cost)||cost<0||cost>40||!text||/\{[^}]*[X/][^}]*\}/.test(text)){unmodelledCosts++;continue;}const pips={};for(const m of text.matchAll(/\{([WUBRG])\}/g))pips[m[1]]=(pips[m[1]]||0)+1;
  for(const [color,required]of Object.entries(pips)){const sources=(mana.basics[color]||0)+mana.nonbasic.filter(c=>c.producedMana.includes(color)).length,draws=Math.min(40,7+Math.max(0,Math.ceil(cost)-1));rows.push({card:card.name,color,required,cmc:cost,sources,splash:!main.colors.includes(color),probability:probabilityAtLeast(40,sources,draws,required),landsByTurnProbability:probabilityAtLeast(40,17,draws,Math.ceil(cost))});}
 }
 return {assumptions:'40 cards, no mulligan, on the play, land sources only; tapped timing/spell fixing/hybrid not modelled',mana,checks:rows,unmodelledCosts,earlyDoublePipLow:rows.filter(r=>r.cmc<=3&&r.required>=2&&r.probability<.7).length,splashLow:rows.filter(r=>r.splash&&r.probability<.7).length,zeroSources:rows.filter(r=>r.sources===0).length,moreThanTwoColors:Object.keys(mana.weightedColorDemand).length>2,incomplete:deck.length!==23};
}
function anomalies({scores,archetypes,cpus,cards,mana}){
 const flags=[];const add=(type,value,threshold,note)=>{if(value>threshold)flags.push({type,value,threshold,note});};
 add('score90PlusShare',scores.buckets['>=90']/cpus,.25,'screening threshold, not a balance target');add('scoreAtMost40Share',(scores.atMost40??scores.buckets['<40'])/cpus,.5,'inspect extreme deck breakdowns');
 for(const [pair,count]of Object.entries(archetypes))add('pairConcentration:'+pair,count/cpus,.6,'may reflect real set strength; do not force equal colors');
 for(const card of cards){if(card.p1Appearances>=30&&card.p1p1Rate>.8)flags.push({type:'highP1P1',card:card.name,rate:card.p1p1Rate});if(card.appearances>=30&&card.baseValue<45&&card.averagePick<3)flags.push({type:'lowEstimatedPowerPickedEarly',card:card.name,averagePick:card.averagePick});if(card.appearances>=30&&card.baseValue>=65&&card.averagePick>7)flags.push({type:'highEstimatedPowerPickedLate',card:card.name,averagePick:card.averagePick});}
 add('moreThanTwoColorsShare',mana.moreThanTwoColors/cpus,.25,'single-card splashes may be valid; inspect fixing and source probabilities');
 if(mana.zeroSources)flags.push({type:'zeroManaSources',decks:mana.zeroSources});if(mana.splashLow)flags.push({type:'splashSupplyBelow70Percent',decks:mana.splashLow,assumptions:mana.assumptions});return flags;
}
module.exports={spearman,ranks,probabilityAtLeast,manaDiagnostics,anomalies};
