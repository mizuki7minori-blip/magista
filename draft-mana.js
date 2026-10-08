/* Casting requirements are distinct from a card's colors. No network or DOM. */
(function(root){'use strict';
const colorList=c=>(c?.colors||c?.card_faces?.[0]?.colors||[]).filter(x=>/^[WUBRG]$/.test(x));
function requirements(card,available=[],weights={}){
 const cost=String(card?.card_faces?.[0]?.mana_cost??card?.mana_cost??'');
 const tokens=[...cost.matchAll(/\{([^}]+)\}/g)].map(m=>m[1]);
 // Life, generic-hybrid, snow and colorless alternatives need separate models.
 // Keep the existing conservative color test for unsupported or absent costs.
 if(!tokens.length||tokens.some(t=>!/^([0-9]+|X|[WUBRG]|[WUBRG]\/[WUBRG])$/.test(t)))return {colors:colorList(card),pips:null,hybrid:false,modelled:false};
 const pips={},hybrids=tokens.filter(t=>t.includes('/'));
 for(const t of tokens)if(/^[WUBRG]$/.test(t))pips[t]=(pips[t]||0)+1;
 for(const t of hybrids){
  const choices=t.split('/');
  choices.sort((a,b)=>Number(available.includes(b))-Number(available.includes(a))||(weights[b]||0)-(weights[a]||0)||(pips[b]||0)-(pips[a]||0)||'WUBRG'.indexOf(a)-'WUBRG'.indexOf(b));
  const color=choices[0];pips[color]=(pips[color]||0)+1;
 }
 return {colors:Object.keys(pips),pips,hybrid:hybrids.length>0,modelled:true};
}
const fitsColors=(card,available)=>requirements(card,available).colors.every(c=>available.includes(c));
const api={requirements,fitsColors};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MagstaDraftMana=api;
})(typeof window!=='undefined'?window:globalThis);
