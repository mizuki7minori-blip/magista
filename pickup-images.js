(() => {
  const style = document.createElement('style');
  style.textContent = `
    .pickup-card .pickup-symbol {position:relative;width:min(230px,88%);height:auto;aspect-ratio:0.716 / 1;margin:20px auto 22px;padding:0;border-radius:12px;overflow:hidden;background:#0a0e14;border:1px solid #3a4655;box-shadow:0 16px 38px rgba(0,0,0,.4);display:block}
    .pickup-card .pickup-symbol img {display:block;width:100%;height:100%;max-width:none;object-fit:contain;object-position:center;cursor:zoom-in}
    .pickup-card .pickup-symbol.is-loading::after {content:'画像を読み込み中…';position:absolute;inset:0;display:grid;place-items:center;padding:12px;color:#fff;font-size:.8rem;text-align:center;background:rgba(10,14,20,.72)}
    .pickup-card .pickup-symbol.is-fallback {font-size:1rem;color:#fff;display:grid;place-items:center;text-align:center;padding:12px}
    .pickup-card .pickup-symbol.is-fallback::after {content:'カード画像を取得できませんでした'}
    .pickup-image-modal {position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.86);opacity:0;visibility:hidden;transition:opacity .18s ease,visibility .18s ease;cursor:zoom-out}
    .pickup-image-modal.is-open {opacity:1;visibility:visible}
    .pickup-image-modal img {display:block;width:auto;height:auto;max-width:min(92vw,560px);max-height:92vh;object-fit:contain;border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.65);cursor:default}
    .pickup-image-modal-close {position:fixed;top:18px;right:22px;width:44px;height:44px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:28px;line-height:1;cursor:pointer}
    body.pickup-modal-open {overflow:hidden}
    .magsta-dashboard{margin:0 0 28px;padding:18px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(135deg,#111720,#0c1118);box-shadow:0 12px 35px rgba(0,0,0,.18)}
    .magsta-dashboard-head{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:14px}
    .magsta-dashboard-title{margin:2px 0 0;font-size:1.2rem;color:var(--heading)}
    .magsta-dashboard-status{font-size:.68rem;color:#8ee3ad;font-weight:800;white-space:nowrap}
    .magsta-dashboard-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
    .magsta-dashboard-link{display:block;padding:12px;border:1px solid var(--line);border-radius:10px;background:#0d121a;transition:.18s}
    .magsta-dashboard-link:hover{border-color:var(--accent);transform:translateY(-1px)}
    .magsta-dashboard-link strong{display:block;font-size:.78rem;color:#fff}.magsta-dashboard-link span{display:block;margin-top:3px;font-size:.64rem;color:#aeb8c5}
    .magsta-dashboard-count{color:var(--accent)!important;font-weight:900}
    .magsta-dashboard-live{color:#8ee3ad!important;font-weight:800}
    @media(max-width:1000px){.magsta-dashboard-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:520px){.pickup-card .pickup-symbol{width:min(330px,90%);margin-top:18px}.pickup-image-modal{padding:12px}.pickup-image-modal img{max-width:94vw;max-height:88vh}.pickup-image-modal-close{top:10px;right:10px}.magsta-dashboard{padding:14px}.magsta-dashboard-grid{grid-template-columns:1fr 1fr}.magsta-dashboard-head{align-items:flex-start;flex-direction:column;gap:4px}}
  `;
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.className = 'pickup-image-modal';
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-label','カード画像拡大表示');
  modal.innerHTML = '<button class="pickup-image-modal-close" type="button" aria-label="閉じる">×</button><img alt="">';
  document.body.appendChild(modal);
  const modalImage = modal.querySelector('img');
  const closeModal = () => {modal.classList.remove('is-open');document.body.classList.remove('pickup-modal-open');modalImage.removeAttribute('src')};
  modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
  modal.querySelector('.pickup-image-modal-close').addEventListener('click',closeModal);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

  const countItems = selector => document.querySelectorAll(selector).length;
  const addDashboard = () => {
    if(document.querySelector('.magsta-dashboard')) return;
    const mainColumn=document.querySelector('.main-column');
    const news=document.getElementById('news');
    if(!mainColumn||!news) return;
    const dashboard=document.createElement('section');
    dashboard.className='magsta-dashboard';
    dashboard.setAttribute('aria-label','MAGSTA情報ダッシュボード');
    dashboard.innerHTML=`
      <div class="magsta-dashboard-head"><div><span class="section-kicker">MAGSTA PULSE</span><h2 class="magsta-dashboard-title">今日見るべきMTG情報</h2></div><span class="magsta-dashboard-status">● 自動更新エリア</span></div>
      <div class="magsta-dashboard-grid">
        <a class="magsta-dashboard-link" href="#news"><strong>📰 最新記事</strong><span id="pulse-news" class="magsta-dashboard-count">取得中…</span></a>
        <a class="magsta-dashboard-link" href="#pickup"><strong>🔥 ピックアップ</strong><span id="pulse-pickup" class="magsta-dashboard-count">注目カードを確認</span></a>
        <a class="magsta-dashboard-link" href="#price"><strong>💰 カード相場</strong><span class="magsta-dashboard-count">7フォーマット対応</span></a>
        <a class="magsta-dashboard-link" href="#timeline"><strong>🇯🇵 日本語タイムライン</strong><span id="pulse-ja" class="magsta-dashboard-count">取得中…</span></a>
        <a class="magsta-dashboard-link" href="#timeline"><strong>🌎 英語タイムライン</strong><span id="pulse-en" class="magsta-dashboard-count">取得中…</span></a>
        <a class="magsta-dashboard-link" href="#matome"><strong>💬 5chまとめ</strong><span class="magsta-dashboard-live">話題をチェック →</span></a>
      </div>`;
    mainColumn.insertBefore(dashboard,news);

    const updateCounts = () => {
      const newsCount=countItems('#news .article-card');
      const pickupCount=countItems('#pickup .pickup-card');
      const jaCount=countItems('#rss-timeline-ja-list > *:not(.rss-timeline-empty)');
      const enCount=countItems('#rss-timeline-en-list > *:not(.rss-timeline-empty)');
      const set=(id,text)=>{const el=document.getElementById(id);if(el)el.textContent=text};
      set('pulse-news',newsCount?`${newsCount}件を表示中`:'最新記事を取得中…');
      set('pulse-pickup',pickupCount?`${pickupCount}枚をチェック`:'今週の注目カード');
      set('pulse-ja',jaCount?`${jaCount}件を表示中`:'最新情報を取得中…');
      set('pulse-en',enCount?`${enCount}件を表示中`:'最新情報を取得中…');
    };
    updateCounts();
    const observer=new MutationObserver(updateCounts);
    ['news','pickup','rss-timeline-ja-list','rss-timeline-en-list'].forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el,{childList:true,subtree:true})});
  };
  addDashboard();

  const cards = [...document.querySelectorAll('.pickup-card')];
  if (!cards.length) return;

  const loadImage = (url,name) => new Promise((resolve,reject) => {
    const image = new Image();
    image.referrerPolicy='no-referrer';
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error('画像読み込み失敗'));
    image.src=url;
  });

  const fetchScryfall = async name => {
    const urls = [
      `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`,
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`
    ];
    for (const url of urls) {
      try {
        const response = await fetch(url,{headers:{Accept:'application/json'},cache:'no-store'});
        if (!response.ok) continue;
        const data = await response.json();
        const imageUrl=data.image_uris?.normal||data.image_uris?.large||data.card_faces?.[0]?.image_uris?.normal||data.card_faces?.[0]?.image_uris?.large;
        if (imageUrl) return imageUrl;
      } catch (_) {}
    }
    throw new Error('Scryfall画像なし');
  };

  const loadCardImage = async card => {
    const name=card.querySelector('.pickup-info h3')?.textContent?.trim();
    const target=card.querySelector('.pickup-symbol');
    if(!name||!target)return;
    target.classList.add('is-loading');
    target.classList.remove('is-fallback');
    try {
      const imageUrl=await fetchScryfall(name);
      const image=await loadImage(imageUrl,name);
      image.alt=`${name}のカード画像`;
      image.loading='lazy';
      image.decoding='async';
      image.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();modalImage.src=imageUrl;modalImage.alt=`${name}のカード画像（拡大）`;modal.classList.add('is-open');document.body.classList.add('pickup-modal-open')});
      target.textContent='';
      target.appendChild(image);
      target.classList.remove('is-loading');
    } catch(error) {
      console.warn(`[MAGSTA] カード画像取得失敗: ${name}`,error);
      target.classList.remove('is-loading');
      target.classList.add('is-fallback');
    }
  };

  cards.forEach(loadCardImage);
})();
