(() => {
  const cache = new Map();
  const textMap = new Map([
    ['ANY COMMANDER SEARCH','統率者を自由検索'],
    ['99-CARD TEMPLATE','99枚構築ひな型'],
    ['Bracket 1','ブラケット 1'],
    ['Bracket 2','ブラケット 2'],
    ['Bracket 3','ブラケット 3'],
    ['Bracket 4','ブラケット 4'],
    ['Bracket 5','ブラケット 5']
  ]);

  async function japaneseName(name){
    if(!name || cache.has(name)) return cache.get(name) || name;
    cache.set(name,name);
    try{
      const r=await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
      if(!r.ok) return name;
      const c=await r.json();
      const jr=await fetch(`https://api.scryfall.com/cards/${c.set}/${c.collector_number}/ja`);
      if(!jr.ok) return name;
      const j=await jr.json();
      const jp=j.printed_name || j.name || name;
      cache.set(name,jp);
      return jp;
    }catch(e){return name;}
  }

  function localizeLabels(root=document){
    root.querySelectorAll('.section-kicker,.bracket b,option').forEach(el=>{
      const t=el.textContent.trim();
      if(textMap.has(t)) el.textContent=textMap.get(t);
    });
    root.querySelectorAll('.commander-meta span').forEach(el=>{
      el.textContent=el.textContent.replace(/\bdecks\b/gi,'デッキ');
    });
  }

  async function localizeCardNames(root=document){
    const nodes=[...root.querySelectorAll('.any-result strong,.synergy-card h3,.commander-card-body h3')];
    for(const el of nodes){
      if(el.dataset.jaDone==='1') continue;
      const original=el.textContent.trim();
      if(!original) continue;
      el.dataset.jaDone='1';
      const jp=await japaneseName(original);
      if(jp && jp!==original){
        el.title=original;
        el.textContent=jp;
      }
    }
  }

  function run(root=document){
    localizeLabels(root);
    localizeCardNames(root);
  }

  document.addEventListener('DOMContentLoaded',()=>run());
  const observer=new MutationObserver(muts=>{
    for(const m of muts){
      m.addedNodes.forEach(n=>{
        if(n.nodeType===1) run(n);
      });
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
