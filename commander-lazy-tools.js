(() => {
  const builder = document.getElementById('builder');
  const popular = document.getElementById('popular');
  if (!builder && !popular) return;

  let coreStarted = false;
  let toolsStarted = false;

  const load = src => new Promise(resolve => {
    if (document.querySelector(`script[data-lazy-src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.dataset.lazySrc = src;
    s.onload = resolve;
    s.onerror = resolve;
    document.body.appendChild(s);
  });

  async function startCore(){
    if(coreStarted) return;
    coreStarted = true;
    await load('commander.js?v=20261001ultra');
  }

  async function startTools(){
    if(toolsStarted) return;
    toolsStarted = true;
    await startCore();
    const files = [
      'commander-dynamic.js?v=20261001j',
      'commander-ja.js?v=20261001a',
      'commander-decklist.js?v=20261001b',
      'commander-card-search.js?v=20261001',
      'commander-strategy.js?v=20261001',
      'commander-diagnosis.js?v=20261001b'
    ];
    for(const file of files) await load(file);
  }

  // 人気統率者は実際に画面へ入る直前まで本体JSを読み込まない。
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

  // ビルダーの追加機能は、ユーザーが触った時だけ読み込む。
  if(builder){
    const activate = () => startTools();
    builder.addEventListener('pointerdown', activate, {once:true, passive:true});
    builder.addEventListener('focusin', activate, {once:true});
    builder.addEventListener('keydown', activate, {once:true});
  }

  // 上部の「相性カードを探す」から直接飛んだ場合のみ起動。
  document.querySelectorAll('a[href="#builder"]').forEach(a => {
    a.addEventListener('click', () => { startCore(); startTools(); }, {once:true});
  });

  // IntersectionObserver 非対応ブラウザのみ、完全静止は避けるため load 後に本体だけ読み込む。
  if(!('IntersectionObserver' in window)){
    window.addEventListener('load', startCore, {once:true});
  }
})();