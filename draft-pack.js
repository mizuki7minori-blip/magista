/* Simplified 14-card collation; not an official set/foil print-sheet simulation. */
(function(root){'use strict';
const legacy=(weights=[.50,.35,.125,.025],extra={})=>Object.freeze({
 status:'official-unverified',source:null,cards:14,common:7,uncommon:3,rareSlots:1,
 mythicChance:1/7,basicSlots:1,wildcardSlots:2,wildcardWeights:Object.freeze(weights),
 foil:null,doubleFacedSlot:null,bonusSheet:null,specialGuest:null,maxLands:null,...extra
});
const PACK_CONFIG=Object.freeze({
 fra:legacy(undefined,{references:Object.freeze([{article:'article-fra-draft-2026-09-25.html',url:'https://magic.wizards.com/ja/news/feature/collecting-reality-fracture',scope:'SPG presence mentioned by saved article; odds not confirmed'}]),specialGuest:Object.freeze({pool:'spg',collectorRange:Object.freeze([159,168]),chance:1/55,status:'legacy-unverified'})}),
 hob:legacy(),msh:legacy([.124,.64,.168,.021]),
 sos:legacy([.391,.391,.195,.019],{bonusSheet:Object.freeze({pool:'archive',chance:1,status:'legacy-unverified'})}),
 tmt:legacy(undefined,{maxLands:1})
});
const DEFAULT_CONFIG=legacy();
function make(pool,{set='',special={spg:[],archive:[]},random=Math.random}={}){
 const config=PACK_CONFIG[set]||DEFAULT_CONFIG;
 pool=pool.filter(c=>c.booster!==false&&!/\bToken\b/i.test(c.type_line||''));
 const type=c=>String(c.card_faces?.[0]?.type_line||c.type_line||'').split(' // ')[0];
 const land=c=>/\bLand\b/i.test(type(c)),basic=c=>/\bBasic\b.*\bLand\b/i.test(type(c));
 const key=c=>c.oracle_id||c.name,used=new Set(),out=[];
 // Basic lands only enter the dedicated slot. Nonbasic lands keep their rarity.
 const eligible=pool.filter(c=>!basic(c)),b={common:[],uncommon:[],rare:[],mythic:[]};
 eligible.forEach(c=>{if(b[c.rarity])b[c.rarity].push(c);});
 const take=list=>{const choices=list.filter(c=>!used.has(key(c))&&(config.maxLands===null||!land(c)||out.filter(land).length<config.maxLands));if(!choices.length)return null;const c=choices[Math.floor(random()*choices.length)];used.add(key(c));return c;};
 const push=c=>{if(c)out.push(c);};
 // Reserve the basic slot before ordinary slots, preserving the previous TMT cap.
 const reserved=config.basicSlots?take(pool.filter(basic)):null;push(reserved);
 for(let i=0;i<config.common;i++)push(take(b.common));for(let i=0;i<config.uncommon;i++)push(take(b.uncommon));
 for(let i=0;i<config.rareSlots;i++)push(take(random()<config.mythicChance?b.mythic:b.rare)||take(b.rare)||take(b.mythic));
 if(config.basicSlots&&!reserved)push(take(eligible.filter(c=>land(c)&&c.rarity==='common'))||take(b.common));
 // Retain legacy approximations; their official provenance has not been verified.
 const weights=config.wildcardWeights;
 for(let i=0;i<config.wildcardSlots;i++){let r=random()*weights.reduce((a,x)=>a+x,0),j=0;while(j<3&&r>=weights[j])r-=weights[j++];push(take(b[['common','uncommon','rare','mythic'][j]])||take(eligible));}
 const replace=cards=>{const c=take(cards||[]),idx=out.findIndex(x=>!land(x)&&x.rarity==='common');if(c&&idx>=0)out[idx]=c;};
 for(const slot of [config.specialGuest,config.bonusSheet])if(slot&&random()<slot.chance)replace(special[slot.pool]);
 // Never fill an incomplete card pool with extra basic lands.
 while(out.length<config.cards){const c=take(eligible.filter(c=>!land(c)))||take(eligible);if(!c)break;push(c);}
 return out.slice(0,config.cards);
}
function specialPools(set,cards,guests=[]){
 const range=PACK_CONFIG[set]?.specialGuest?.collectorRange;
 return {spg:range?guests.filter(c=>{const n=parseInt(String(c.collector_number||'').replace(/\D/g,''),10);return n>=range[0]&&n<=range[1];}):[],
 archive:set==='sos'?cards.filter(c=>(c.promo_types||[]).join(' ').toLowerCase().includes('mystical')||String(c.frame_effects||'').toLowerCase().includes('archive')||String(c.set_name||'').toLowerCase().includes('mystical archive')):[]};
}
const api={make,PACK_CONFIG,specialPools};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MagstaDraftPack=api;
})(typeof window!=='undefined'?window:globalThis);
