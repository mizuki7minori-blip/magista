(()=>{'use strict';
const MEASUREMENT_ID='G-51MGTEG0DS';
window.dataLayer=window.dataLayer||[];
window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
const loadGA=()=>{
  if(document.querySelector('script[data-magsta-ga]'))return;
  const s=document.createElement('script');
  s.async=true;
  s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(MEASUREMENT_ID);
  s.dataset.magstaGa='1';
  document.head.appendChild(s);
  window.gtag('js',new Date());
  window.gtag('config',MEASUREMENT_ID,{send_page_view:true});
};
const scheduleGA=()=>{
  if('requestIdleCallback' in window)requestIdleCallback(loadGA,{timeout:2000});
  else setTimeout(loadGA,700);
};
if(document.readyState==='complete')scheduleGA();
else window.addEventListener('load',scheduleGA,{once:true});

const path=location.pathname.split('/').pop()||'index.html';
const pageType=
  /^article-.*\.html$/i.test(path)?'article':
  path==='limited.html'||path==='limited-tracker.html'?'limited':
  path==='commander.html'||path==='commander-builder.html'?'commander':
  path==='search.html'?'search':
  path==='articles.html'?'article_index':
  path==='index.html'||path===''?'home':'page';

function event(name,params={}){
  if(typeof window.gtag!=='function')return;
  window.gtag('event',name,{page_type:pageType,page_path:location.pathname,...params});
}
window.magstaTrack=event;

document.addEventListener('DOMContentLoaded',()=>{
  event('magsta_page_view',{content_id:path,document_title:document.title});

  if(pageType==='article'){
    const category=document.querySelector('.article-page')?.dataset?.category||document.querySelector('.tag')?.textContent?.trim()||'';
    event('article_view',{content_id:path,article_category:category});
  }

  document.addEventListener('click',e=>{
    const a=e.target.closest('a,button');
    if(!a)return;
    const href=a.tagName==='A'?(a.getAttribute('href')||''):'';
    const label=(a.textContent||'').replace(/\s+/g,' ').trim().slice(0,100);

    if(a.matches('[data-home-action]')){
      event('home_action_click',{action_id:a.dataset.homeAction,link_text:label,link_url:href});return;
    }
    if(a.matches('.article-inline-related a,[data-inline-related]')){
      event('article_related_click',{placement:'inline',link_text:label,link_url:href});return;
    }
    if(a.matches('.related-reading a,.related-reading-card')){
      event('article_related_click',{placement:'footer',link_text:label,link_url:href});return;
    }
    if(a.matches('[data-next-action]')){
      event('article_next_click',{destination:a.dataset.nextAction,link_text:label,link_url:href});return;
    }
    if(a.matches('.affiliate-button,.affiliate-inline-link,.a8-top-banner a')){
      event('affiliate_click',{affiliate_key:a.dataset.affiliateKey||'banner',link_text:label,link_url:a.href||href});return;
    }
    if(a.matches('.format-link')){
      event('format_click',{link_text:label,link_url:href});return;
    }
    if(a.closest('.quick-access-grid')){
      event('tool_click',{tool_area:'quick_access',link_text:label,link_url:href});return;
    }
    if(a.closest('.commander-page,.commander-section')&&href){
      event('commander_click',{link_text:label,link_url:href});return;
    }
    if(a.closest('.limited-page,.limited-section')&&href){
      event('limited_click',{link_text:label,link_url:href});return;
    }
  },{passive:true});

  document.addEventListener('change',e=>{
    const el=e.target;
    if(!(el instanceof HTMLSelectElement||el instanceof HTMLInputElement))return;
    if(['commander-select','budget-select','bracket-select','strategy-select'].includes(el.id)){
      event('commander_setting_change',{control_id:el.id,control_value:String(el.value).slice(0,120)});
      return;
    }
    if(el.closest('.limited-page,.limited-section,#limited-tracker')){
      event('limited_setting_change',{control_id:el.id||el.name||'control',control_value:String(el.value).slice(0,120)});
    }
  });

  document.addEventListener('submit',e=>{
    const form=e.target;
    if(!(form instanceof HTMLFormElement))return;
    if(form.matches('[role="search"],.site-search-form,.article-search')){
      const q=form.querySelector('input[type="search"],input[name="q"]')?.value||'';
      event('site_search',{search_term:String(q).trim().slice(0,120),search_surface:pageType});
    }
  });

  const marks=[25,50,75,90],sent=new Set();
  const onScroll=()=>{
    const max=document.documentElement.scrollHeight-innerHeight;
    if(max<=0)return;
    const pct=Math.round((scrollY/max)*100);
    for(const mark of marks){
      if(pct>=mark&&!sent.has(mark)){
        sent.add(mark);
        event('scroll_depth',{percent_scrolled:mark,content_id:path});
      }
    }
    if(sent.size===marks.length)removeEventListener('scroll',onScroll);
  };
  addEventListener('scroll',onScroll,{passive:true});
});
})();