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
    corePromise = (async()=>{
      await load('commander.js?v=20261001stable2');
      await load('commander-search-cleanup.js?v=20261001');
      await load('commander-dynamic.js?v=20261001selectfix');
    })();
    return corePromise;
  }

  function startTools(){
    if(toolsPromise) return toolsPromise;
    toolsPromise = (async()=>{
      await startCore();
      await Promise.all([
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

  if(builder){
    builder.addEventListener('click', e => {
      const button = e.target.closest('button');
      if(!button) return;
      // 検索・候補選択では重い補助機能を起動しない。
      if(button.closest('.any-commander') || button.classList.contains('commander-chip')) return;
      startTools();
    }, {passive:true});

    builder.addEventListener('change', e => {
      if(e.target.matches('select')) {
        // 統率者選択直後は候補カード描画を優先し、補助機能は十分後に回す。
        const run = () => startTools();
        if('requestIdleCallback' in window) requestIdleCallback(run, {timeout:3000});
        else setTimeout(run, 1500);
      }
    });
  }

  document.querySelectorAll('a[href="#builder"]').forEach(a => {
    a.addEventListener('click', () => startCore(), {once:true});
  });

  const guaranteedStart = () => setTimeout(() => startCore(), 450);
  if(document.readyState === 'complete' || document.readyState === 'interactive') guaranteedStart();
  else window.addEventListener('DOMContentLoaded', guaranteedStart, {once:true});
})();