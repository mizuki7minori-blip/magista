/* MAGSTA zero-cost RSS summary helper. Uses RSS title/description only. */
(() => {
  'use strict';
  const KEY='magsta_summary_cache_v3', MAX=120;
  const RULES=[['大会','大会'],['tournament','大会'],['winner','大会結果'],['top 8','TOP8'],['top8','TOP8'],['spoiler','新カード'],['revealed','新カード'],['new card','新カード'],['新カード','新カード'],['price','カード相場'],['prices','カード相場'],['market','カード相場'],['spike','価格上昇'],['高騰','価格上昇'],['値上がり','価格上昇'],['値下がり','価格下落'],['deck','デッキ・環境'],['デッキ','デッキ・環境'],['modern','モダン'],['standard','スタンダード'],['commander','統率者'],['ban','禁止・制限'],['banned','禁止・制限'],['禁止','禁止・制限'],['announcement','公式発表'],['発表','公式発表']];
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
  const save=o=>localStorage.setItem(KEY,JSON.stringify(Object.fromEntries(Object.entries(o).slice(-MAX))));
  function make(article,language='en'){
    const text=`${article.title||''} ${article.description||''}`.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(), lower=text.toLowerCase();
    const tags=[...new Set(RULES.filter(([k])=>lower.includes(k.toLowerCase())).map(([,v])=>v))].slice(0,3);
    let what='MTGに関する最新情報を扱った記事です。';
    let point='記事のタイトルとRSS概要から、今回の話題のポイントを短く整理しています。';
    if(/大会|tournament|winner|top 8|top8/.test(lower)){what='MTGの大会・競技シーンに関する記事です。';point='大会結果や上位入賞デッキなど、現在の競技環境をチェックできる内容です。';}
    else if(/新カード|spoiler|revealed|new card/.test(lower)){what='新カードや新セットに関する記事です。';point='公開されたカードやセット情報が、今後の環境や相場に影響する可能性があります。';}
    else if(/価格|相場|高騰|値上がり|値下がり|price|prices|market|spike/.test(lower)){what='MTGカードの価格・市場動向に関する記事です。';point='需要や大会結果、供給状況などによる価格変化をチェックする話題です。';}
    else if(/デッキ|deck|modern|standard|commander/.test(lower)){what='MTGのデッキ・環境に関する記事です。';point='注目デッキや環境の変化を把握するための情報です。';}
    else if(/禁止|ban|banned/.test(lower)){what='MTGの禁止・制限やルールに関する記事です。';point='環境やデッキ構築に影響する可能性がある公式・競技情報です。';}
    return {title:article.title||'MTG記事',what,point,tags,detail:text,generatedAt:new Date().toISOString(),language,method:'zero-cost-rss-summary'};
  }
  window.MAGSTAZeroSummary={get(article,language='en'){const c=load(),k=`${language}:${article.id||article.link||article.title}`;if(!c[k]){c[k]=make(article,language);save(c)}return c[k]}};
})();
