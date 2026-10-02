(()=>{'use strict';
const ITEMS=[
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
const norm=s=>(s||'').toLowerCase().normalize('NFKC').replace(/[・ー\s]/g,'');
const render=q=>{
 const n=norm(q);
 if(!n){status.textContent='キーワードを入力してください。';results.innerHTML='';return;}
 const words=n.split(/[、,]+/).filter(Boolean);
 const hits=ITEMS.map(item=>{
   const hay=norm(item.title+' '+item.text);
   const score=words.reduce((s,w)=>s+(hay.includes(w)?1:0),0)+(norm(item.title).includes(n)?2:0);
   return {...item,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
 status.textContent=hits.length?('「'+q+'」の検索結果：'+hits.length+'件'):'該当するページが見つかりませんでした。';
 results.innerHTML=hits.map(x=>'<a class="search-result-card" href="'+x.url+'"><span>'+x.type+'</span><strong>'+x.title+'</strong><p>'+x.text+'</p><b>開く →</b></a>').join('');
};
form.addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();const u=new URL(location.href);if(q)u.searchParams.set('q',q);else u.searchParams.delete('q');history.replaceState(null,'',u);render(q);});
document.querySelectorAll('[data-search-word]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.searchWord;form.requestSubmit();}));
const initial=new URLSearchParams(location.search).get('q')||'';input.value=initial;if(initial)render(initial);
})();