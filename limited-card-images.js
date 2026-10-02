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
  const bestColors=$('limited-best-colors'), archetypes=$('limited-archetypes'), firstPick=$('limited-first-pick'), topCards=$('limited-top-cards'), guideStatus=$('limited-guide-status'), topNote=$('limited-top-note'), archSummary=$('limited-arch-summary'), cuGrid=$('limited-cu-grid'), cuNote=$('limited-cu-note'), quickArches=$('limited-quick-arches'), currentView=$('limited-current-view'), roleFilter=$('limited-role-filter'), planGame=$('limited-plan-game'), planSynergy=$('limited-plan-synergy'), planBalance=$('limited-plan-balance'), planNote=$('limited-plan-note'), synergyPicker=$('limited-synergy-picker'), synergyList=$('limited-synergy-list'), synergyNote=$('limited-synergy-note'), countCreature=$('limited-count-creature'), countRemoval=$('limited-count-removal'), countAdvantage=$('limited-count-advantage'), countFinisher=$('limited-count-finisher'), assistantResult=$('limited-assistant-result'), assistantPicks=$('limited-assistant-picks'), pickedList=$('limited-picked-list'), pickedCount=$('limited-picked-count'), clearPicks=$('limited-clear-picks'), packNumber=$('limited-pack-number'), pickNumber=$('limited-pick-number'), stageAdvice=$('limited-stage-advice'), autoStage=$('limited-auto-stage'), stageStatus=$('limited-stage-status'), colorBars=$('limited-color-bars'), colorNote=$('limited-color-note');

  let requestId=0, activeRole='ALL', lastRender=null, activeSynergyCard='', pickedCards=[];
  const imageMemoryCache=new Map(), jaMemoryCache=new Map();
  const getImage=card=>card?.image_uris?.normal||card?.card_faces?.find(f=>f.image_uris?.normal)?.image_uris.normal||'';
  const getDisplayName=(fallback,jaCard)=>jaCard?.printed_name||fallback;
  const formatDate=iso=>{if(!iso)return'保存データ準備中';const d=new Date(iso);return Number.isNaN(d.getTime())?'保存済みデータ':`${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} 更新`;};

  const mergeSnapshots=payload=>{Object.entries(payload?.sets||{}).forEach(([key,s])=>{if(!SETS[key]||!s)return;if(Array.isArray(s.ranking)&&s.ranking.length)SETS[key].ranking=s.ranking;if(Array.isArray(s.archetypes)&&s.archetypes.length)SETS[key].archetypes=s.archetypes;if(s.archetypeCards)SETS[key].archetypeCards=s.archetypeCards;if(s.updatedAt)SETS[key].updatedAt=s.updatedAt;if(s.archetypesUpdatedAt)SETS[key].archetypesUpdatedAt=s.archetypesUpdatedAt;if(s.archetypeCardsUpdatedAt)SETS[key].archetypeCardsUpdatedAt=s.archetypeCardsUpdatedAt;});};
  const readSnapshotCache=()=>{try{return JSON.parse(localStorage.getItem(SNAPSHOT_CACHE_KEY)||'null');}catch{return null;}};
  const refreshSnapshots=async()=>{try{const r=await fetch('limited-ranking-data.json',{cache:'no-cache'});if(!r.ok)throw 0;const p=await r.json();mergeSnapshots(p);try{localStorage.setItem(SNAPSHOT_CACHE_KEY,JSON.stringify(p));}catch{}return true;}catch{return false;}};

  const readTimedCache=(key,ttl,mem)=>{if(mem.has(key))return mem.get(key);try{const raw=localStorage.getItem(key);if(!raw)return null;const p=JSON.parse(raw);if(!p?.savedAt||Date.now()-p.savedAt>ttl)return null;mem.set(key,p.cards||[]);return p.cards||[];}catch{return null;}};
  const writeTimedCache=(key,cards,mem)=>{mem.set(key,cards);try{localStorage.setItem(key,JSON.stringify({savedAt:Date.now(),cards}));}catch{}};
  const readImageCache=k=>readTimedCache(`magsta-limited-images-v3-${k}`,IMAGE_CACHE_TTL,imageMemoryCache);
  const readJaCache=k=>readTimedCache(`magsta-limited-ja-${k}`,JA_CACHE_TTL,jaMemoryCache);

  const fetchRankingCards=async(cacheKey,ranking)=>{
    const cached=readImageCache(cacheKey); if(cached?.length)return cached;
    try{const r=await fetch('https://api.scryfall.com/cards/collection',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifiers:ranking.slice(0,60).map(x=>({name:x.name}))})});if(!r.ok)throw 0;const d=await r.json(),cards=d.data||[];if(cards.length)writeTimedCache(`magsta-limited-images-v3-${cacheKey}`,cards,imageMemoryCache);return cards;}catch{return [];}
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
  const analyzePlan=(cards,archKey)=>{
    if(archKey==='ALL')return {
      game:'色を決める前は単体性能と柔軟性を優先し、流れてくる色を見ながらアーキタイプを決めます。',
      synergy:'まずは除去・ボム・2〜3マナ域を確保し、後半から選んだ色のシナジーへ寄せます。',
      balance:'クリーチャー15〜17枚、除去3〜5枚、アドバンテージ源2〜4枚を目安に調整します。'
    };
    const usable=cards.filter(Boolean),counts={};
    usable.forEach(card=>{const r=roleFor(card);counts[r]=(counts[r]||0)+1;});
    const avgMv=usable.length?usable.reduce((s,c)=>s+Number(c.cmc||0),0)/usable.length:0;
    const creatureCount=usable.filter(c=>(c.type_line||'').toLowerCase().includes('creature')).length;
    const text=usable.map(c=>(c.oracle_text||c.card_faces?.map(f=>f.oracle_text||'').join(' ')||'').toLowerCase()).join(' ');
    const signals=[];
    if(/graveyard|dies|sacrifice/.test(text))signals.push('墓地・生け贄');
    if(/counter on|proliferate/.test(text))signals.push('カウンター');
    if(/token/.test(text))signals.push('トークン');
    if(/artifact/.test(text))signals.push('アーティファクト');
    if(/enchantment/.test(text))signals.push('エンチャント');
    if(/instant|sorcery|noncreature spell/.test(text))signals.push('スペル');
    if(/draw.*card|discard/.test(text))signals.push('手札差');
    if(/flying|menace|trample|double strike/.test(text))signals.push('回避・打点');
    const topRoles=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0]);
    let game=avgMv&&avgMv<3?'低マナ域を厚くしてテンポよく先行する構成が向きます。':avgMv>3.6?'序盤を受けて、中盤以降の高出力カードで押し切る構成が向きます。':'2〜4マナ域を中心に、盤面と手札差の両方を取るバランス型が組みやすいです。';
    if((counts['除去']||0)>=4)game+=' 上位カードに除去が多いため、相手のキーカードを処理して優位を維持しやすいです。';
    const synergy=signals.length?signals.slice(0,3).join('・')+'を意識。特に'+(topRoles.join('・')||'優先ピック')+'のカードを軸にするとまとまりやすいです。':(topRoles.join('・')||'上位カード')+'を軸に、カード単体の強さを落とさず同じ役割を重ねるのが安定します。';
    const creatures=Math.max(14,Math.min(18,Math.round(14+creatureCount/Math.max(1,usable.length)*4)));
    const removal=Math.max(2,Math.min(5,counts['除去']||3));
    const advantage=Math.max(2,Math.min(4,counts['アドバンテージ']||2));
    return {game,synergy,balance:'クリーチャー'+creatures+'〜'+(creatures+1)+'枚、除去'+removal+'〜'+Math.min(6,removal+1)+'枚、アドバンテージ源'+advantage+'〜'+Math.min(5,advantage+1)+'枚を目安に調整。'};
  };

  const renderPlan=(set,cards,archKey)=>{
    if(!planGame||!planSynergy||!planBalance)return;
    const byName=new Map(cards.map(c=>[c.name,c]));
    const source=rankingFor(set,archKey).slice(0,20).map(x=>byName.get(x.name)).filter(Boolean);
    const p=analyzePlan(source,archKey);
    planGame.textContent=p.game;
    planSynergy.textContent=p.synergy;
    planBalance.textContent=p.balance;
    if(planNote)planNote.textContent=archKey==='ALL'?'全体ランキングから基本方針を表示':'上位20枚の役割・カードテキストから自動分析';
  };
  const synergyTags=card=>{
    const text=(card?.oracle_text||card?.card_faces?.map(f=>f.oracle_text||'').join(' ')||'').toLowerCase();
    const tags=[];
    const rules=[
      ['墓地・生け贄',/graveyard|dies|sacrifice/],
      ['カウンター',/counter on|proliferate/],
      ['トークン',/token/],
      ['アーティファクト',/artifact/],
      ['エンチャント',/enchantment/],
      ['スペル',/instant|sorcery|noncreature spell/],
      ['手札差',/draw.*card|discard/],
      ['回避・打点',/flying|menace|trample|double strike/],
      ['ライフゲイン',/gain .* life|lifelink/]
    ];
    rules.forEach(([name,re])=>{if(re.test(text))tags.push(name);});
    return tags;
  };

  const synergyScore=(base,candidate)=>{
    if(!base||!candidate||base.name===candidate.name)return -999;
    let score=0;
    const a=synergyTags(base),b=synergyTags(candidate);
    const shared=a.filter(x=>b.includes(x));
    score+=shared.length*4;
    const baseRole=roleFor(base),candidateRole=roleFor(candidate);
    if(baseRole===candidateRole)score+=1;
    if(baseRole==='アーキ中核'&&candidateRole!=='アーキ中核')score+=2;
    if(candidateRole==='除去')score+=1;
    const mvA=Number(base.cmc||0),mvB=Number(candidate.cmc||0);
    if(Math.abs(mvA-mvB)<=2)score+=1;
    const colorsA=new Set(base.colors||[]),colorsB=candidate.colors||[];
    if(colorsB.every(x=>colorsA.has(x))||colorsA.size===0)score+=1;
    return score;
  };

  const renderSynergy=(set,cards,jaCards,archKey)=>{
    if(!synergyPicker||!synergyList)return;
    const ranking=rankingFor(set,archKey);
    const byName=new Map(cards.map(c=>[c.name,c]));
    const jaMap=buildJapaneseMap(jaCards);
    const candidates=ranking.slice(0,12).map(x=>byName.get(x.name)).filter(Boolean);
    if(!candidates.length){synergyPicker.innerHTML='';synergyList.innerHTML='<div class="limited-card"><strong>候補を準備中です。</strong></div>';return;}
    if(!activeSynergyCard||!byName.has(activeSynergyCard))activeSynergyCard=candidates[0].name;
    synergyPicker.innerHTML=candidates.slice(0,5).map(card=>{
      const ja=jaMap.get(card.name),name=getDisplayName(card.name,ja);
      return '<button type="button" data-card="'+card.name.replace(/"/g,'&quot;')+'" class="'+(card.name===activeSynergyCard?'is-active':'')+'">'+name+'</button>';
    }).join('');
    synergyPicker.querySelectorAll('button[data-card]').forEach(btn=>btn.addEventListener('click',()=>{activeSynergyCard=btn.dataset.card;renderSynergy(set,cards,jaCards,archKey);}));
    const base=byName.get(activeSynergyCard);
    const scored=ranking.map(item=>({item,card:byName.get(item.name)})).filter(x=>x.card&&x.card.name!==activeSynergyCard).map(x=>({...x,score:synergyScore(base,x.card)})).sort((a,b)=>b.score-a.score||Number(b.item.wr||0)-Number(a.item.wr||0)).slice(0,5);
    const baseName=getDisplayName(base.name,jaMap.get(base.name));
    if(synergyNote)synergyNote.textContent=baseName+' と噛み合う候補TOP5';
    synergyList.innerHTML=scored.map(({item,card,score},i)=>{
      const name=getDisplayName(card.name,jaMap.get(card.name));
      const shared=synergyTags(base).filter(x=>synergyTags(card).includes(x));
      const reason=shared.length?'共通シナジー：'+shared.join('・'):'役割補完：'+roleFor(card);
      return '<article class="limited-synergy-card"><strong>'+(i+1)+'位 '+name+'</strong><small>'+reason+'</small><small>GIH WR '+Number(item.wr||0).toFixed(1)+'% / 相性スコア '+score+'</small></article>';
    }).join('');
  };
  const pickedStorageKey=()=>`magsta-limited-picks-${selector.value}`;
  const loadPicked=()=>{
    try{pickedCards=JSON.parse(localStorage.getItem(pickedStorageKey())||'[]');if(!Array.isArray(pickedCards))pickedCards=[];}catch{pickedCards=[];}
  };
  const savePicked=()=>{try{localStorage.setItem(pickedStorageKey(),JSON.stringify(pickedCards));}catch{}};
  const syncPickedCounts=()=>{
    if(!lastRender)return;
    const byName=new Map(lastRender.cards.map(c=>[c.name,c]));
    let creatures=0,removal=0,advantage=0,finisher=0;
    pickedCards.forEach(name=>{
      const card=byName.get(name);if(!card)return;
      const type=(card.type_line||'').toLowerCase();
      const role=roleFor(card);
      if(type.includes('creature'))creatures++;
      if(role==='除去')removal++;
      if(role==='アドバンテージ')advantage++;
      if(role==='フィニッシャー')finisher++;
    });
    if(countCreature)countCreature.value=creatures;
    if(countRemoval)countRemoval.value=removal;
    if(countAdvantage)countAdvantage.value=advantage;
    if(countFinisher)countFinisher.value=finisher;
  };
  const renderPickedList=()=>{
    if(!pickedList||!pickedCount)return;
    pickedCount.textContent=String(pickedCards.length);
    if(!pickedCards.length){pickedList.innerHTML='<span class="limited-series-note">優先ピックの「＋ピック」から追加できます。</span>';return;}
    const jaMap=buildJapaneseMap(lastRender?.jaCards||[]);
    pickedList.innerHTML=pickedCards.map((name,i)=>'<span class="limited-picked-chip">'+getDisplayName(name,jaMap.get(name))+' <button type="button" data-remove-pick="'+i+'" aria-label="このピックを取り消す">×</button></span>').join('');
  };
  const refreshPickedAssistant=()=>{
    syncPickedCounts();renderPickedList();savePicked();syncAutoStage();renderDraftStage();renderColorRead();
    if(lastRender)renderDraftAssistant(lastRender.set,lastRender.cards,lastRender.jaCards,lastRender.archKey);
  };
  const addPickedCard=name=>{if(!name)return;pickedCards.push(name);refreshPickedAssistant();};
  const renderColorRead=()=>{
    if(!colorBars||!colorNote||!lastRender)return;
    const names={W:'白',U:'青',B:'黒',R:'赤',G:'緑'};
    const counts={W:0,U:0,B:0,R:0,G:0};
    const byName=new Map(lastRender.cards.map(c=>[c.name,c]));
    pickedCards.forEach(name=>{
      const card=byName.get(name);if(!card)return;
      const colors=card.colors||[];
      colors.forEach(color=>{if(counts[color]!==undefined)counts[color]+=1;});
    });
    const rows=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    colorBars.innerHTML=rows.map(([c,n])=>'<div class="limited-color-bar"><strong>'+names[c]+'</strong><span>'+n+'票</span></div>').join('');
    const total=rows.reduce((s,x)=>s+x[1],0);
    const pack=Math.max(1,Math.min(3,Number(packNumber?.value||1)));
    const pick=Math.max(1,Math.min(14,Number(pickNumber?.value||1)));
    if(!total){colorNote.textContent='まだ色の傾向はありません。序盤は単体性能を優先して大丈夫です。';return;}
    const [first,second,third]=rows;
    const leader=first?.[1]||0, runner=second?.[1]||0;
    const pair=(first&&second)?names[first[0]]+names[second[0]]:'';
    const early=(pack===1&&pick<=5);
    if(early||pickedCards.length<5){colorNote.textContent='現在は'+names[first[0]]+'がやや多め。まだ色を切らず、強いカードを優先して様子を見る段階です。';return;}
    if(leader>=runner+3&&leader>=5){
      const weak=third&&third[1]<=1?' '+names[third[0]]+'はかなり薄めです。':'';
      colorNote.textContent='主色候補は'+names[first[0]]+'。副色候補は'+names[second[0]]+'で、現在は'+pair+'寄りです。'+weak;
      return;
    }
    if(pack>=2&&first&&second&&runner>=3){colorNote.textContent='現在は'+pair+'が中心。2パック目以降なので、この2色を軸に不足役割を埋めるのが安定です。';return;}
    colorNote.textContent='色はまだ競っています。'+names[first[0]]+'を第一候補にしつつ、'+names[second[0]]+'も残して流れを見ましょう。';
  };
  const syncAutoStage=()=>{
    if(!packNumber||!pickNumber)return;
    const auto=!autoStage||autoStage.checked;
    packNumber.disabled=auto;pickNumber.disabled=auto;
    if(auto){
      const next=Math.min(42,pickedCards.length+1);
      const pack=Math.min(3,Math.floor((next-1)/14)+1);
      const pick=((next-1)%14)+1;
      packNumber.value=String(pack);pickNumber.value=String(pick);
      if(stageStatus)stageStatus.textContent=pickedCards.length>=42?'ドラフト完了':'次：'+pack+'-'+pick;
    }else if(stageStatus){stageStatus.textContent='手動';}
  };
  const renderDraftStage=()=>{
    if(!stageAdvice)return;
    const pack=Math.max(1,Math.min(3,Number(packNumber?.value||1)));
    const pick=Math.max(1,Math.min(15,Number(pickNumber?.value||1)));
    let title='',body='';
    if(pack===1&&pick<=5){title='序盤：色を開けておく';body='単体性能と柔軟性を優先。強いカードを取りつつ、まだ2色に固定しすぎない段階です。';}
    else if(pack===1){title='1パック後半：流れを読む';body='繰り返し流れてくる色を意識し、主色候補を絞ります。弱いカードで無理に色を守る必要はありません。';}
    else if(pack===2&&pick<=5){title='2パック序盤：軸を固める';body='ここからは選んだ色・アーキタイプとの噛み合いを重視。多少GIH WRが下でも必要な役割を優先します。';}
    else if(pack===2){title='2パック後半：不足を埋める';body='クリーチャー数、除去、2〜3マナ域を確認し、完成形に必要な役割を優先して集めます。';}
    else if(pack===3&&pick<=5){title='3パック序盤：完成度を上げる';body='色替えは最小限にして、デッキに実際に入るカードを優先。除去や弱いマナ域の補強を重視します。';}
    else {title='終盤：23枚を完成させる';body='サイド候補よりも、メインデッキの穴を埋めるカードを優先。マナカーブと枚数を最終調整します。';}
    stageAdvice.innerHTML='<strong>'+title+'</strong><p>'+body+'</p>';
  };
  const currentColorProfile=()=>{
    const counts={W:0,U:0,B:0,R:0,G:0};
    if(!lastRender)return {counts,top:[]};
    const byName=new Map(lastRender.cards.map(c=>[c.name,c]));
    pickedCards.forEach(name=>{
      const card=byName.get(name);if(!card)return;
      (card.colors||[]).forEach(color=>{if(counts[color]!==undefined)counts[color]+=1;});
    });
    return {counts,top:Object.entries(counts).sort((a,b)=>b[1]-a[1])};
  };

  const colorFitScore=card=>{
    const {top}=currentColorProfile();
    const colors=card?.colors||[];
    if(!colors.length||pickedCards.length<5)return 0;
    const pack=Math.max(1,Math.min(3,Number(packNumber?.value||1)));
    const main=top[0]?.[0], second=top[1]?.[0], third=top[2]?.[0];
    const mainCount=top[0]?.[1]||0, secondCount=top[1]?.[1]||0;
    let score=0;
    colors.forEach(color=>{
      if(color===main)score+=pack===1?0.6:1.6;
      else if(color===second)score+=pack===1?0.3:1.1;
      else if(color===third&&pack===1)score+=0.1;
      else if(pack>=2&&mainCount>=secondCount+2)score-=1.2;
    });
    if(pack===3&&colors.every(c=>c===main||c===second))score+=1.5;
    return score;
  };
  const assistantNeed=()=>{
    const creature=Math.max(0,Number(countCreature?.value||0));
    const removal=Math.max(0,Number(countRemoval?.value||0));
    const advantage=Math.max(0,Number(countAdvantage?.value||0));
    const finisher=Math.max(0,Number(countFinisher?.value||0));
    const needs=[
      {role:'序盤要員',label:'クリーチャー',gap:Math.max(0,15-creature)},
      {role:'除去',label:'除去',gap:Math.max(0,4-removal)},
      {role:'アドバンテージ',label:'アドバンテージ',gap:Math.max(0,3-advantage)},
      {role:'フィニッシャー',label:'フィニッシャー',gap:Math.max(0,2-finisher)}
    ].sort((a,b)=>b.gap-a.gap);
    return needs;
  };

  const renderDraftAssistant=(set,cards,jaCards,archKey)=>{
    if(!assistantResult||!assistantPicks)return;
    const needs=assistantNeed();
    const topNeed=needs[0];
    const byName=new Map(cards.map(c=>[c.name,c]));
    const jaMap=buildJapaneseMap(jaCards);
    const ranked=rankingFor(set,archKey).map(item=>({item,card:byName.get(item.name)})).filter(x=>x.card);
    const pack=Math.max(1,Math.min(3,Number(packNumber?.value||1)));
    const pick=Math.max(1,Math.min(14,Number(pickNumber?.value||1)));
    const early=(pack===1&&pick<=5);
    const late=(pack===3&&pick>=7);
    const scored=ranked.map(x=>{
      const role=roleFor(x.card);
      const wr=Number(x.item.wr||0);
      let score=wr;
      if(!early&&role===topNeed.role)score+=topNeed.gap*2.2;
      if(pack>=2&&role==='アーキ中核')score+=1.5;
      if(late&&role===topNeed.role)score+=3;
      if(late&&Number(x.card.cmc||0)<=3)score+=0.8;
      score+=colorFitScore(x.card);
      return {...x,assistantScore:score};
    }).sort((a,b)=>b.assistantScore-a.assistantScore);
    const recommended=scored.slice(0,3);
    const total=(Number(countCreature?.value||0)+Number(countRemoval?.value||0)+Number(countAdvantage?.value||0)+Number(countFinisher?.value||0));
    const profile=currentColorProfile(), topColors=profile.top.filter(x=>x[1]>0).slice(0,2);
    const colorNames={W:'白',U:'青',B:'黒',R:'赤',G:'緑'};
    const colorText=topColors.length>=2&&pickedCards.length>=5?' 現在は'+topColors.map(x=>colorNames[x[0]]).join('')+'寄り。':'';
    const stageText=early?'序盤なので単体性能を優先。':late?'終盤なのでデッキの穴を埋めるカードを優先。':'アーキタイプと不足役割を優先。';
    const needText=topNeed.gap>0?stageText+colorText+' 今は「'+topNeed.label+'」が不足気味です。':stageText+colorText+' 大きな不足はありません。';
    assistantResult.querySelector('strong').textContent=(total?'現在の入力：'+total+'項目分。 ':'')+needText;
    if(!recommended.length){assistantPicks.innerHTML='<div class="limited-assistant-pick"><strong>候補準備中</strong><small>この役割の上位カードが見つからないため、優先ピックTOP10を参考にしてください。</small></div>';return;}
    assistantPicks.innerHTML=recommended.map(({item,card},i)=>{
      const name=getDisplayName(card.name,jaMap.get(card.name));
      return '<article class="limited-assistant-pick"><strong>'+(i+1)+'位 '+name+'</strong><small>'+roleFor(card)+' / GIH WR '+Number(item.wr||0).toFixed(1)+'%</small><button type="button" class="limited-pick-button" data-pick-card="'+card.name.replace(/"/g,'&quot;')+'">＋ピック</button></article>';
    }).join('');
  };
  const fitsArchetype=(card,archKey)=>{
    if(archKey==='ALL')return true;
    const allowed=new Set(ARCHETYPES[archKey]?.colors||[]), colors=card?.colors||[];
    return colors.every(c=>allowed.has(c));
  };
  const rankingFor=(set,archKey)=>archKey!=='ALL'&&Array.isArray(set.archetypeCards?.[archKey])&&set.archetypeCards[archKey].length?set.archetypeCards[archKey]:(set.ranking||[]);
  const buildPool=(set,cards,archKey,role='ALL')=>{
    const byName=new Map(cards.map(c=>[c.name,c]));
    return rankingFor(set,archKey)
      .map(item=>({item,card:byName.get(item.name)||null}))
      .filter(x=>fitsArchetype(x.card,archKey))
      .filter(x=>role==='ALL'||roleFor(x.card)===role)
      .slice(0,10);
  };

  const buildCommonUncommonPool=(set,cards,archKey)=>{
    const byName=new Map(cards.map(c=>[c.name,c]));
    return rankingFor(set,archKey)
      .map(item=>({item,card:byName.get(item.name)||null}))
      .filter(x=>x.card && ['common','uncommon'].includes(String(x.card.rarity||'').toLowerCase()))
      .filter(x=>fitsArchetype(x.card,archKey))
      .slice(0,5);
  };

  const renderQuickArches=set=>{
    if(!quickArches)return;
    const rows=(set.archetypes||[]).slice(0,3);
    quickArches.innerHTML=rows.length
      ? rows.map((r,i)=>`<button type="button" class="limited-quick-arch" data-arch="${r.code}">${i+1}位 ${r.name} ${Number(r.wr).toFixed(1)}%</button>`).join('')
      : '<span class="limited-series-note">勝率上位アーキタイプを準備中です</span>';
    quickArches.querySelectorAll('.limited-quick-arch').forEach(btn=>{
      btn.addEventListener('click',()=>{
        archSelector.value=btn.dataset.arch;
        applyArch();
      });
    });
  };

  const syncCurrentView=(set,archKey)=>{
    if(currentView)currentView.innerHTML=`<span>${set.code}</span><span>${(ARCHETYPES[archKey]||ARCHETYPES.ALL).name}</span>`;
    if(quickArches)quickArches.querySelectorAll('.limited-quick-arch').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.arch===archKey));
  };

  const renderBestColors=set=>{
    if(!bestColors)return;
    const rows=(set.archetypes||[]).slice(0,3);
    if(!rows.length){bestColors.textContent='17Lands集計を基準に順次更新';return;}
    bestColors.innerHTML=rows.map((r,i)=>`${i+1}位 ${r.name} ${Number(r.wr).toFixed(1)}%${r.games?`（${Number(r.games).toLocaleString()}ゲーム）`:''}`).join('<br>');
  };

  const renderCommonUncommon=(set,cards,jaCards,archKey)=>{
    if(!cuGrid)return;
    const jaMap=buildJapaneseMap(jaCards), pool=buildCommonUncommonPool(set,cards,archKey), arch=ARCHETYPES[archKey]||ARCHETYPES.ALL;
    if(cuNote)cuNote.textContent=`${arch.name}で使えるコモン・アンコモンをGIH WR順に表示`;
    if(!pool.length){cuGrid.innerHTML='<div class="limited-card"><strong>候補を準備中です。</strong><p>カード情報取得後に表示します。</p></div>';return;}
    cuGrid.innerHTML=pool.map(({item,card},i)=>{
      const ja=jaMap.get(item.name),shown=ja||card,image=getImage(shown),name=getDisplayName(item.name,ja),rarity=String(card.rarity||'').toLowerCase()==='common'?'コモン':'アンコモン';
      const href=shown?.scryfall_uri||`https://scryfall.com/search?q=${encodeURIComponent('!"'+item.name+'"')}`;
      return `<a class="limited-cu-card" href="${href}" target="_blank" rel="noopener noreferrer">${image?`<img src="${image}" alt="${name}" loading="lazy" decoding="async">`:'<div class="limited-image-placeholder">画像準備中</div>'}<div class="limited-cu-body"><span class="limited-role-badge">${rarity}</span><strong>${i+1}位 ${name}</strong>${name!==item.name?`<small>${item.name}</small>`:''}<small>GIH WR ${Number(item.wr).toFixed(1)}% / ${Number(item.games||0).toLocaleString()}ゲーム</small></div></a>`;
    }).join('');
  };

  const renderPool=(setKey,set,cards,jaCards,archKey)=>{
    lastRender={setKey,set,cards,jaCards,archKey};
    const jaMap=buildJapaneseMap(jaCards), pool=buildPool(set,cards,archKey,activeRole), arch=ARCHETYPES[archKey]||ARCHETYPES.ALL;
    if(archetypes)archetypes.textContent=arch.name;
    renderBestColors(set);
    if(archSummary)archSummary.innerHTML=`<span>${arch.name}</span><span>${activeRole==='ALL'?'全役割':activeRole}</span><span>${pool.length}枚を優先表示</span><span>GIH WR順</span>`;
    if(topNote)topNote.textContent=`${arch.name}・${archKey==='ALL'?'全体GIH WR':'アーキタイプ専用GIH WR'}順・${formatDate(archKey==='ALL'?set.updatedAt:(set.archetypeCardsUpdatedAt||set.updatedAt))}`;
    if(galleryTitle)galleryTitle.textContent=`${set.name}｜${arch.name} 優先カード`;
    renderPlan(set,cards,archKey);
    renderSynergy(set,cards,jaCards,archKey);
    syncAutoStage();renderDraftStage();renderColorRead();
    renderDraftAssistant(set,cards,jaCards,archKey);
    syncPickedCounts();renderPickedList();
    if(!pool.length){if(topCards)topCards.innerHTML='<li>条件に合う候補を準備中です</li>';gallery.innerHTML='<div class="limited-card"><strong>条件に合うカードがありません。</strong><p>役割を「すべて」に戻すか、別のアーキタイプを選んでください。</p></div>';renderCommonUncommon(set,cards,jaCards,archKey);return;}
    if(topCards)topCards.innerHTML=pool.map(({item,card})=>{const ja=jaMap.get(item.name),name=getDisplayName(item.name,ja),en=name!==item.name?`<small style="display:block;color:var(--muted)">${item.name}</small>`:'';return `<li><strong>${name}</strong>${en}<span class="limited-role-badge">${roleFor(card)}</span> GIH WR ${Number(item.wr).toFixed(1)}%${item.games?` / ${Number(item.games).toLocaleString()}ゲーム`:''}</li>`;}).join('');
    gallery.innerHTML=pool.map(({item,card},i)=>{const ja=jaMap.get(item.name),shown=ja||card,image=getImage(shown),name=getDisplayName(item.name,ja),href=shown?.scryfall_uri||`https://scryfall.com/search?q=${encodeURIComponent('!"'+item.name+'"')}`,eager=i<3;return `<article class="limited-image-card limited-ranked-card"><span class="limited-rank-badge">${i+1}位</span><a href="${href}" target="_blank" rel="noopener noreferrer">${image?`<img src="${image}" alt="${name}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''}>`:'<div class="limited-image-placeholder">画像準備中</div>'}<strong>${name}</strong>${name!==item.name?`<span>${item.name}</span>`:''}<span class="limited-role-badge">${roleFor(card)}</span><span>GIH WR ${Number(item.wr).toFixed(1)}%</span></a><button type="button" class="limited-pick-button" data-pick-card="${item.name.replace(/"/g,'&quot;')}">＋ピック</button></article>`;}).join('');
    renderCommonUncommon(set,cards,jaCards,archKey);
  };

  const renderCurrent=async()=>{
    const setKey=selector.value, set=SETS[setKey], archKey=archSelector.value||'ALL', active=++requestId;
    const ranking=rankingFor(set,archKey);
    if(!ranking.length){if(topCards)topCards.innerHTML='<li>保存ランキングを準備中です</li>';gallery.innerHTML='<div class="limited-card"><strong>保存ランキングを準備しています。</strong></div>';return;}
    gallery.innerHTML='<p>保存ランキングからカード情報を読み込み中です…</p>';

    const cards=await fetchRankingCards(`${setKey}-${archKey}`,ranking);
    if(active!==requestId)return;
    renderPool(setKey,set,cards,[],archKey);

    const jaCards=await fetchJapaneseSetCards(setKey);
    if(active!==requestId)return;
    if(jaCards?.length)renderPool(setKey,set,cards,jaCards,archKey);
  };

  const syncSeriesAffiliate=setKey=>{if(document.body)document.body.dataset.affiliateSeries=setKey;window.dispatchEvent(new CustomEvent('magsta:series-change',{detail:{set:setKey}}));};
  const applySet=(setKey,updateUrl=true)=>{
    activeRole='ALL';activeSynergyCard='';
    if(roleFilter)roleFilter.querySelectorAll('button[data-role]').forEach((b,i)=>b.classList.toggle('is-active',i===0));
    const key=SETS[setKey]?setKey:'fra',set=SETS[key],guide=set.guide||PENDING;selector.value=key;loadPicked();syncAutoStage();
    if(kicker)kicker.textContent=`リミテッド / ${set.code}`;if(title)title.textContent=`${set.name} リミテッド攻略`;if(description)description.textContent=`${set.name}（${set.code}）を、シリーズ → アーキタイプ → 優先カードの順で確認できます。`;
    if(cardDataLink)cardDataLink.href=`https://www.17lands.com/card_data?expansion=${set.code}&format=PremierDraft&sort=ever_drawn_win_rate%2Cdesc&time_period=ALL_TIME&view=table`;
    if(colorDataLink)colorDataLink.href=`https://www.17lands.com/deck_color_data?expansion=${set.code}&format=PremierDraft`;
    if(scryfallLink)scryfallLink.href=`https://scryfall.com/sets/${key}?as=grid&order=set&lang=ja`;
    if(articleLink){articleLink.hidden=!set.article;if(set.article)articleLink.href=set.article;}
    if(bestColors)bestColors.textContent=guide.colors;if(firstPick)firstPick.textContent=guide.firstPick;if(guideStatus)guideStatus.textContent=guide.status;
    renderQuickArches(set);
    syncCurrentView(set,archSelector.value||'ALL');
    syncSeriesAffiliate(key);
    if(updateUrl){const u=new URL(location.href);u.searchParams.set('set',key);u.searchParams.set('arch',archSelector.value||'ALL');history.replaceState({},'',u);}
    renderCurrent().catch(()=>{gallery.innerHTML='<div class="limited-card"><strong>カード情報を取得できませんでした。</strong><p>保存ランキングは維持されています。</p></div>';});
  };
  const applyArch=()=>{activeRole='ALL';activeSynergyCard='';if(roleFilter)roleFilter.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('is-active',i===0));const set=SETS[selector.value];syncCurrentView(set,archSelector.value);const u=new URL(location.href);u.searchParams.set('set',selector.value);u.searchParams.set('arch',archSelector.value);history.replaceState({},'',u);renderCurrent();};

  document.addEventListener('click',event=>{
    const add=event.target.closest('[data-pick-card]');
    if(add){event.preventDefault();addPickedCard(add.dataset.pickCard);return;}
    const remove=event.target.closest('[data-remove-pick]');
    if(remove){pickedCards.splice(Number(remove.dataset.removePick),1);refreshPickedAssistant();}
  });
  if(clearPicks)clearPicks.addEventListener('click',()=>{pickedCards=[];refreshPickedAssistant();});
  const draftStageInputs=[packNumber,pickNumber].filter(Boolean);
  draftStageInputs.forEach(input=>input.addEventListener('input',()=>{renderDraftStage();renderColorRead();if(lastRender)renderDraftAssistant(lastRender.set,lastRender.cards,lastRender.jaCards,lastRender.archKey);}));
  if(autoStage)autoStage.addEventListener('change',()=>{syncAutoStage();renderDraftStage();renderColorRead();if(lastRender)renderDraftAssistant(lastRender.set,lastRender.cards,lastRender.jaCards,lastRender.archKey);});
  const assistantInputs=[countCreature,countRemoval,countAdvantage,countFinisher].filter(Boolean);
  assistantInputs.forEach(input=>input.addEventListener('input',()=>{
    if(lastRender)renderDraftAssistant(lastRender.set,lastRender.cards,lastRender.jaCards,lastRender.archKey);
  }));
  if(roleFilter)roleFilter.addEventListener('click',event=>{
    const button=event.target.closest('button[data-role]');
    if(!button)return;
    activeRole=button.dataset.role||'ALL';
    roleFilter.querySelectorAll('button[data-role]').forEach(b=>b.classList.toggle('is-active',b===button));
    if(lastRender)renderPool(lastRender.setKey,lastRender.set,lastRender.cards,lastRender.jaCards,lastRender.archKey);
  });

  const cached=readSnapshotCache();if(cached)mergeSnapshots(cached);
  const params=new URLSearchParams(location.search),initialSet=(params.get('set')||'fra').toLowerCase(),initialArch=(params.get('arch')||'ALL').toUpperCase();
  archSelector.value=ARCHETYPES[initialArch]?initialArch:'ALL';
  selector.addEventListener('change',()=>applySet(selector.value));archSelector.addEventListener('change',applyArch);
  applySet(initialSet,false);
  refreshSnapshots().then(ok=>{if(ok){const set=SETS[selector.value];renderQuickArches(set);syncCurrentView(set,archSelector.value||'ALL');renderCurrent();}});
})();
