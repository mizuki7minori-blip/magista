/* MAGSTA RSS summary helper: Japanese-only summaries for English articles. */
(() => {
'use strict';
const KEY='magsta_summary_cache_v6',MAX=120;
const clean=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
const clip=(v,n=520)=>v.length>n?v.slice(0,n).replace(/\s+\S*$/,'')+'…':v;
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
const save=o=>localStorage.setItem(KEY,JSON.stringify(Object.fromEntries(Object.entries(o).slice(-MAX))));
const has=(t,w)=>w.some(x=>t.includes(x));
const sentenceJa=(title,desc,tags)=>{
  const d=clean(desc);
  if(tags.includes('大会'))return d?`この記事は「${title}」について扱っています。${d} 大会結果や上位デッキを通して、現在の競技環境を確認できる内容です。`:`「${title}」はMTGの大会・競技シーンに関する記事です。大会結果や上位デッキなど、現在の環境を確認できる内容です。`;
  if(tags.includes('新カード'))return d?`この記事は「${title}」について扱っています。${d} 新カードの性能や採用先が、今後の環境にどう影響するかがポイントです。`:`「${title}」は新カード・新セットに関する記事です。カードの性能や採用先を確認し、発売後の環境への影響を考える材料になります。`;
  if(tags.includes('カード相場'))return d?`この記事は「${title}」について扱っています。${d} 大会結果や需要、再録などが今後の価格に影響する可能性があります。`:`「${title}」はMTGカードの価格・市場動向に関する記事です。需要や大会結果、再録情報による価格変化に注目したい内容です。`;
  if(tags.includes('デッキ・環境'))return d?`この記事は「${title}」について扱っています。${d} 注目デッキや採用カードの変化から、現在の環境を把握できます。`:`「${title}」はMTGのデッキや環境に関する記事です。注目デッキや採用カードの変化を確認できます。`;
  if(tags.includes('コミュニティ'))return d?`この記事は「${title}」について扱っています。${d} プレイヤーの反応や議論の内容を確認できます。`:`「${title}」はMTGコミュニティで話題になっている内容です。プレイヤーの反応や議論の流れをチェックできます。`;
  return d?`この記事は「${title}」について扱っています。${d} 今回の記事で取り上げられているポイントを短く整理した内容です。`:`「${title}」についてのMTG最新情報です。公開された情報をもとに、話題のポイントを短く整理しています。`;
};
function make(article){
 const title=clean(article.title),desc=clean(article.description),lower=`${title} ${desc}`.toLowerCase(),tags=[];
 if(has(lower,['大会','優勝','top 8','top8','tournament','championship','finals','standings']))tags.push('大会');
 if(has(lower,['価格','相場','買取','高騰','値上がり','値下がり','price','prices','market','spike']))tags.push('カード相場');
 if(has(lower,['新カード','新セット','スポイラー','プレビュー','spoiler','revealed','new card','expansion']))tags.push('新カード');
 if(has(lower,['5ch','5ちゃん','スレ','掲示板','reddit','thread','discussion']))tags.push('コミュニティ');
 if(has(lower,['デッキ','deck','modern','standard','commander','legacy','vintage']))tags.push('デッキ・環境');
 const point=tags.includes('大会')?'次の大会で同じデッキがどれだけ使われるか、対策カードが増えるかに注目。':tags.includes('新カード')?'発売後の採用率と実戦での評価、カード価格の動きに注目。':tags.includes('カード相場')?'大会での使用率、再録情報、需要の変化による価格推移に注目。':tags.includes('デッキ・環境')?'次の大会での使用率と、環境全体への影響に注目。':tags.includes('コミュニティ')?'プレイヤーの反応が今後の環境や話題にどうつながるかに注目。':'今後の公式発表やプレイヤーの反応に注目。';
 return {summary:clip(sentenceJa(title,desc,tags)),point,tags:tags.slice(0,3),language:'ja',method:'japanese-only-summary-v6',generatedAt:new Date().toISOString()};
}
window.MAGSTAZeroSummary={get(article){const c=load(),k=`ja:${article.id||article.link||article.title}`;if(!c[k]){c[k]=make(article);save(c)}return c[k]}};
})();
