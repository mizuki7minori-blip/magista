/* MAGSTA article summary helper. Uses article-body text when a supported publisher can be fetched; otherwise falls back to RSS title/description. */
(() => {
  'use strict';
  const KEY='magsta_summary_cache_v6', MAX=120, FETCH_TIMEOUT=10000;
  const BODY_SOURCES=['magic.wizards.com','mtg-jp.com','mtggoldfish.com','4gamer.net','5chant.com'];
  const clean=v=>String(v||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
  const clip=(v,n=700)=>v.length>n?v.slice(0,n).replace(/\s+\S*$/,'')+'…':v;
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
  const save=o=>localStorage.setItem(KEY,JSON.stringify(Object.fromEntries(Object.entries(o).slice(-MAX))));
  const has=(t,words)=>words.some(w=>t.includes(w));
  const sentences=v=>clean(v).split(/(?<=[。！？.!?])\s*/).filter(Boolean);
  const supported=url=>{try{return BODY_SOURCES.some(d=>new URL(url).hostname===d||new URL(url).hostname.endsWith(`.${d}`))}catch{return false}};
  async function fetchBody(url){
    if(!supported(url))return '';
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),FETCH_TIMEOUT);
    try{
      const reader=`https://r.jina.ai/${url}`;
      const r=await fetch(reader,{signal:controller.signal,cache:'no-store'});
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const raw=await r.text();
      const text=clean(raw);
      return text.length>500?text.slice(0,12000):'';
    }catch(e){console.warn('[MAGSTA summary] article body unavailable',e);return ''}
    finally{clearTimeout(timer)}
  }
  function classify(title,body){const lower=`${title} ${body}`.toLowerCase();const tags=[];if(has(lower,['大会','優勝','top 8','top8','tournament','championship','finals','standings']))tags.push('大会');if(has(lower,['価格','相場','買取','高騰','値上がり','値下がり','price','prices','market','spike']))tags.push('カード相場');if(has(lower,['新カード','新セット','スポイラー','プレビュー','spoiler','revealed','new card','expansion']))tags.push('新カード');if(has(lower,['5ch','5ちゃん','スレ','掲示板','reddit','thread','discussion']))tags.push('コミュニティ');if(has(lower,['デッキ','deck','modern','standard','commander','legacy','vintage']))tags.push('デッキ・環境');return tags.slice(0,3)}
  function make(article,language,body=''){
    const title=clean(article.title),desc=clean(article.description),source=body?clean(body):desc, lower=`${title} ${source}`.toLowerCase(),tags=classify(title,source),ss=sentences(source);
    let summary;
    if(body){
      const useful=ss.filter(s=>s.length>25&&!/^https?:/i.test(s)).slice(0,5);
      summary=`この記事では「${title}」について、${useful.join(' ')}`;
      if(summary.length<180)summary+=` 記事本文では、今回の発表・結果・変更点について詳しく紹介されています。`;
    }else if(ss.length>=2){summary=`記事の概要：${ss.slice(0,3).join(' ')}`;}
    else if(tags.includes('大会'))summary=`「${title}」はMTGの大会・競技シーンに関する話題です。大会結果や上位デッキなど、現在の競技環境を確認する材料になります。`;
    else if(tags.includes('カード相場'))summary=`「${title}」はMTGカードの価格・市場動向に関する話題です。需要や大会結果、供給状況などが価格に影響する可能性があります。`;
    else if(tags.includes('新カード'))summary=`「${title}」は新カード・新セットに関する話題です。カードの性能や採用先を確認し、発売後の環境への影響を考える材料になります。`;
    else summary=`「${title}」についてのMTG最新情報です。公開された記事概要をもとに、今回取り上げられている内容を短く整理しています。`;
    let point='';if(tags.includes('大会'))point='今回の結果が次の大会のデッキ選択や対策にどう影響するかをチェック。';else if(tags.includes('カード相場'))point='大会での使用率・再録情報・需要の変化が、今後の価格にどう影響するかをチェック。';else if(tags.includes('新カード'))point='実際の採用率と発売後の評価、カード価格の動きをチェック。';else if(tags.includes('デッキ・環境'))point='次の大会で同じデッキやカードがどれだけ使われるかをチェック。';else if(tags.includes('コミュニティ'))point='プレイヤーの反応が今後の環境や話題にどうつながるかをチェック。';else point='今後の公式発表やプレイヤーの反応に注目。';
    return {summary:clip(summary),point,tags,bodyBased:!!body,generatedAt:new Date().toISOString(),language,method:body?'article-body-v6':'rss-fallback-v6'};
  }
  window.MAGSTAZeroSummary={
    async get(article,language='ja'){
      const c=load(),k=`${language}:${article.id||article.link||article.title}`;
      if(c[k]&&c[k].method==='article-body-v6')return c[k];
      const body=await fetchBody(article.link);
      const result=make(article,language,body);
      c[k]=result;save(c);return result;
    }
  };
})();
