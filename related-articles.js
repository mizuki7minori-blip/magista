(()=>{'use strict';
const current=(location.pathname.split('/').pop()||'index.html');
const ARTICLES=[
 {path:'article-weekend-2026-10-02.html',tag:'週末注目情報',title:'【10月2日】新環境スタンダードとリアリティ・フラクチャーをチェック',desc:'新セット発売後に見るべきデッキ・統率者・リミテッドのポイントを整理。'},
 {path:'article-fra-draft-2026-09-25.html',tag:'リミテッド',title:'リアリティ・フラクチャー ドラフト初手候補とピック方針',desc:'初手候補、色の選び方、序盤から終盤までの考え方をまとめて確認。'},
 {path:'article-weekend-2026-09-25.html',tag:'週末注目情報',title:'スタンダード・モダン・パイオニアの直近環境を確認',desc:'ボロス・ドラゴンやエネルギー、エルドラージなど直近の大会動向を整理。'},
 {path:'article-meta-2026-09.html',tag:'NEWS',title:'MTGメタゲームと注目カード動向 調査まとめ',desc:'大会結果とコミュニティ評価を分けながら環境の見方を整理。'}
];
const article=document.querySelector('.article-page');
if(!article)return;
const candidates=ARTICLES.filter(a=>a.path!==current).slice(0,3);
if(!candidates.length)return;
const section=document.createElement('section');
section.className='related-reading';
section.innerHTML='<div class="section-heading"><div><span class="section-kicker">NEXT READ</span><h2>次に読む</h2></div><a href="articles.html">記事一覧 →</a></div><div class="related-reading-grid">'+
 candidates.map(a=>'<a class="related-reading-card" href="'+a.path+'"><span>'+a.tag+'</span><strong>'+a.title+'</strong><p>'+a.desc+'</p><b>続きを読む →</b></a>').join('')+
 '</div>';
const aff=article.querySelector('#affiliate-products');
if(aff)article.insertBefore(section,aff);
else article.appendChild(section);
})();