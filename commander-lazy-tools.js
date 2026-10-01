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
    s.onerror = resolve;
    document.body.appendChild(s);
  });

  function startCore(){
    if(corePromise) return corePromise;
    corePromise = load('commander.js?v=20261001ultra2');
    return corePromise;
  }

  function startTools(){
    if(toolsPromise) return toolsPromise;
    toolsPromise = (async()=>{
      await startCore();

      // 依存しない機能は並列読み込み。
      await Promise.all([
        load('commander-dynamic.js?v=20261001j'),
        load('commander-ja.js?v=20261001a'),
        load('commander-strategy.js?v=20261001')
      ]);

      // デッキリストを先に作り、その後に依存機能を並列で追加。
      await load('commander-decklist.js?v=20261001b');
      await Promise.all([
        load('commander-card-search.js?v=20261001'),
        load('commander-diagnosis.js?v=20261001b')
      ]);
    })();
    return toolsPromise;
  }

  // ビルダー/人気統率者が画面に入った時だけ本体を起動。
  if('IntersectionObserver' in window){
    const coreTargets = [builder, popular].filter(Boolean);
    const io = new IntersectionObserver(entries => {
      if(entries.some(e => e.isIntersecting)){
        io.disconnect();
        startCore();
      }
    }, {rootMargin:'0px', threshold:0.01});
    coreTargets.forEach(el => io.observe(el));
  }

  // 操作された場合は追加機能を即読み込み。
  if(builder){
    const activate = () => startTools();
    builder.addEventListener('pointerdown', activate, {once:true, passive:true});
    builder.addEventListener('focusin', activate, {once:true});
    builder.addEventListener('keydown', activate, {once:true});
  }

  document.querySelectorAll('a[href="#builder"]').forEach(a => {
    a.addEventListener('click', () => startTools(), {once:true});
  });

  if(!('IntersectionObserver' in window)){
    window.addEventListener('load', startCore, {once:true});
  }
})();