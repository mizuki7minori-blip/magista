(() => {
  const grid = document.getElementById('synergy-grid');
  const select = document.getElementById('commander-select');
  if (!grid || !select) return;

  const style = document.createElement('style');
  style.textContent = `
    .decklist-builder{margin-top:24px;padding-top:22px;border-top:1px solid var(--line)}
    .decklist-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap}
    .decklist-count{font-size:1.35rem;font-weight:900}.decklist-count span{font-size:.85rem;color:var(--muted);font-weight:700}
    .decklist-actions{display:flex;gap:8px;flex-wrap:wrap}.decklist-actions button{border:1px solid var(--line);background:#fff;border-radius:7px;padding:9px 12px;cursor:pointer}
    .decklist-items{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:14px}.decklist-item{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--line);border-radius:8px;padding:10px 12px;background:#fff}.decklist-item small{display:block;color:var(--muted)}
    .decklist-item button,.adopt-card{border:1px solid var(--line);background:#fff;border-radius:7px;padding:7px 9px;cursor:pointer}.adopt-card{width:100%;margin-top:8px;font-weight:800}.adopt-card.added{background:#202833;color:#fff}
    .decklist-empty{padding:18px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:8px;margin-top:14px}.decklist-status{font-size:.82rem;color:var(--muted);margin-top:8px}
    @media(max-width:700px){.decklist-items{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const builder = document.createElement('section');
  builder.className = 'decklist-builder';
  builder.innerHTML = `
    <div class="decklist-head">
      <div><span class="section-kicker">完成デッキリスト</span><h2>採用カードを99枚にまとめる</h2><p class="commander-note">候補カードの「採用する」またはカード検索から追加できます。</p></div>
      <div class="decklist-count"><strong id="decklist-current">0</strong> / 99枚 <span>＋統率者1枚</span></div>
    </div>
    <div class="decklist-actions"><button type="button" id="decklist-copy">デッキリストをコピー</button><button type="button" id="decklist-clear">採用カードをすべて外す</button></div>
    <div id="decklist-items" class="decklist-items"></div>
    <div id="decklist-empty" class="decklist-empty">まだカードが採用されていません。</div>
    <div id="decklist-status" class="decklist-status"></div>`;
  grid.parentElement.appendChild(builder);

  const items = new Map();
  const itemsWrap = builder.querySelector('#decklist-items');
  const empty = builder.querySelector('#decklist-empty');
  const current = builder.querySelector('#decklist-current');
  const status = builder.querySelector('#decklist-status');

  const displayName = () => select.options[select.selectedIndex]?.textContent?.trim() || select.value || '統率者';

  function addCard(data){
    if(!data?.name) return;
    if(items.has(data.name)){ status.textContent='そのカードはすでに採用されています。'; return; }
    if(items.size>=99){ status.textContent='99枚までです。別のカードを外してから追加してください。'; return; }
    items.set(data.name,{name:data.name,jp:data.jp||data.name,role:data.role||''});
    status.textContent=`${data.jp||data.name} を採用しました。`;
    syncButtons(); render();
  }

  function render(){
    current.textContent = String(items.size);
    empty.hidden = items.size > 0;
    itemsWrap.innerHTML = [...items.values()].map((x,i)=>`<div class="decklist-item"><div><strong>${x.jp || x.name}</strong>${x.jp && x.jp !== x.name ? `<small>${x.name}</small>` : ''}${x.role?`<small>${x.role}</small>`:''}</div><button type="button" data-remove="${i}">外す</button></div>`).join('');
    itemsWrap.querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click',()=>{
      const key=[...items.keys()][Number(btn.dataset.remove)];
      items.delete(key); syncButtons(); render();
    }));
  }

  function syncButtons(){
    grid.querySelectorAll('.synergy-card').forEach(card=>{
      const h3=card.querySelector('h3'); if(!h3) return;
      const original=card.dataset.card || h3.getAttribute('title') || h3.textContent.trim();
      let btn=card.querySelector('.adopt-card');
      if(!btn){ btn=document.createElement('button'); btn.type='button'; btn.className='adopt-card'; card.querySelector('.synergy-body')?.appendChild(btn); }
      const exists=items.has(original);
      btn.textContent=exists?'採用済み':'採用する'; btn.classList.toggle('added',exists);
      btn.onclick=()=>{
        if(exists){ items.delete(original); status.textContent='カードを外しました。'; syncButtons(); render(); return; }
        addCard({name:original,jp:h3.textContent.trim(),role:card.querySelector('.synergy-role')?.textContent.trim()||''});
      };
    });
  }

  builder.querySelector('#decklist-clear').addEventListener('click',()=>{ items.clear(); status.textContent='採用カードをすべて外しました。'; syncButtons(); render(); });
  builder.querySelector('#decklist-copy').addEventListener('click',async()=>{
    const lines=[`【MAGSTA 統率者デッキリスト】`,`統率者：${displayName()}`,'',...([...items.values()].map(x=>`1 ${x.jp || x.name}${x.jp&&x.jp!==x.name?` / ${x.name}`:''}`)), '', `採用済み：${items.size}/99枚`];
    try{ await navigator.clipboard.writeText(lines.join('\n')); status.textContent='デッキリストをコピーしました。'; }
    catch(e){ status.textContent='コピーできませんでした。ブラウザの権限をご確認ください。'; }
  });

  window.addEventListener('magsta:add-deck-card',e=>addCard(e.detail));
  const observer = new MutationObserver(()=>syncButtons());
  observer.observe(grid,{childList:true,subtree:true});
  select.addEventListener('change',()=>{items.clear(); status.textContent='統率者を変更したため、採用カードをリセットしました。'; setTimeout(()=>{syncButtons();render();},0);});
  syncButtons(); render();
})();
