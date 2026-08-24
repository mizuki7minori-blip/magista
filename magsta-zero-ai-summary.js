/* MAGSTA zero-cost English news helper. RSS title/description only. */
(() => {
  'use strict';
  const KEY='magsta_en_summary_cache_v2', MAX=80;
  const RULES=[['tournament','大会'],['winner','大会結果'],['top 8','TOP8'],['top8','TOP8'],['spoiler','新カード'],['revealed','新カード'],['new card','新カード'],['price','カード相場'],['prices','カード相場'],['market','カード相場'],['spike','価格上昇'],['deck','デッキ・環境'],['modern','モダン'],['standard','スタンダード'],['commander','統率者'],['ban','禁止・制限'],['banned','禁止・制限'],['announcement','公式発表']];
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
  const save=o=>localStorage.setItem(KEY,JSON.stringify(Object.fromEntries(Object.entries(o).slice(-MAX))));
  function make(article){
    const text=`${article.title||''} ${article.description||''}`.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(), lower=text.toLowerCase();
    const tags=[...new Set(RULES.filter(([k])=>lower.includes(k)).map(([,v])=>v))].slice(0,3);
    let what='MTGに関する最新情報を扱った記事です。';
    let point='記事の詳細を確認すると、今回の話題の背景や影響を確認できます。';
    if(/tournament|winner|top 8|top8/.test(lower)){what='MTGの大会・競技シーンに関する記事です。';point='大会結果や上位入賞デッキなど、現在の競技環境をチェックできる内容です。';}
    else if(/spoiler|revealed|new card/.test(lower)){what='新カードや新セットに関する記事です。';point='公開されたカードやセット情報が、今後の環境・相場に影響する可能性があります。';}
    else if(/price|prices|market|spike/.test(lower)){what='MTGカードの価格・市場動向に関する記事です。';point='需要や大会結果などによる価格変化をチェックするのに役立つ話題です。';}
    else if(/deck|modern|standard|commander/.test(lower)){what='MTGのデッキ・環境に関する記事です。';point='注目デッキや環境の変化を把握するための情報です。';}
    const category=tags.length?tags.join('・'):'MTGニュース';
    return {title:article.title||'英語記事',what,point,category,tags,detail:text,generatedAt:new Date().toISOString(),method:'zero-cost-rss-summary'};
  }
  window.MAGSTAZeroSummary={get(article){const c=load(),k=article.id||article.link||article.title;if(!k)return make(article);if(!c[k]){c[k]=make(article);save(c)}return c[k]}};
})();
