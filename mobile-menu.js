(() => {
  const header = document.querySelector('.site-header');
  const button = header?.querySelector('.menu-button');
  if (!button) return;
  const close = () => { header.classList.remove('menu-open'); button.setAttribute('aria-expanded','false'); button.setAttribute('aria-label','メニューを開く'); button.textContent='☰'; };
  button.addEventListener('click', () => { const open = !header.classList.contains('menu-open'); close(); if(open){header.classList.add('menu-open');button.setAttribute('aria-expanded','true');button.setAttribute('aria-label','メニューを閉じる');button.textContent='×';} });
  document.addEventListener('click', e=>{if(!header.contains(e.target)||e.target.closest('nav a')) close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&header.classList.contains('menu-open')){close();button.focus();}});
  matchMedia('(min-width:761px)').addEventListener('change', close);
})();
