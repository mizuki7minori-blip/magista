(() => {
  const controls = document.querySelector('.commander-builder-controls');
  const synergyGrid = document.getElementById('synergy-grid');
  const budgetPlan = document.getElementById('budget-plan');
  if (!controls || !synergyGrid) return;

  const wrap = document.createElement('div');
  wrap.className = 'commander-strategy-control';
  wrap.innerHTML = `
    <label>デッキ方針
      <select id="strategy-select">
        <option value="balanced">バランス型</option>
        <option value="control">妨害重視</option>
        <option value="speed">スピード重視</option>
        <option value="combo">コンボ重視</option>
      </select>
    </label>`;
  controls.after(wrap);

  const style = document.createElement('style');
  style.textContent = `
    .commander-strategy-control{margin:-6px 0 18px;max-width:320px}.commander-strategy-control label{font-size:.85rem;font-weight:800}.commander-strategy-control select{width:100%;min-height:46px;margin-top:6px;padding:9px 12px;border:1px solid var(--line);border-radius:7px;background:#fff}
    .strategy-note{margin:8px 0 18px;padding:12px 14px;border-radius:8px;background:#f5f6f8;font-size:.86rem;color:var(--muted)}
  `;
  document.head.appendChild(style);

  const select = wrap.querySelector('#strategy-select');
  const note = document.createElement('div');
  note.className = 'strategy-note';
  wrap.after(note);

  const priority = {
    balanced:['加速','ドロー','除去','妨害','防御','勝ち筋','サーチ','全体除去','部族強化','増殖'],
    control:['妨害','除去','全体干渉','全体除去','防御','ドロー','サーチ','加速','勝ち筋'],
    speed:['加速','軽減','加速/ドロー','ドロー','防御','妨害','除去','勝ち筋'],
    combo:['サーチ','ドロー','加速','防御','妨害','勝ち筋','除去']
  };

  const notes = {
    balanced:'バランス型：加速・ドロー・除去・勝ち筋を均等に整えます。',
    control:'妨害重視：打ち消し・除去・バウンス・全体干渉・防御を優先します。',
    speed:'スピード重視：低コスト加速・コスト軽減・展開速度を上げるカードを優先します。',
    combo:'コンボ重視：サーチ・ドロー・加速・コンボ保護・勝ち筋の再現性を優先します。'
  };

  function scoreRole(role, mode){
    const list = priority[mode] || priority.balanced;
    const idx = list.findIndex(k => String(role).includes(k));
    return idx < 0 ? 999 : idx;
  }

  function reorderSynergy(){
    const mode = select.value;
    const cards = [...synergyGrid.querySelectorAll('.synergy-card')];
    if(!cards.length) return;
    cards.sort((a,b)=>{
      const ar=a.querySelector('.synergy-role')?.textContent||'';
      const br=b.querySelector('.synergy-role')?.textContent||'';
      return scoreRole(ar,mode)-scoreRole(br,mode);
    }).forEach(card=>synergyGrid.appendChild(card));
  }

  function updatePlan(){
    if(!budgetPlan) return;
    const mode=select.value;
    const plans={
      balanced:[['加速','10前後'],['ドロー','10〜12'],['除去・妨害','10前後'],['勝ち筋','8〜12']],
      control:[['加速','9〜11'],['ドロー','11〜13'],['除去・妨害','15〜20'],['防御','6〜10']],
      speed:[['加速','12〜15'],['ドロー','10〜12'],['軽量カード','多め'],['勝ち筋','早めに展開']],
      combo:[['加速','12〜14'],['ドロー','12〜15'],['サーチ','6〜10'],['コンボ・保護','12〜18']]
    };
    budgetPlan.innerHTML=plans[mode].map(([k,v])=>`<div><strong>${k}</strong><span>${v}</span></div>`).join('');
  }

  function apply(){
    note.textContent=notes[select.value];
    updatePlan();
    reorderSynergy();
    window.dispatchEvent(new CustomEvent('magsta:strategy-change',{detail:{strategy:select.value}}));
  }

  const observer = new MutationObserver(()=>setTimeout(reorderSynergy,0));
  observer.observe(synergyGrid,{childList:true,subtree:false});
  select.addEventListener('change',apply);
  apply();
})();
