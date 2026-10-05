(()=>{'use strict';
const ITEMS=[
 {title:"【MTG】Secret Lair × MSCHF「The Zeta Set」が12月9日に再販決定　24時間限定の受注販売へ",url:'article-zeta-set-2026-10-02.html',type:'記事',text:'NEWS ニュース Secret Lair MSCHF Zeta Set 再販 受注 12月9日 キャンセル'},
 {title:'【10月2日】MTG週末注目情報',url:'article-weekend-2026-10-02.html',type:'記事',text:'リアリティ フラクチャー 新環境 スタンダード 統率者 リミテッド 週末'},
 {title:'リアリティ・フラクチャー ドラフト攻略',url:'article-fra-draft-2026-09-25.html',type:'記事',text:'ドラフト 初手 ピック リミテッド リアリティ フラクチャー'},
 {title:'週末注目情報 9月25日',url:'article-weekend-2026-09-25.html',type:'記事',text:'スタンダード モダン パイオニア ボロス ドラゴン エネルギー エルドラージ'},
 {title:'メタゲームと注目カード動向',url:'article-meta-2026-09.html',type:'記事',text:'メタゲーム 大会 注目カード 環境 ニュース'},
 {title:'リミテッド攻略・環境分析',url:'limited.html',type:'攻略',text:'リミテッド 17lands アーキタイプ 勝率 カードランキング ドラフト シールド'},
 {title:'ドラフト実戦トラッカー',url:'limited-tracker.html',type:'ツール',text:'ドラフト ピック 記録 比較 色 マナカーブ 23枚 実戦 ツール'},
 {title:'統率者攻略・人気ランキング',url:'commander.html',type:'攻略',text:'統率者 commander edh ブラケット 人気 妨害 スピード コンボ 初心者'},
 {title:'統率者デッキビルダー',url:'commander-builder.html',type:'ツール',text:'統率者 デッキ 作成 ビルダー 予算 戦略 コンボ 妨害 スピード'},
 {title:'記事一覧',url:'articles.html',type:'一覧',text:'記事 ニュース 大会 デッキ 環境 コミュニティ'},
 {title:'週間企画',url:'weekly.html',type:'企画',text:'曜日 週間 記事 スタンダード パイオニア モダン レガシー 統率者 パウパー'},
 {title:'MAGSTAについて',url:'strategy.html',type:'案内',text:'運営者 編集方針 犬居 広告 収益化 訂正'},
];
const form=document.getElementById('site-search-form');
const input=document.getElementById('site-search-input');
const status=document.getElementById('search-status');
const results=document.getElementById('search-results');
if(!form||!input||!status||!results)return;
const aliases=[['commander','統率者'],['edh','統率者'],['standard','スタンダード'],['modern','モダン'],['pioneer','パイオニア'],['legacy','レガシー'],['pauper','パウパー'],['draft','ドラフト'],['limited','リミテッド'],['tarmogoyf','タルモゴイフ'],['realityfracture','リアリティフラクチャ']];
const norm=s=>{
 let value=String(s||'').toLowerCase().normalize('NFKC').replace(/[・ー\s:：!?！？|｜]/g,'');
 for(const [english,japanese] of aliases)value=value.replaceAll(english,japanese);
 return value;
};
const clean=value=>new DOMParser().parseFromString(String(value||''),'text/html').body.textContent.replace(/\s+/g,' ').trim();
const safeUrl=value=>{try{const url=new URL(value,location.href);return ['https:','http:'].includes(url.protocol)?url:null;}catch{return null;}};
const urlKey=value=>{
 const url=safeUrl(value);if(!url)return '';
 url.hash='';
 for(const key of [...url.searchParams.keys()])if(/^utm_|^(ref|fbclid|gclid)$/i.test(key))url.searchParams.delete(key);
 return url.href;
};
let catalog=ITEMS,partial=false,loading=true;
function render(q){
 const words=String(q||'').normalize('NFKC').split(/[\s、,]+/).map(norm).filter(Boolean);
 if(!words.length){status.textContent='キーワードを入力してください。スペースで区切ると、すべての語を含むページを探せます。';results.replaceChildren();return;}
 const hits=catalog.map(item=>{
  const title=norm(item.title),hay=norm(item.title+' '+item.text);
  if(!words.every(word=>hay.includes(word)))return null;
  return {...item,score:words.reduce((score,word)=>score+(title.includes(word)?4:1),0)};
 }).filter(Boolean).sort((a,b)=>b.score-a.score);
 status.textContent=(hits.length?'「'+q+'」の検索結果：'+hits.length+'件':'該当するページが見つかりませんでした。キーワードを減らしてお試しください。')+(loading?' / 最新の検索対象を読み込んでいます…':partial?' / 一部の検索対象を取得できなかったため、取得できた範囲を表示しています。':'');
 results.replaceChildren(...hits.map(item=>{
  const link=document.createElement('a');link.className='search-result-card';link.href=item.url;
  if(item.external){link.target='_blank';link.rel='noopener noreferrer';}
  for(const [tag,text] of [['span',item.type],['strong',item.title],['p',item.text.slice(0,180)+(item.text.length>180?'…':'')],['b',item.external?'配信元の記事を読む ↗':'開く →']]){
   const node=document.createElement(tag);node.textContent=text;link.append(node);
  }
  return link;
 }));
}
async function fetchText(path){
 const r=await fetch(path+'?v='+Math.floor(Date.now()/600000),{signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Error('search data');return r.text();
}
async function loadCatalog(){
 const responses=await Promise.allSettled([fetchText('articles.html'),fetchText('rss-cache.json')]);
 const combined=new Map(ITEMS.map(item=>[urlKey(item.url),item]));
 for(let index=0;index<responses.length;index++){
  const response=responses[index];
  if(response.status!=='fulfilled'){partial=true;continue;}
  try{
   if(index===0){
    const doc=new DOMParser().parseFromString(response.value,'text/html');
    for(const node of doc.querySelectorAll('.article-list .article-card')){
     const link=node.querySelector('a.read-more'),title=node.querySelector('h2')?.textContent?.trim();
     const url=safeUrl(link?.getAttribute('href'));
     if(!title||!url||url.origin!==location.origin||!/^article[^/]*\.html$/.test(url.pathname.split('/').pop()))continue;
     const text=[node.querySelector('p')?.textContent||'',...[...node.querySelectorAll('.article-meta span')].map(x=>x.textContent)].join(' ').trim();
     combined.set(urlKey(url.href),{title,url:url.href,type:'編集記事',text});
    }
   }else{
    const data=JSON.parse(response.value);
    if(!Array.isArray(data.items))throw Error('search feed');
    for(const article of data.items){
     const url=safeUrl(article?.link);if(!article?.title||!url)continue;
     const text=[article.title,clean(article.description),article.summary?.text||'',article.sourceName||''].join(' ').trim();
     const title=article.translatedTitle||article.title;
     combined.set(urlKey(url.href),{title,url:url.href,type:article.language==='en'?'海外記事':'配信記事',text,external:url.origin!==location.origin});
    }
   }
  }catch{partial=true;}
 }
 catalog=[...combined.values()];loading=false;render(input.value.trim());
}
form.addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();const u=new URL(location.href);if(q)u.searchParams.set('q',q);else u.searchParams.delete('q');history.replaceState(null,'',u);render(q);});
document.querySelectorAll('[data-search-word]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.searchWord;form.requestSubmit();}));
const initial=new URLSearchParams(location.search).get('q')||'';input.value=initial;render(initial);
loadCatalog();
})();