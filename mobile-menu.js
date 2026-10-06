(() => {
  const CANONICAL_ORIGIN = 'https://magsta.jp';
  const isLegacyGithub = location.hostname === 'mizuki7minori-blip.github.io';
  const isWww = location.hostname === 'www.magsta.jp';
  let canonicalPath = location.pathname;

  if (isLegacyGithub) {
    canonicalPath = canonicalPath.replace(/^\/magista(?=\/|$)/, '') || '/';
  }
  if (/\/index\.html$/i.test(canonicalPath)) {
    canonicalPath = canonicalPath.replace(/index\.html$/i, '');
  }
  if (isLegacyGithub || isWww || canonicalPath !== location.pathname) {
    location.replace(CANONICAL_ORIGIN + canonicalPath + location.search + location.hash);
    return;
  }

  const english = document.documentElement.lang.toLowerCase().startsWith('en');
  // Analytics is handled by analytics.js to avoid duplicate GA4 loading.
  const header = document.querySelector('.site-header');
  const button = header?.querySelector('.menu-button');
  if (!button) return;
  const close = () => { header.classList.remove('menu-open'); button.setAttribute('aria-expanded','false'); button.setAttribute('aria-label',english ? 'Open menu' : 'メニューを開く'); button.textContent='☰'; };
  button.addEventListener('click', () => { const open = !header.classList.contains('menu-open'); close(); if(open){header.classList.add('menu-open');button.setAttribute('aria-expanded','true');button.setAttribute('aria-label',english ? 'Close menu' : 'メニューを閉じる');button.textContent='×';} });
  document.addEventListener('click', e=>{if(!header.contains(e.target)||e.target.closest('nav a')) close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&header.classList.contains('menu-open')){close();button.focus();}});
  matchMedia('(min-width:761px)').addEventListener('change', close);
})();