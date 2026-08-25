/* MAGSTA RSS summary helper. Builds a clearer 2-4 sentence summary from the RSS title/description without copying article text. */
(() => {
  'use strict';
  const KEY='magsta_summary_cache_v4', MAX=120;
  const clean=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim();
  const clip=(v,n=260)=>v.length>n?v.slice(0,n).replace(/\s+\S*$/,'')+'…':v;
  const escape=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
  const save=o=>localStorage.setItem(KEY,JSON.stringify(Object.fromEntries(Object.entries(o).slice(-MAX))));
  const has=(t,words)=>words.some(w=>t.toLowerCase().includes(w));
  function make(article,language='ja'){
    const title=clean(article.title), desc=clean(article.description), text=clean(`${title} ${desc}`), lower=text.toLowerCase();
    const tags=[];
    if(has(lower,['大会','優勝','top 8','top8','tournament','championship','finals','standings'])) tags.push('大会');
    if(has(lower,['価格','相場','買取','高騰','値上がり','値下がり','price','prices','market','spike'])) tags.push('カード相場');
    if(has(lower,['新カード','新セット','スポイラー','プレビュー','spoiler','revealed','new card','expansion'])) tags.push('新カード');
    if(has(lower,['5ch','5ちゃん','スレ','掲示板','reddit','thread','discussion'])) tags.push('コミュニティ');
    if(has(lower,['デッキ','deck','modern','standard','commander','legacy','vintage'])) tags.push('デッキ・環境');
    let summary='';
    if(desc && desc.length>35){
      const d=clip(desc,320);
      summary=language==='en'
        ? `この記事では「${title}」について紹介しています。${d}`
        : `この記事では「${title}」について紹介しています。${d}`;
    } else {
      if(tags.includes('大会')) summary=`「${title}」はMTGの大会・競技シーンに関する話題です。大会結果や上位デッキなど、現在の競技環境を確認する材料になります。`;
      else if(tags.includes('カード相場')) summary=`「${title}」はMTGカードの価格や市場動向に関する話題です。需要や大会結果、供給状況によって今後の価格が動く可能性があります。`;
      else if(tags.includes('新カード')) summary=`「${title}」は新カード・新セットに関する話題です。公開されたカードの性能や採用先によって、今後の環境や相場への影響が注目されます。`;
      else if(tags.includes('デッキ・環境')) summary=`「${title}」はMTGのデッキや環境に関する話題です。注目されているデッキや採用カードの変化を追うことで、現在の環境を把握できます。`;
      else if(tags.includes('コミュニティ')) summary=`「${title}」はMTGコミュニティで話題になっている内容です。プレイヤーの反応や議論の流れをチェックできます。`;
      else summary=`「${title}」についてのMTG最新情報です。記事のタイトルと公開された概要をもとに、話題のポイントを短く整理しています。`;
    }
    const point=tags.includes('大会')?'大会での採用状況や次のイベントでの動きに注目。':tags.includes('カード相場')?'今後の大会結果・再録情報・需要による価格変動に注目。':tags.includes('新カード')?'発売後の採用率とカード価格の動きに注目。':tags.includes('デッキ・環境')?'今後の大会での使用率や環境への影響に注目。':tags.includes('コミュニティ')?'プレイヤーの反応が今後の話題や環境にどう影響するかに注目。':'今後の公式発表やプレイヤーの反応に注目。';
    return {summary:clip(summary,520),point,tags:tags.slice(0,3),generatedAt:new Date().toISOString(),language,method:'rss-title-description-summary-v4'};
  }
  window.MAGSTAZeroSummary={get(article,language='ja'){const c=load(),k=`${language}:${article.id||article.link||article.title}`;if(!c[k]){c[k]=make(article,language);save(c)}return c[k]}};
})();
