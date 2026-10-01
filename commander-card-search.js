(() => {
  const select = document.getElementById('commander-select');
  const builder = document.querySelector('.decklist-builder');
  if (!select || !builder) return;

  const style = document.createElement('style');
  style.textContent = `
    .deck-card-search{margin-top:18px;padding:16px;border:1px solid var(--line);border-radius:9px;background:#f8fafb}
    .deck-card-search-row{display:grid;grid-template-columns:1fr auto;gap:8px}.deck-card-search-row input{min-height:44px;padding:9px 11px;border:1px solid var(--line);border-radius:7px;font:inherit}.deck-card-search-row button{min-height:44px}
    .deck-card-search-results{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-top:12px}.deck-search-card{display:grid;grid-template-columns:56px 1fr auto;gap:10px;align-items:center;border:1px solid var(--line);border-radius:8px;background:#fff;padding:8px}.deck-search-card img{width:56px;aspect-ratio:488/680;object-fit:cover;border-radius:5px}.deck-search-card strong{display:block;font-size:.86rem}.deck-search-card small{display:block;color:var(--muted);font-size:.75rem}.deck-search-card button{border:1px solid var(--line);background:#fff;border-radius:7px;padding:7px 9px;cursor:pointer}.deck-card-search-status{margin-top:8px;font-size:.8rem;color:var(--muted)}
    @media(max-width:760px){.deck-card-search-results{grid-template-columns:1fr}.deck-search-card{grid-template-columns:48px 1fr auto}.deck-search-card img{width:48px}}
  `;
  document.head.appendChild(style);

  const box = document.createElement('section');
  box.className = 'deck-card-search';
  box.innerHTML = `
    <span class="section-kicker">カード追加</span>
    <h3>好きなカードを検索して追加</h3>
    <p class="commander-note">選択中の統率者の固有色に合い、統率者戦で使用できるカードだけを表示します。</p>
    <div class="deck-card-search-row"><input id="deck-card-search-input" type="search" placeholder="カード名を入力（日本語・英語）"><button id="deck-card-search-button" class="button primary" type="button">検索</button></div>
    <div id="deck-card-search-results" class="deck-card-search-results"></div>
    <div id="deck-card-search-status" class="deck-card-search-status"></div>`;
  builder.querySelector('.decklist-actions').after(box);

  const input = box.querySelector('#deck-card-search-input');
  const button = box.querySelector('#deck-card-search-button');
  const results = box.querySelector('#deck-card-search-results');
  const status = box.querySelector('#deck-card-search-status');

  const imgOf = c => c?.image_uris?.small || c?.image_uris?.normal || c?.card_faces?.[0]?.image_uris?.small || c?.card_faces?.[0]?.image_uris?.normal || '';
  const esc = s => String(s || '').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  async function commanderIdentity(){
    try{
      const name = select.value;
      const r = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
      if(!r.ok) return [];
      const c = await r.json();
      return c.color_identity || [];
    }catch(e){ return []; }
  }

  async function jaCard(card){
    try{
      const r = await fetch(`https://api.scryfall.com/cards/${card.set}/${card.collector_number}/ja`);
      if(!r.ok) return {name:card.name,image:imgOf(card)};
      const j = await r.json();
      return {name:j.printed_name || j.name || card.name,image:imgOf(j) || imgOf(card)};
    }catch(e){ return {name:card.name,image:imgOf(card)}; }
  }

  function identityQuery(identity){
    if(!identity.length) return 'id:c';
    return `id<=${identity.join('')}`;
  }

  async function search(){
    const q = input.value.trim();
    if(q.length < 2){ status.textContent='2文字以上入力してください。'; return; }
    button.disabled = true; results.innerHTML=''; status.textContent='検索中…';
    try{
      const id = await commanderIdentity();
      const query = `legal:commander game:paper ${identityQuery(id)} name:${JSON.stringify(q)}`;
      const r = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=edhrec`);
      if(!r.ok) throw new Error('search failed');
      const data = await r.json();
      const cards = (data.data || []).slice(0,10);
      if(!cards.length){ status.textContent='該当カードが見つかりませんでした。'; return; }
      const localized = await Promise.all(cards.map(async c=>({card:c,ja:await jaCard(c)})));
      results.innerHTML = localized.map((x,i)=>`<article class="deck-search-card" data-i="${i}">${x.ja.image?`<img src="${x.ja.image}" loading="lazy" alt="${esc(x.ja.name)}">`:''}<div><strong>${esc(x.ja.name)}</strong>${x.ja.name!==x.card.name?`<small>${esc(x.card.name)}</small>`:''}<small>${esc((x.card.type_line||'').replace(/Legendary /g,'伝説の '))}</small></div><button type="button">追加</button></article>`).join('');
      results.querySelectorAll('.deck-search-card').forEach(el=>el.querySelector('button').addEventListener('click',()=>{
        const x = localized[Number(el.dataset.i)];
        window.dispatchEvent(new CustomEvent('magsta:add-deck-card',{detail:{name:x.card.name,jp:x.ja.name,role:'自由追加'}}));
      }));
      status.textContent=`${cards.length}件表示中。固有色・統率者戦の合法性を確認済みです。`;
    }catch(e){ status.textContent='検索に失敗しました。もう一度お試しください。'; }
    finally{ button.disabled=false; }
  }

  button.addEventListener('click',search);
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search();}});
  select.addEventListener('change',()=>{results.innerHTML='';input.value='';status.textContent='';});
})();
