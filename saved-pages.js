(()=>{'use strict';
const KEY='magsta_saved_pages_v1';
const currentPath=(location.pathname.split('/').pop()||'index.html');
const skip=new Set(['index.html','search.html','privacy.html','contact.html','404.html']);
const title=()=>document.querySelector('h1')?.textContent.trim()||document.title.replace(/｜MAGSTA.*$/,'').trim();
const type=()=>{
 if(currentPath.includes('article')) return '記事';
 if(currentPath.includes('limited')) return 'リミテッド';
 if(currentPath.includes('commander')) return '統率者';
 if(currentPath==='weekly.html') return '企画';
 return 'ページ';
};
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
const write=x=>{try{localStorage.setItem(KEY,JSON.stringify(x.slice(0,20)))}catch{}};
const isSaved=()=>read().some(x=>x.path===currentPath);
const toggle=btn=>{
 let items=read();
 if(items.some(x=>x.path===currentPath)){
   items=items.filter(x=>x.path!==currentPath);
 }else{
   items.unshift({path:currentPath,title:title(),type:type(),time:Date.now()});
 }
 write(items);
 paint(btn);
 renderHome();
};
const paint=btn=>{
 const saved=isSaved();
 btn.textContent=saved?'★ 保存済み':'☆ あとで読む';
 btn.setAttribute('aria-pressed',saved?'true':'false');
 btn.classList.toggle('is-saved',saved);
};
if(!skip.has(currentPath)){
 const main=document.querySelector('main');
 const target=document.querySelector('.article-meta')||document.querySelector('.limited-hero')||document.querySelector('.commander-hero-main')||document.querySelector('.page-hero .container')||main;
 if(target && !document.querySelector('[data-save-page]')){
   const btn=document.createElement('button');
   btn.type='button';btn.className='save-page-button';btn.dataset.savePage='';
   btn.addEventListener('click',()=>toggle(btn));
   paint(btn);
   if(target.classList.contains('article-meta')) target.appendChild(btn);
   else target.insertAdjacentElement('afterbegin',btn);
 }
}
function renderHome(){
 const box=document.getElementById('saved-pages');
 if(!box)return;
 const list=box.querySelector('[data-saved-list]');
 const items=read();
 if(!items.length){box.hidden=true;if(list)list.innerHTML='';return;}
 box.hidden=false;
 if(list) list.innerHTML=items.slice(0,6).map(x=>'<a class="saved-page-card" href="'+x.path+'"><span>'+x.type+'</span><strong>'+x.title+'</strong><b>開く →</b></a>').join('');
}
document.querySelector('[data-saved-clear]')?.addEventListener('click',()=>{write([]);renderHome();});
renderHome();
})();