(() => {
  const builder = document.getElementById('builder');
  const popular = document.getElementById('popular');
  if (!builder && !popular) return;

  let corePromise = null;
  let toolsPromise = null;

  const load = src => new Promise(resolve => {
    const existing = document.querySelector(`script[data-lazy-src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === '1') return resolve();
      existing.addEventListener('load', resolve, {once:true});
      existing.addEventListener('error', resolve, {once:true});
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.dataset.lazySrc = src;
    s.onload = () => { s.dataset.loaded = '1'; resolve(); };
    s.onerror = () => { console.warn('[MAGSTA] load failed:', src); resolve(); };
    document.body.appendChild(s);
  });

  function startCore(){
    if(corePromise) return corePromise;
    corePromise = load('commander.js?v=20261001stable');
    return corePromise;
  }

  function startTools(){
    if(toolsPromise) return toolsPromise;
    toolsPromise = (async()=>{
      await startCore();
      await Promise.all([
        load('commander-dynamic.js?v=20261001j'),
        load('commander-ja.js?v=20261001a'),
        load('commander-strategy.js?v=20261001')
      ]);
      await load('commander-decklist.js?v=20261001b');
      await Promise.all([
        load('commander-card-search.js?v=20261001'),
        load('commander-diagnosis.js?v=20261001b')
      ]);
    })();
    return toolsPromise;
  }

  // 画面に入れば即起動。
  if('IntersectionObserver' in window){
    const coreTargets = [builder, popular].filter(Boolean);
    const io = new IntersectionObserver(entries => {
      if(entries.some(e => e.isIntersecting)){
        io.disconnect();
        startCore();
      }
    }, {rootMargin:'120px 0px', threshold:0});
    coreTargets.forEach(el => io.observe(el));
  }

  // ユーザー操作時は全機能を即起動。
  if(builder){
    const activate = () => startTools();
    builder.addEventListener('pointerdown', activate, {once:true, passive:true});
    builder.addEventListener('focusin', activate, {once:true});
    builder.addEventListener('keydown', activate, {once:true});
  }

  document.querySelectorAll('a[href="#builder"]').forEach(a => {
    a.addEventListener('click', () => startTools(), {once:true});
  });

  // 安全弁：IntersectionObserverが動かない環境でも必ず本体を起動。
  const guaranteedStart = () => setTimeout(() => startCore(), 450);
  if(document.readyState === 'complete' || document.readyState === 'interactive') guaranteedStart();
  else window.addEventListener('DOMContentLoaded', guaranteedStart, {once:true});
})();