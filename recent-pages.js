(()=>{'use strict';
const KEY='magsta_recent_pages_v1';
const cleanTitle=()=>document.title.replace(/｜MAGSTA.*$/,'').trim();
const currentPath=(location.pathname.split('/').pop()||'index.html');
const skip=new Set(['search.html','privacy.html','contact.html','404.html']);
const labelMap={
 'index.html':'MAGSTAトップ',
 'articles.html':'記事一覧',
 'limited.html':'リミテッド攻略',
 'limited-tracker.html':'ドラフト実戦トラッカー',
 'commander.html':'統率者攻略',
 'commander-builder.html':'統率者デッキビルダー',
 'weekly.html':'週間企画',
 'strategy.html':'MAGSTAについて'
};
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
const write=items=>{try{localStorage.setItem(KEY,JSON.stringify(items.slice(0,5)))}catch{}};
if(!skip.has(currentPath)){
  const item={path:currentPath,title:labelMap[currentPath]||cleanTitle(),time:Date.now()};
  const next=[item,...read().filter(x=>x.path!==currentPath)].slice(0,5);
  write(next);
}
const box=document.getElementById('recent-pages');
if(!box)return;
const items=read().filter(x=>x.path!==currentPath);
if(!items.length){box.hidden=true;return;}
const list=box.querySelector('[data-recent-list]');
if(!list)return;
list.innerHTML=items.slice(0,4).map(x=>'<a class="recent-page-card" href="'+x.path+'"><span>最近見た</span><strong>'+x.title+'</strong><b>もう一度見る →</b></a>').join('');
box.hidden=false;
const clear=box.querySelector('[data-recent-clear]');
if(clear)clear.addEventListener('click',()=>{write([]);box.hidden=true;});
})();