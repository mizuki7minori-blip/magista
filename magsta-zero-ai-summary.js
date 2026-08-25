/* MAGSTA RSS summary helper: extracts concrete facts from RSS title/description and separates facts from editorial attention points. */
(() => {
  'use strict';
  const KEY='magsta_summary_cache_v5', MAX=120;
  const clean=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
  const clip=(v,n=520)=>v.length>n?v.slice(0,n).replace(/\s+\S*$/,'')+'…':v;
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
  const save=o=>localStorage.setItem(KEY,JSON.stringify(Object.fromEntries(Object.entries(o).slice(-MAX))));
  const has=(t,words)=>words.some(w=>t.includes(w));
  const sentences=v=>clean(v).split(/(?<=[。！？.!?])\s*/).filter(Boolean);
  const factLines=(title,desc)=>{
    const ss=sentences(desc);
    if(ss.length>=2)return ss.slice(0,3);
    if(desc.length>40)return [desc];
    return [];
  };
  function make(article,language='ja'){
    const title=clean(article.title),desc=clean(article.description),lower=`${title} ${desc}`.toLowerCase();
    const tags=[];
    if(has(lower,['大会','優勝','top 8','top8','tournament','championship','finals','standings']))tags.push('大会');
    if(has(lower,['価格','相場','買取','高騰','値上がり','値下がり','price','prices','market','spike']))tags.push('カード相場');
    if(has(lower,['新カード','新セット','スポイラー','プレビュー','spoiler','revealed','new card','expansion']))tags.push('新カード');
    if(has(lower,['5ch','5ちゃん','スレ','掲示板','reddit','thread','discussion']))tags.push('コミュニティ');
    if(has(lower,['デッキ','deck','modern','standard','commander','legacy','vintage']))tags.push('デッキ・環境');
    const facts=factLines(title,desc);
    let summary='';
    if(facts.length){
      summary=language==='en'
        ? `記事の概要：${facts.join(' ')}`
        : `記事の内容：${facts.join(' ')}`;
      if(summary.length<150)summary+=` 「${title}」について、今回発表された内容を中心に紹介しています。`;
    }else if(tags.includes('大会')){
      summary=`「${title}」では、MTGの大会・競技シーンに関する最新情報を紹介しています。大会結果や上位デッキなど、現在の競技環境を確認するための記事です。`;
    }else if(tags.includes('カード相場')){
      summary=`「${title}」では、MTGカードの価格・市場動向について紹介しています。需要、大会結果、供給量などがカード評価や相場に影響する可能性があります。`;
    }else if(tags.includes('新カード')){
      summary=`「${title}」では、新カードや新セットについて紹介しています。カードの能力や採用先を確認し、発売後の環境への影響を考える材料になる記事です。`;
    }else if(tags.includes('デッキ・環境')){
      summary=`「${title}」では、MTGのデッキ構築や環境の変化について紹介しています。注目デッキや採用カードの動きを確認できる内容です。`;
    }else{
      summary=`「${title}」についてのMTG最新情報です。公開された記事概要をもとに、今回取り上げられている内容を短く整理しています。`;
    }
    let point='';
    if(tags.includes('大会'))point='今回の結果が次の大会のデッキ選択や対策にどう影響するかをチェック。';
    else if(tags.includes('カード相場'))point='大会での使用率・再録情報・需要の変化が、今後の価格にどう影響するかをチェック。';
    else if(tags.includes('新カード'))point='実際の採用率と発売後の評価、カード価格の動きをチェック。';
    else if(tags.includes('デッキ・環境'))point='次の大会で同じデッキやカードがどれだけ使われるかをチェック。';
    else if(tags.includes('コミュニティ'))point='プレイヤーの反応が今後の環境や話題にどうつながるかをチェック。';
    else point='今後の公式発表やプレイヤーの反応に注目。';
    return {summary:clip(summary),point,tags:tags.slice(0,3),sourceDescription:desc,generatedAt:new Date().toISOString(),language,method:'rss-factual-summary-v5'};
  }
  window.MAGSTAZeroSummary={get(article,language='ja'){const c=load(),k=`${language}:${article.id||article.link||article.title}`;if(!c[k]){c[k]=make(article,language);save(c)}return c[k]}};
})();
