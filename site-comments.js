(() => {
  'use strict';
  const shortname = (window.MAGSTA_COMMENTS?.shortname || '').trim();
  // Keep unfinished integration out of the published reader experience.
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(shortname)) return;
  const main = document.querySelector('main');
  if (!main || document.getElementById('disqus_thread')) return;
  const en = document.documentElement.lang.startsWith('en');
  const words = en ? {
    title: 'Questions and comments', note: 'Ask a question or share your experience. Guest posting requires a name and email address. Guest comments appear after approval.',
    button: 'Open comments', loading: 'Loading comments…', error: 'Comments could not be loaded. Please try again.', retry: 'Try again'
  } : {
    title: '質問・コメント', note: '質問や使ってみた感想をどうぞ。ゲスト投稿には名前とメールアドレスが必要です。ゲストのコメントは承認後に表示されます。',
    button: 'コメント欄を開く', loading: 'コメント欄を読み込み中…', error: 'コメント欄を読み込めませんでした。もう一度お試しください。', retry: '再読み込み'
  };
  const section = document.createElement('section');
  section.id = 'comments'; section.className = 'container comments';
  const title = document.createElement('h2'); title.textContent = words.title;
  const note = document.createElement('p'); note.className = 'comment-note'; note.textContent = words.note;
  const button = document.createElement('button'); button.type = 'button'; button.className = 'button secondary'; button.textContent = words.button;
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  const thread = document.createElement('div'); thread.id = 'disqus_thread';
  button.setAttribute('aria-controls', 'disqus_thread');
  button.setAttribute('aria-expanded', 'false');
  section.setAttribute('aria-label', words.title);
  let timer;
  let activeScript;
  let attempt = 0;
  function ready() {
    clearTimeout(timer); button.hidden = true; button.disabled = false;
    button.setAttribute('aria-expanded', 'true'); status.textContent = '';
    thread.removeAttribute('aria-busy');
  }
  section.append(title, note, button, status, thread); main.append(section);
  // Canonical host and path keep old-domain and tracking links in the same thread.
  // The /en/ path intentionally creates a separate English discussion.
  const canonical = new URL(document.querySelector('link[rel="canonical"]')?.href || location.href);
  const url = new URL(canonical.pathname, 'https://magsta.jp');
  if (url.pathname.endsWith('/index.html')) url.pathname = url.pathname.slice(0, -10);
  if (url.pathname.endsWith('/article.html')) {
    const id = canonical.searchParams.get('id') || new URL(location.href).searchParams.get('id');
    if (id) url.searchParams.set('id', id);
  }
  window.disqus_config = function () {
    this.page.url = url.href;
    this.page.identifier = 'magsta:' + url.pathname + url.search;
    this.page.title = document.title;
    this.language = en ? 'en' : 'ja';
    this.callbacks = { onReady: [ready] };
  };
  button.addEventListener('click', () => {
    if (button.disabled) return;
    const current = ++attempt;
    button.disabled = true; status.textContent = words.loading;
    thread.setAttribute('aria-busy', 'true');
    const fail = () => {
      if (current !== attempt) return;
      clearTimeout(timer); activeScript?.remove();
      button.hidden = false; button.disabled = false;
      button.textContent = words.retry; status.textContent = words.error;
      thread.removeAttribute('aria-busy');
    };
    timer = setTimeout(fail, 20000);
    if (window.DISQUS?.reset) {
      try { window.DISQUS.reset({ reload: true, config: window.disqus_config }); }
      catch (_) { fail(); }
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://' + shortname + '.disqus.com/embed.js';
    script.dataset.timestamp = String(Date.now());
    activeScript = script;
    script.onerror = fail;
    // Wait for the widget's onReady callback, not just its script download.
    script.onload = () => { if (current !== attempt) script.remove(); };
    document.head.append(script);
  });
})();
