(() => {
  'use strict';

  const IMAGE_CACHE_TTL = 24 * 60 * 60 * 1000;
  const JA_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
  const SNAPSHOT_CACHE_KEY = 'magsta-limited-ranking-snapshots-v1';
  const ARCHETYPES = {
    ALL: { name: '全体ランキング', colors: [] },
    WU: { name: '白青（アゾリウス）', colors: ['W','U'] },
    UB: { name: '青黒（ディミーア）', colors: ['U','B'] },
    BR: { name: '黒赤（ラクドス）', colors: ['B','R'] },
    RG: { name: '赤緑（グルール）', colors: ['R','G'] },
    GW: { name: '緑白（セレズニア）', colors: ['G','W'] },
    WB: { name: '白黒（オルゾフ）', colors: ['W','B'] },
    BG: { name: '黒緑（ゴルガリ）', colors: ['B','G'] },
    GU: { name: '緑青（シミック）', colors: ['G','U'] },
    UR: { name: '青赤（イゼット）', colors: ['U','R'] },
    RW: { name: '赤白（ボロス）', colors: ['R','W'] }
  };
  const PENDING = { colors:'17Lands集計を基準に順次更新', firstPick:'除去・ボム・柔軟性を優先', status:'ランキング連動' };
  const SETS = {
    fra:{name:'リアリティ・フラクチャー',code:'FRA',article:'article-fra-draft-2026-09-25.html',updatedAt:null,guide:{colors:'17Lands集計を基準に順次更新',firstPick:'単体性能の高いカードを優先し、序盤は色を固定しすぎない',status:'攻略記事あり'},ranking:[]},
    hob:{name:'ホビット',code:'HOB',guide:PENDING,ranking:[],updatedAt:null},
    msh:{name:'マーベル・スーパー・ヒーローズ',code:'MSH',guide:PENDING,ranking:[],updatedAt:null},
    sos:{name:'ストリクスヘイヴンの秘密',code:'SOS',guide:PENDING,ranking:[],updatedAt:null},
    tmt:{name:'TMNT',code:'TMT',guide:PENDING,ranking:[],updatedAt:null}
  };

  const $ = id => document.getElementById(id);
  const gallery=$('limited-card-gallery'), selector=$('limited-set-select'), archSelector=$('limited-arch-select');
  if (!gallery || !selector || !archSelector) return;
  const title=$('limited-set-title'), description=$('limited-set-description'), kicker=$('limited-set-kicker'), galleryTitle=$('limited-gallery-title');
  const cardDataLink=$('limited-card-data-link'), colorDataLink=$('limited-color-data-link'), scryfallLink=$('limited-scryfall-link'), articleLink=$('limited-article-link');
  const bestColors=$('limited-best-colors'), archetypes=$('limited-archetypes'), firstPick=$('limited-first-pick'), topCards=$('limited-top-cards'), guideStatus=$('limited-guide-status'), topNote=$('limited-top-note'), archSummary=$('limited-arch-summary');

  let requestId=0;
  const imageMemoryCache=new Map(), jaMemoryCache=new Map();
  const getImage=card=>card?.image_uris?.normal||card?.card_faces?.find(f=>f.image_uris?.normal)?.image_uris.normal||'';
  const getDisplayName=(fallback,jaCard)=>jaCard?.printed_name||fallback;
  const formatDate=iso=>{if(!iso)return'保存データ準備中';const d=new Date(iso);return Number.isNaN(d.getTime())?'保存済みデータ':`${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} 更新`;};

  const mergeSnapshots=payload=>{Object.entries(payload?.sets||{}).forEach(([key,s])=>{if(!SETS[key]||!s)return;if(Array.isArray(s.ranking)&&s.ranking.length)SETS[key].ranking=s.ranking;if(s.updatedAt)SETS[key].updatedAt=s.updatedAt;});};
  const readSnapshotCache=()=>{try{return JSON.parse(localStorage.getItem(SNAPSHOT_CACHE_KEY)||'null');}catch{return null;}};
  const refreshSnapshots=async()=>{try{const r=await fetch('limited-ranking-data.json',{cache:'no-cache'});if(!r.ok)throw 0;const p=await r.json();mergeSnapshots(p);try{localStorage.setItem(SNAPSHOT_CACHE_KEY,JSON.stringify(p));}catch{}return true;}catch{return false;}};

  const readTimedCache=(key,ttl,mem)=>{if(mem.has(key))return mem.get(key);try{const raw=localStorage.getItem(key);if(!raw)return null;const p=JSON.parse(raw);if(!p?.savedAt||Date.now()-p.savedAt>ttl)return null;mem.set(key,p.cards||[]);return p.cards||[];}catch{return null;}};
  const writeTimedCache=(key,cards,mem)=>{mem.set(key,cards);try{localStorage.setItem(key,JSON.stringify({savedAt:Date.now(),cards}));}catch{}};
  const readImageCache=k=>readTimedCache(`magsta-limited-images-v2-${k}`,IMAGE_CACHE_TTL,imageMemoryCache);
  const readJaCache=k=>readTimedCache(`magsta-limited-ja-${k}`,JA_CACHE_TTL,jaMemoryCache);

  const fetchRankingCards=async(setKey,ranking)=>{
    const cached=readImageCache(setKey); if(cached?.length)return cached;
    try{const r=await fetch('https://api.scryfall.com/cards/collection',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifiers:ranking.slice(0,60).map(x=>({name:x.name}))})});if(!r.ok)throw 0;const d=await r.json(),cards=d.data||[];if(cards.length)writeTimedCache(`magsta-limited-images-v2-${setKey}`,cards,imageMemoryCache);return cards;}catch{return [];}
  };
  const fetchJapaneseSetCards=async setKey=>{
    const cached=readJaCache(setKey);if(cached?.length)return cached;
    try{let url=`https://api.scryfall.com/cards/search?q=${encodeURIComponent(`set:${setKey} lang:ja`)}&unique=prints&order=set`,cards=[],s=0;while(url&&s<5){const r=await fetch(url);if(!r.ok)throw 0;const d=await r.json();cards.push(...(d.data||[]));url=d.has_more?d.next_page:'';s++;}if(cards.length)writeTimedCache(`magsta-limited-ja-${setKey}`,cards,jaMemoryCache);return cards;}catch{return [];}
  };
  const buildJapaneseMap=cards=>{const m=new Map();cards.forEach(c=>{if(!c?.name)return;const old=m.get(c.name);if(!old||(!getImage(old)&&getImage(c)))m.set(c.name,c);});return m;};

  const roleFor=card=>{
    if(!card)return'優先ピック';
    const text=(card.oracle_text||card.card_faces?.map(f=>f.oracle_text||'').join(' ')||'').toLowerCase();
    const type=(card.type_line||'').toLowerCase(), mv=Number(card.cmc||0);
    if(/destroy target|exile target|deals? \d+ damage to target|gets -\d+\/-\d+/.test(text))return'除去';
    if(type.includes('creature')&&mv>0&&mv<=2)return'序盤要員';
    if(type.includes('creature')&&mv>=5)return'フィニッシャー';
    if(/draw (a|two|three|\d+) card|draw cards/.test(text))return'アドバンテージ';
    if((card.colors||[]).length>=2)return'アーキ中核';
    return'優先ピック';
  };
  const fitsArchetype=(card,archKey)=>{
    if(archKey==='ALL')return true;
    const allowed=new Set(ARCHETYPES[archKey]?.colors||[]), colors=card?.colors||[];
    return colors.every(c=>allowed.has(c));
  };
  const buildPool=(set,cards,archKey)=>{
    const byName=new Map(cards.map(c=>[c.name,c]));
    return (set.ranking||[]).map(item=>({item,card:byName.get(item.name)||null})).filter(x=>fitsArchetype(x.card,archKey)).slice(0,10);
  };

  const renderPool=(setKey,set,cards,jaCards,archKey)=>{
    const jaMap=buildJapaneseMap(jaCards), pool=buildPool(set,cards,archKey), arch=ARCHETYPES[archKey]||ARCHETYPES.ALL;
    if(archetypes)archetypes.textContent=arch.name;
    if(archSummary)archSummary.innerHTML=`<span>${arch.name}</span><span>${pool.length}枚を優先表示</span><span>GIH WR順</span>`;
    if(topNote)topNote.textContent=`${arch.name}・GIH WR順・${formatDate(set.updatedAt)}`;
    if(galleryTitle)galleryTitle.textContent=`${set.name}｜${arch.name} 優先カード`;
    if(!pool.length){topCards.innerHTML='<li>この色組み合わせの候補を準備中です</li>';gallery.innerHTML='<div class="limited-card"><strong>候補カードを準備中です。</strong><p>次回のランキング更新で上位60枚を保存後、色別候補が増えます。</p></div>';return;}
    topCards.innerHTML=pool.map(({item,card})=>{const ja=jaMap.get(item.name),name=getDisplayName(item.name,ja),en=name!==item.name?`<small style="display:block;color:var(--muted)">${item.name}</small>`:'';return `<li><strong>${name}</strong>${en}<span class="limited-role-badge">${roleFor(card)}</span> GIH WR ${Number(item.wr).toFixed(1)}%${item.games?` / ${Number(item.games).toLocaleString()}ゲーム`:''}</li>`;}).join('');
    gallery.innerHTML=pool.map(({item,card},i)=>{const ja=jaMap.get(item.name),shown=ja||card,image=getImage(shown),name=getDisplayName(item.name,ja),href=shown?.scryfall_uri||`https://scryfall.com/search?q=${encodeURIComponent('!"'+item.name+'"')}`,eager=i<3;return `<a class="limited-image-card limited-ranked-card" href="${href}" target="_blank" rel="noopener noreferrer"><span class="limited-rank-badge">${i+1}位</span>${image?`<img src="${image}" alt="${name}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''}>`:'<div class="limited-image-placeholder">画像準備中</div>'}<strong>${name}</strong>${name!==item.name?`<span>${item.name}</span>`:''}<span class="limited-role-badge">${roleFor(card)}</span><span>GIH WR ${Number(item.wr).toFixed(1)}%</span></a>`;}).join('');
  };

  const renderCurrent=async()=>{
    const setKey=selector.value, set=SETS[setKey], archKey=archSelector.value||'ALL', active=++requestId;
    const ranking=set.ranking||[];
    if(!ranking.length){topCards.innerHTML='<li>保存ランキングを準備中です</li>';gallery.innerHTML='<div class="limited-card"><strong>保存ランキングを準備しています。</strong></div>';return;}
    gallery.innerHTML='<p>保存ランキングからカード情報を読み込み中です…</p>';

    const cards=await fetchRankingCards(setKey,ranking);
    if(active!==requestId)return;
    renderPool(setKey,set,cards,[],archKey);

    const jaCards=await fetchJapaneseSetCards(setKey);
    if(active!==requestId)return;
    if(jaCards?.length)renderPool(setKey,set,cards,jaCards,archKey);
  };

  const syncSeriesAffiliate=setKey=>{if(document.body)document.body.dataset.affiliateSeries=setKey;window.dispatchEvent(new CustomEvent('magsta:series-change',{detail:{set:setKey}}));};
  const applySet=(setKey,updateUrl=true)=>{
    const key=SETS[setKey]?setKey:'fra',set=SETS[key],guide=set.guide||PENDING;selector.value=key;
    if(kicker)kicker.textContent=`リミテッド / ${set.code}`;if(title)title.textContent=`${set.name} リミテッド攻略`;if(description)description.textContent=`${set.name}（${set.code}）を、シリーズ → アーキタイプ → 優先カードの順で確認できます。`;
    if(cardDataLink)cardDataLink.href=`https://www.17lands.com/card_data?expansion=${set.code}&format=PremierDraft&sort=ever_drawn_win_rate%2Cdesc&time_period=ALL_TIME&view=table`;
    if(colorDataLink)colorDataLink.href=`https://www.17lands.com/deck_color_data?expansion=${set.code}&format=PremierDraft`;
    if(scryfallLink)scryfallLink.href=`https://scryfall.com/sets/${key}?as=grid&order=set&lang=ja`;
    if(articleLink){articleLink.hidden=!set.article;if(set.article)articleLink.href=set.article;}
    if(bestColors)bestColors.textContent=guide.colors;if(firstPick)firstPick.textContent=guide.firstPick;if(guideStatus)guideStatus.textContent=guide.status;
    syncSeriesAffiliate(key);
    if(updateUrl){const u=new URL(location.href);u.searchParams.set('set',key);u.searchParams.set('arch',archSelector.value||'ALL');history.replaceState({},'',u);}
    renderCurrent().catch(()=>{gallery.innerHTML='<div class="limited-card"><strong>カード情報を取得できませんでした。</strong><p>保存ランキングは維持されています。</p></div>';});
  };
  const applyArch=()=>{const u=new URL(location.href);u.searchParams.set('set',selector.value);u.searchParams.set('arch',archSelector.value);history.replaceState({},'',u);renderCurrent();};

  const cached=readSnapshotCache();if(cached)mergeSnapshots(cached);
  const params=new URLSearchParams(location.search),initialSet=(params.get('set')||'fra').toLowerCase(),initialArch=(params.get('arch')||'ALL').toUpperCase();
  archSelector.value=ARCHETYPES[initialArch]?initialArch:'ALL';
  selector.addEventListener('change',()=>applySet(selector.value));archSelector.addEventListener('change',applyArch);
  applySet(initialSet,false);
  refreshSnapshots().then(ok=>{if(ok)renderCurrent();});
})();
