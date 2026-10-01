(() => {
  const target = document.getElementById('builder');
  if (!target) return;
  let started = false;
  const files = [
    'commander-dynamic.js?v=20261001j',
    'commander-ja.js?v=20261001a',
    'commander-decklist.js?v=20261001b',
    'commander-card-search.js?v=20261001',
    'commander-strategy.js?v=20261001',
    'commander-diagnosis.js?v=20261001b'
  ];
  const load = src => new Promise(resolve => {
    const s = document.createElement('script');
    s.src = src;
    s.defer = true;
    s.onload = resolve;
    s.onerror = resolve;
    document.body.appendChild(s);
  });
  async function start(){
    if(started) return;
    started = true;
    for(const file of files) await load(file);
  }
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver(entries => {
      if(entries.some(e => e.isIntersecting)){
        io.disconnect();
        start();
      }
    }, {rootMargin:'600px 0px'});
    io.observe(target);
  } else {
    window.addEventListener('load', start, {once:true});
  }
})();