(() => {
  const builder = document.querySelector('.decklist-builder');
  const select = document.getElementById('commander-select');
  const bracket = document.getElementById('bracket-select');
  if (!builder || !select) return;

  const style = document.createElement('style');
  style.textContent = `
    .deck-diagnosis{margin-top:22px;padding:18px;border:1px solid var(--line);border-radius:10px;background:#fff}
    .deck-diagnosis-head{display:flex;align-items:end;justify-content:space-between;gap:12px;flex-wrap:wrap}
    .deck-diagnosis-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
    .diagnosis-card{padding:14px;border:1px solid var(--line);border-radius:8px;background:#fafafa}
    .diagnosis-card strong{display:block;font-size:1rem}.diagnosis-card span{display:block;margin-top:4px;font-size:.82rem;color:var(--muted)}
    .diagnosis-ok{border-left:4px solid #4f7d57}.diagnosis-warn{border-left:4px solid #b98432}.diagnosis-low{border-left:4px solid #a94e4e}
    .deck-diagnosis-summary{margin-top:14px;padding:12px 14px;border-radius:8px;background:#f5f6f8;font-size:.9rem}
    @media(max-width:850px){.deck-diagnosis-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:600px){.deck-diagnosis-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const box = document.createElement('section');
  box.className = 'deck-diagnosis';
  box.innerHTML = `
    <div class="deck-diagnosis-head"><div><span class="section-kicker">デッキ自動診断</span><h2>不足している役割をチェック</h2></div><button type="button" id="deck-diagnosis-refresh" class="button secondary">診断を更新</button></div>
    <p class="commander-note">採用中のカードをカードタイプ・ルール文から簡易分類し、選んだデッキ方針とブラケットに合わせた目安と比較します。</p>
    <div id="deck-diagnosis-grid" class="deck-diagnosis-grid"></div>
    <div id="deck-diagnosis-summary" class="deck-diagnosis-summary">カードを追加すると診断します。</div>`;
  builder.appendChild(box);

  const grid = box.querySelector('#deck-diagnosis-grid');
  const summary = box.querySelector('#deck-diagnosis-summary');
  const cache = new Map();
  let strategy = 'balanced';

  function deckNames(){
    return [...builder.querySelectorAll('.decklist-item')].map(el => {
      const smalls=[...el.querySelectorAll('small')].map(x=>x.textContent.trim());
      const english=smalls.find(x=>/^[\x00-\x7F]+$/.test(x));
      const strong = el.querySelector('strong')?.textContent?.trim();
      return english || strong || '';
    }).filter(Boolean);
  }

  async function cardData(name){
    if(cache.has(name)) return cache.get(name);
    try{
      const r = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
      if(!r.ok) throw new Error('not found');
      const c = await r.json(); cache.set(name,c); return c;
    }catch(e){ cache.set(name,null); return null; }
  }

  function classify(card){
    const type = String(card?.type_line || '').toLowerCase();
    const text = String(card?.oracle_text || '').toLowerCase();
    const out = new Set();
    if(type.includes('land')) out.add('土地');
    if((type.includes('artifact') && /add \{/.test(text)) || /search your library for (a|up to .* )?land/.test(text) || /add one mana|add two mana|add three mana/.test(text)) out.add('加速');
    if(/draw (a|two|three|x|that many|cards?)/.test(text) || /put .* into your hand/.test(text)) out.add('ドロー');
    if(/destroy target|exile target|deals? .* damage to target/.test(text)) out.add('除去');
    if(/counter target|return target .* to .* hand|tap target/.test(text)) out.add('妨害');
    if(/hexproof|indestructible|protection from|phase out|can't be targeted/.test(text)) out.add('防御');
    if(/search your library for (a|an|up to|any) .* card|search your library for a card/.test(text)) out.add('サーチ');
    if(/each opponent|you win the game|loses? the game|double .* damage|combat damage to a player/.test(text)) out.add('勝ち筋');
    return out;
  }

  function targets(){
    const high = Number(bracket?.value || 3) >= 4;
    const base={
      '土地':[35,38], '加速':[high?11:9, high?13:11], 'ドロー':[high?11:9, high?14:12],
      '除去':[8,12], '妨害':[high?8:5, high?12:9], '防御':[4,8], 'サーチ':[2,6], '勝ち筋':[8,15]
    };
    if(strategy==='control'){
      base['除去']=[10,14]; base['妨害']=[high?12:10,18]; base['ドロー']=[11,14]; base['防御']=[6,10]; base['勝ち筋']=[5,10];
    } else if(strategy==='speed'){
      base['加速']=[12,15]; base['ドロー']=[10,12]; base['妨害']=[4,8]; base['サーチ']=[2,5]; base['勝ち筋']=[9,14];
    } else if(strategy==='combo'){
      base['加速']=[12,14]; base['ドロー']=[12,15]; base['サーチ']=[6,10]; base['防御']=[6,10]; base['妨害']=[7,11]; base['勝ち筋']=[8,14];
    }
    return base;
  }

  async function diagnose(){
    const names = deckNames();
    if(!names.length){ grid.innerHTML=''; summary.textContent='カードを追加すると診断します。'; return; }
    summary.textContent='診断中…';
    const cards = await Promise.all(names.map(cardData));
    const counts = {'土地':0,'加速':0,'ドロー':0,'除去':0,'妨害':0,'防御':0,'サーチ':0,'勝ち筋':0};
    cards.filter(Boolean).forEach(c => classify(c).forEach(k => { if(k in counts) counts[k]++; }));
    const goal = targets();
    grid.innerHTML = Object.entries(counts).map(([k,v]) => {
      const [min,max] = goal[k];
      const cls = v >= min ? 'diagnosis-ok' : v >= Math.max(1,min-2) ? 'diagnosis-warn' : 'diagnosis-low';
      const text = v >= min ? `目安内（${min}〜${max}枚）` : `あと${min-v}枚ほど欲しい（目安 ${min}〜${max}枚）`;
      return `<article class="diagnosis-card ${cls}"><strong>${k}：${v}枚</strong><span>${text}</span></article>`;
    }).join('');
    const lacking = Object.entries(counts).filter(([k,v]) => v < goal[k][0]).sort((a,b)=>(goal[b[0]][0]-b[1])-(goal[a[0]][0]-a[1]));
    const label={balanced:'バランス型',control:'妨害重視',speed:'スピード重視',combo:'コンボ重視'}[strategy]||'バランス型';
    summary.textContent = lacking.length ? `${label}の基準で、優先して補いたい役割：${lacking.slice(0,3).map(([k,v])=>`${k}（あと${goal[k][0]-v}枚目安）`).join('、')}。` : `${label}の基準では主要な役割をおおむね満たしています。`;
  }

  box.querySelector('#deck-diagnosis-refresh').addEventListener('click', diagnose);
  bracket?.addEventListener('change', diagnose);
  select.addEventListener('change', ()=>setTimeout(diagnose,50));
  window.addEventListener('magsta:strategy-change',e=>{strategy=e.detail?.strategy||'balanced';diagnose();});
  const itemsWrap = builder.querySelector('#decklist-items');
  if(itemsWrap){
    let timer;
    new MutationObserver(()=>{ clearTimeout(timer); timer=setTimeout(diagnose,180); }).observe(itemsWrap,{childList:true,subtree:true});
  }
  diagnose();
})();
