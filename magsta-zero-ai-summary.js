/* MAGSTA zero-cost English news helper. Uses only RSS title/description. */
(() => {
  'use strict';
  const KEY='magsta_en_summary_cache_v1', MAX=80;
  const RULES=[['tournament','大会・イベント'],['winner','大会結果・優勝'],['top 8','大会結果・TOP8'],['spoiler','新カード・スポイラー'],['revealed','新カード情報'],['new card','新カード情報'],['price','カード相場'],['prices','カード相場'],['market','カード相場'],['spike','価格上昇'],['deck','デッキ・環境'],['modern','モダン'],['standard','スタンダード'],['commander','統率者'],['ban','禁止・制限'],['banned','禁止・制限'],['announcement','公式発表']];
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
  const save=o=>localStorage.setItem(KEY,JSON.stringify(Object.fromEntries(Object.entries(o).slice(-MAX))));
  function make(article){
    const text=`${article.title||''} ${article.description||''}`.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(), lower=text.toLowerCase();
    const tags=[...new Set(RULES.filter(([k])=>lower.includes(k)).map(([,v])=>v))].slice(0,3);
    let lead='MTGに関する最新情報が掲載されています。';
    if(/tournament|winner|top 8/.test(lower))lead='大会・競技シーンに関する最新情報です。';
    else if(/spoiler|revealed|new card/.test(lower))lead='新カードや新セットに関する情報です。';
    else if(/price|market|spike/.test(lower))lead='カード相場や価格動向に関する話題です。';
    else if(/deck|modern|standard/.test(lower))lead='デッキ構築やMTGの環境に関する話題です。';
    return {title:article.title||'英語記事',lead,detail:text.length>150?`${text.slice(0,147)}…`:text||'記事の概要を確認してください。',tags,generatedAt:new Date().toISOString(),method:'zero-cost-rss-summary'};
  }
  window.MAGSTAZeroSummary={get(article){const c=load(),k=article.id||article.link||article.title;if(!k)return make(article);if(!c[k]){c[k]=make(article);save(c)}return c[k]}};
})();
