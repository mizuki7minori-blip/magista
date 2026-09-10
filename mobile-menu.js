(() => {
  'use strict';
  const addStyle = () => {
    if (document.getElementById('magsta-mobile-menu-style')) return;
    const style = document.createElement('style');
    style.id = 'magsta-mobile-menu-style';
    style.textContent = '@media(max-width:800px){.site-header .header-inner{position:relative}.site-header.menu-open nav{display:flex;position:absolute;top:72px;left:0;right:0;z-index:50;flex-direction:column;align-items:stretch;gap:0;padding:8px 14px 14px;background:rgba(8,10,15,.98);border:1px solid var(--line);border-top:0;border-radius:0 0 14px 14px;box-shadow:0 18px 35px rgba(0,0,0,.35)}.site-header.menu-open nav a{padding:12px 10px;border-bottom:1px solid var(--line);font-size:.9rem}.site-header.menu-open nav a:last-child{border-bottom:0}.site-header.menu-open .menu-button{color:var(--accent);font-size:1.5rem}.site-header.menu-open{z-index:100}}';
    document.head.appendChild(style);
  };
  const init = () => {
    addStyle();
    document.querySelectorAll('.menu-button').forEach(button => {
      if (button.dataset.menuReady) return;
      const header = button.closest('.site-header');
      const nav = header?.querySelector('nav');
      if (!header || !nav) return;
      button.dataset.menuReady = '1';
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => {
        const open = header.classList.toggle('menu-open');
        button.setAttribute('aria-expanded', String(open));
        button.textContent = open ? '×' : '☰';
      });
      nav.addEventListener('click', e => {
        if (e.target.closest('a') && header.classList.contains('menu-open')) {
          header.classList.remove('menu-open');
          button.setAttribute('aria-expanded', 'false');
          button.textContent = '☰';
        }
      });
      document.addEventListener('click', e => {
        if (!header.contains(e.target) && header.classList.contains('menu-open')) {
          header.classList.remove('menu-open');
          button.setAttribute('aria-expanded', 'false');
          button.textContent = '☰';
        }
      });
    });
  };
  document.addEventListener('DOMContentLoaded', init);
})();
