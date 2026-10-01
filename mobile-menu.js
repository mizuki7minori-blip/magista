(() => {
  const GA4_MEASUREMENT_ID = 'G-51MGTEG0DS';

  const loadAnalytics = () => {
    if (!GA4_MEASUREMENT_ID || !/^G-[A-Z0-9]+$/i.test(GA4_MEASUREMENT_ID) || window.__magstaGaLoaded) return;
    window.__magstaGaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID, {
      send_page_view: true,
      page_title: document.title,
      page_location: window.location.href
    });
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_MEASUREMENT_ID)}`;
    document.head.appendChild(gaScript);
  };

  // GA4は初期描画を邪魔しないよう、ブラウザが空いた時に読み込む。
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadAnalytics, {timeout: 3000});
  } else {
    setTimeout(loadAnalytics, 2200);
  }

  const header = document.querySelector('.site-header');
  const button = header?.querySelector('.menu-button');
  if (!button) return;
  const close = () => { header.classList.remove('menu-open'); button.setAttribute('aria-expanded','false'); button.setAttribute('aria-label','メニューを開く'); button.textContent='☰'; };
  button.addEventListener('click', () => { const open = !header.classList.contains('menu-open'); close(); if(open){header.classList.add('menu-open');button.setAttribute('aria-expanded','true');button.setAttribute('aria-label','メニューを閉じる');button.textContent='×';} });
  document.addEventListener('click', e=>{if(!header.contains(e.target)||e.target.closest('nav a')) close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&header.classList.contains('menu-open')){close();button.focus();}});
  matchMedia('(min-width:761px)').addEventListener('change', close);
})();