(()=>{'use strict';
const add=(src)=>new Promise((resolve,reject)=>{
  if(document.querySelector('script[src^="'+src.split('?')[0]+'"]')) return resolve();
  const s=document.createElement('script');
  s.src=src;
  s.defer=true;
  s.onload=resolve;
  s.onerror=reject;
  document.body.appendChild(s);
});
const idle=(fn,delay=1200)=>{
  if('requestIdleCallback' in window) requestIdleCallback(fn,{timeout:delay+1200});
  else setTimeout(fn,delay);
};
const start=()=>{
  idle(()=>add('article-card-preview.js?v=20261006-lite1'),1400);
  idle(()=>add('related-articles.js?v=20261006-lite1'),1800);
  idle(()=>add('analytics.js?v=20261006-lite1'),2200);
  const affiliate=document.getElementById('affiliate-products');
  if(affiliate&&'IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{
      if(entries.some(e=>e.isIntersecting)){
        io.disconnect();
        add('affiliate-config.js?v=20261006-1').then(()=>add('affiliate.js?v=20261006-lite1')).catch(()=>{});
      }
    },{rootMargin:'700px 0px'});
    io.observe(affiliate);
  }else if(affiliate){
    idle(()=>add('affiliate-config.js?v=20261006-1').then(()=>add('affiliate.js?v=20261006-lite1')).catch(()=>{}),2600);
  }
};
const loadAdsense=()=>{if(document.querySelector('script[data-magsta-adsense]'))return;const s=document.createElement('script');s.async=true;s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1448821491188838';s.crossOrigin='anonymous';s.dataset.magstaAdsense='1';document.head.appendChild(s);};
const scheduleAdsense=()=>{'requestIdleCallback'in window?requestIdleCallback(loadAdsense,{timeout:5000}):setTimeout(loadAdsense,4000);};
window.addEventListener('scroll',scheduleAdsense,{once:true,passive:true});
window.addEventListener('pointerdown',scheduleAdsense,{once:true,passive:true});
if(document.readyState==='complete') start();
else window.addEventListener('load',start,{once:true});
})();