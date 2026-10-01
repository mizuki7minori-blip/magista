(() => {
  // MAGSTA GA4 loader. Set this to the GA4 Measurement ID (G-XXXXXXXXXX)
  // once the Google Analytics property has been created.
  const GA4_MEASUREMENT_ID = '';

  if (GA4_MEASUREMENT_ID && /^G-[A-Z0-9]+$/i.test(GA4_MEASUREMENT_ID)) {
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
