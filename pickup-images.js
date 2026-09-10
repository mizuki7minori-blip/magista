(() => {
  const style = document.createElement('style');
  style.textContent = `
    .pickup-card .pickup-symbol{position:relative;width:min(230px,88%);aspect-ratio:.716/1;margin:20px auto 22px;border-radius:12px;overflow:hidden;background:#0a0e14;border:1px solid #3a4655;box-shadow:0 16px 38px rgba(0,0,0,.4);display:grid;place-items:center}
    .pickup-card .pickup-symbol img{display:block;width:100%;height:100%;object-fit:contain;cursor:zoom-in}
    .pickup-card .pickup-info .pickup-details{margin-top:12px;padding:12px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.025);text-align:left;font-size:.78rem;line-height:1.65;color:var(--muted)}
    .pickup-details .detail-row{margin:0 0 6px}.pickup-details .detail-row:last-child{margin-bottom:0}.pickup-details strong{color:var(--text);font-size:.72rem;margin-right:5px}.pickup-details .detail-text{white-space:pre-line}
    .pickup-card .pickup-detail-link{display:inline-flex;margin-top:10px;padding:8px 12px;border:1px solid var(--accent);border-radius:8px;color:var(--text);font-weight:800;font-size:.72rem;text-decoration:none;background:rgba(255,255,255,.03)}
    .pickup-card .pickup-symbol.is-loading::after{content:'カード画像を読み込み中…';position:absolute;inset:0;display:grid;place-items:center;color:#fff;background:rgba(10,14,20,.72);pointer-events:none}
    .pickup-card .pickup-symbol.is-fallback{font-size:.9rem;color:#fff;text-align:center;padding:16px;box-sizing:border-box}
    .pickup-card .pickup-retry{display:block;margin:10px auto 0;padding:7px 12px;border:1px solid var(--accent);border-radius:8px;background:rgba(255,255,255,.04);color:var(--text);font-weight:800;font-size:.72rem;cursor:pointer}
    .pickup-image-modal{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.86);opacity:0;visibility:hidden;transition:.18s;cursor:zoom-out}.pickup-image-modal.is-open{opacity:1;visibility:visible}.pickup-image-modal img{max-width:min(92vw,560px);max-height:92vh;border-radius:14px}.pickup-image-modal-close{position:fixed;top:18px;right:22px;width:44px;height:44px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:28px;cursor:pointer}body.pickup-modal-open{overflow:hidden}
  `;
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.className = 'pickup-image-modal';
  modal.innerHTML = '<button class="pickup-image-modal-close" type="button" aria-label="閉じる">×</button><img alt="">';
  document.body.appendChild(modal);
  const modalImage = modal.querySelector('img');
  const close = () => { modal.classList.remove('is-open'); document.body.classList.remove('pickup-modal-open'); modalImage.removeAttribute('src'); };
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.querySelector('button').addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  // APIが一時的に失敗しても画像を出せるよう、よく使うピックアップ候補はCDN画像を先に利用。
  const STATIC_IMAGES = {
    'The One Ring': 'https://cdn.mtg.ink/ltr/246_art_crop.jpg?v=fa27f28e-747b-4490-aa17-329059fc5390',
    'Sheoldred, the Apocalypse': 'https://cdn.mtg.ink/dmu/107_art_crop.jpg',
    'Lightning Bolt': 'https://cdn.mtg.ink/3ed/162_art_crop.jpg?v=2cb6200c-d05b-419c-bd10-8b9c146e2339',
    'Atraxa, Grand Unifier': 'https://cdn.mtg.ink/fca/49_art_crop.jpg?v=f2ebe584-386c-424a-b8c0-2becc8fda954',
    'Kroxa, Titan of Death’s Hunger': 'https://cdn.mtg.ink/thb/221_art_crop.jpg',
    'Counterspell': 'https://cdn.mtg.ink/fca/4_art_crop.jpg',
    'Swords to Plowshares': 'https://cdn.mtg.ink/brb/84_art_crop.jpg?v=2aa59be5-ca4a-4e36-928c-8b72362c9ae5',
    'Aetherflux Reservoir': 'https://cdn.mtg.ink/brr/65_art_crop.jpg'
  };

  const fetchJson = async url => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json;q=0.9,*/*;q=0.8' }, cache: 'no-store', signal: controller.signal });
      if (!r.ok) throw Error(r.status);
      return r.json();
    } finally { clearTimeout(timer); }
  };

  const getImageUrl = c => c?.image_uris?.normal || c?.image_uris?.large || c?.card_faces?.find(f => f.image_uris)?.image_uris?.normal || c?.card_faces?.find(f => f.image_uris)?.image_uris?.large || '';

  const getCardData = async englishName => {
    const q = encodeURIComponent(`!"${englishName}" lang:ja`);
    const exact = encodeURIComponent(englishName);
    const urls = [
      `https://api.scryfall.com/cards/search?q=${q}&unique=prints&order=released`,
      `https://api.scryfall.com/cards/named?exact=${exact}`,
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`!"${englishName}"`)}&unique=prints&order=released`
    ];
    for (const url of urls) {
      try {
        const d = await fetchJson(url);
        const cards = Array.isArray(d.data) ? d.data : [d.data || d];
        const c = cards.find(x => getImageUrl(x));
        if (c) return c;
      } catch (_) {}
    }
    throw Error('card data unavailable');
  };

  const escapeHtml = v => String(v ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));

  const renderDetails = (card, data) => {
    const info = card.querySelector('.pickup-info');
    if (!info) return;
    let box = info.querySelector('.pickup-details');
    if (!box) { box = document.createElement('div'); box.className = 'pickup-details'; info.appendChild(box); }
    const face = data.card_faces?.[0] || data;
    const mana = face.mana_cost || '—';
    const type = face.printed_type_line || face.type_line || '—';
    const effect = face.printed_text || data.printed_text || face.oracle_text || data.oracle_text || 'カード効果を取得できませんでした。';
    box.innerHTML = `<div class="detail-row"><strong>コスト</strong>${escapeHtml(mana)}</div><div class="detail-row"><strong>タイプ</strong>${escapeHtml(type)}</div><div class="detail-row"><strong>効果</strong><span class="detail-text">${escapeHtml(effect)}</span></div>`;
    const old = info.querySelector('.pickup-detail-link');
    if (old) old.remove();
    if (data.scryfall_uri) {
      const a = document.createElement('a');
      a.className = 'pickup-detail-link'; a.href = data.scryfall_uri; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'カード詳細を見る →'; info.appendChild(a);
    }
  };

  const loadImage = url => new Promise((res, rej) => {
    if (!url) return rej(Error('empty image url'));
    const i = new Image();
    const timer = setTimeout(() => { i.src = ''; rej(Error('image timeout')); }, 10000);
    i.onload = () => { clearTimeout(timer); res(i); };
    i.onerror = () => { clearTimeout(timer); rej(Error('image')); };
    i.referrerPolicy = 'no-referrer';
    i.decoding = 'async';
    i.src = url;
  });

  const attachImage = (card, name, url) => {
    const target = card.querySelector('.pickup-symbol');
    if (!target) return;
    const img = new Image();
    img.alt = `${name}のカード画像`;
    img.loading = 'eager';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); modalImage.src = url; modalImage.alt = `${name}のカード画像（拡大）`; modal.classList.add('is-open'); document.body.classList.add('pickup-modal-open'); });
    img.onload = () => { target.textContent = ''; target.appendChild(img); target.classList.remove('is-loading','is-fallback'); };
    img.src = url;
  };

  const loadCard = async card => {
    const name = card.querySelector('.pickup-info h3')?.textContent?.trim();
    const en = card.dataset.pickupEnglishName || '';
    const target = card.querySelector('.pickup-symbol');
    if (!name || !en || !target || name === '読み込み中…') return;
    target.classList.remove('is-fallback');
    target.classList.add('is-loading');
    const staticUrl = STATIC_IMAGES[en];
    try {
      if (staticUrl) {
        await loadImage(staticUrl);
        attachImage(card, name, staticUrl);
        try { const data = await getCardData(en); renderDetails(card, data); } catch (_) {}
        return;
      }
      const data = await getCardData(en);
      const url = getImageUrl(data);
      await loadImage(url);
      attachImage(card, name, url);
      renderDetails(card, data);
    } catch (e) {
      console.warn('[MAGSTA] pickup card error', name, e);
      target.classList.remove('is-loading'); target.classList.add('is-fallback'); target.textContent = '';
      const msg = document.createElement('span'); msg.textContent = 'カード画像を取得できませんでした'; target.appendChild(msg);
      const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'pickup-retry'; retry.textContent = '再読み込み'; retry.addEventListener('click', () => loadCard(card)); target.appendChild(retry);
    }
  };

  const loadAll = () => document.querySelectorAll('.pickup-card').forEach(loadCard);
  document.addEventListener('magsta:daily-pickup', () => requestAnimationFrame(loadAll), { once: true });
  if ([...document.querySelectorAll('.pickup-card h3')].some(e => e.textContent.trim() !== '読み込み中…')) loadAll();
})();
