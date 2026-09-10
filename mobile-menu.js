(() => {
  'use strict';
  const init = () => {
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
    });
  };
  document.addEventListener('DOMContentLoaded', init);
})();
