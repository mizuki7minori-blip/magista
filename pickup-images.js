(() => {
  const style = document.createElement('style');
  style.textContent = `
    .pickup-card .pickup-symbol {position:relative;width:min(230px,88%);height:auto;aspect-ratio:0.716 / 1;margin:20px auto 22px;padding:0;border-radius:12px;overflow:hidden;background:#0a0e14;border:1px solid #3a4655;box-shadow:0 16px 38px rgba(0,0,0,.4);display:block}
    .pickup-card .pickup-symbol img {display:block;width:100%;height:100%;max-width:none;object-fit:contain;object-position:center;cursor:zoom-in}
    .pickup-card .pickup-symbol.is-loading::after {content:'画像を読み込み中…';position:absolute;inset:0;display:grid;place-items:center;padding:12px;color:#fff;font-size:.8rem;text-align:center;background:rgba(10,14,20,.72)}
    .pickup-card .pickup-symbol.is-fallback {font-size:1rem;color:#fff;display:grid;place-items:center;text-align:center;padding:12px}
    .pickup-card .pickup-symbol.is-fallback::after {content:'カード画像を取得できませんでした';}
    .pickup-card .pickup-name-wiki {color:inherit;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.28);transition:color .18s ease,border-color .18s ease}
    .pickup-card .pickup-name-wiki:hover {color:#7dd3fc;border-color:#7dd3fc}
    .pickup-image-modal {position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.86);opacity:0;visibility:hidden;transition:opacity .18s ease,visibility .18s ease;cursor:zoom-out}
    .pickup-image-modal.is-open {opacity:1;visibility:visible}
    .pickup-image-modal img {display:block;width:auto;height:auto;max-width:min(92vw,560px);max-height:92vh;object-fit:contain;border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.65);cursor:default}
    .pickup-image-modal-close {position:fixed;top:18px;right:22px;width:44px;height:44px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:28px;line-height:1;cursor:pointer}
    body.pickup-modal-open {overflow:hidden}
    @media(max-width:1000px){.pickup-card .pickup-symbol{width:min(260px,82%)}}
    @media(max-width:520px){.pickup-card .pickup-symbol{width:min(330px,90%);margin-top:18px}.pickup-image-modal{padding:12px}.pickup-image-modal img{max-width:94vw;max-height:88vh}.pickup-image-modal-close{top:10px;right:10px}}
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

  const cards = [...document.querySelectorAll('.pickup-card')];
  if (!cards.length) return;

  // ピックアップカード名をMTG Wikiの検索ページへリンク
  cards.forEach(card => {
    const heading = card.querySelector('.pickup-info h3');
    const name = heading?.textContent?.trim();
    if (!heading || !name || heading.querySelector('.pickup-name-wiki')) return;
    const link = document.createElement('a');
    link.className = 'pickup-name-wiki';
    link.href = `https://mtgwiki.com/wiki/Special:Search?search=${encodeURIComponent(name)}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = `${name}をMTG Wikiで見る`;
    link.textContent = name;
    heading.textContent = '';
    heading.appendChild(link);
  });

  const loadImage = (url,name,target) => new Promise((resolve,reject) => {
    const image = new Image();
    image.referrerPolicy='no-referrer';
    image.onload=()=>resolve({image,url});
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
      const {image}=await loadImage(imageUrl,name,target);
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
