(() => {
  'use strict';
  const translations = {
    '記事一覧':'Articles','ニュース':'News','タイムライン':'Timeline','5chまとめ':'Community','ピックアップ':'Picks','今日のピックアップ':'Daily Picks','ランキング':'Ranking',
    'MAGIC: THE GATHERING COMMUNITY':'MAGIC: THE GATHERING COMMUNITY','MTGの「今」を、':'MTG, right now,','もっと面白く。':'More exciting.','ニュース、5chまとめ、大会情報、新カード情報まで。':'News, community, tournament information, and new cards.','ニュース、5chまとめ、カード相場、新カード情報まで。':'News, community, card prices, and new card information.','マジック：ザ・ギャザリングの話題をひとつに。':'Everything Magic: The Gathering, in one place.',
    '最新記事を見る':'Latest Articles','MTGの最新情報・話題を随時更新':'Latest MTG news and topics, updated regularly','最新記事':'Latest Articles','もっと見る →':'View all →','MTG最新タイムライン':'MTG Latest Timeline','日本語サイト':'Japanese Sites','英語サイト':'English Sites','日本語サイトと英語サイトを分け、英語記事には日本語要約を付けています。':'Japanese and English sources are separated; English articles include Japanese summaries.','大会・新カード・コミュニティの注目候補から、毎日3枚を自動で紹介します。':'Three cards are automatically selected daily from tournament, new-card, and community highlights.','大会・新カード・コミュニティの注目候補から、毎日3枚を自動で入れ替えます。':'Three cards are automatically rotated daily from tournament, new-card, and community highlights.','人気記事':'Popular Articles','これから掲載予定':'Coming soon','MAGSTA MTG':'MAGSTA MTG','MTGのニュース、コミュニティ、大会情報、新カード情報をまとめるサイトです。':'MTG news, community discussions, tournament information, and new cards in one place.','読み込み中…':'Loading…','最新情報を取得中…':'Loading latest information…','カード画像を取得できませんでした':'Card image unavailable','カード詳細を見る →':'View card details →'
  };
  const original = new WeakMap();
  let lang = localStorage.getItem('magsta-language') || 'ja';
  const textNodes = [];
  function collect(root=document.body){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest('.lang-switcher')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});let n;while(n=walker.nextNode()){if(n.nodeValue.trim()) textNodes.push(n);}}
  function apply(){
    document.documentElement.lang=lang;
    textNodes.forEach(node=>{if(!original.has(node))original.set(node,node.nodeValue);const value=original.get(node);if(lang==='ja'){node.nodeValue=value;return;}let out=value;Object.entries(translations).forEach(([ja,en])=>{out=out.split(ja).join(en);});node.nodeValue=out;});
    document.querySelectorAll('.lang-switcher button').forEach(b=>b.classList.toggle('is-active',b.dataset.lang===lang));
  }
  function addSwitcher(){
    const header=document.querySelector('.header-inner'); if(!header||header.querySelector('.lang-switcher'))return;
    const wrap=document.createElement('div');wrap.className='lang-switcher';wrap.setAttribute('aria-label','Language');
    wrap.innerHTML='<button type="button" data-lang="ja">🇯🇵 JP</button><span>/</span><button type="button" data-lang="en">🇺🇸 EN</button>';
    wrap.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{lang=button.dataset.lang;localStorage.setItem('magsta-language',lang);apply();}));
    header.appendChild(wrap);
  }
  function addHeaderFix(){
    if(document.getElementById('magsta-header-fix'))return;
    const style=document.createElement('style');style.id='magsta-header-fix';style.textContent='.header-inner{gap:14px;min-width:0}.site-header nav{flex:1;justify-content:flex-end;gap:clamp(12px,1.6vw,22px);min-width:0;font-size:.82rem}.site-header nav a{white-space:nowrap}.lang-switcher{flex:none}@media(max-width:1050px) and (min-width:801px){.site-header nav{gap:12px;font-size:.76rem}.lang-switcher{margin-left:4px}}';document.head.appendChild(style);
  }
  function addReadability(){
    if(document.getElementById('magsta-readability'))return;
    const style=document.createElement('style');style.id='magsta-readability';style.textContent=`
      :root{--line-soft:#25303d;--text-strong:#f8fafc}
      body{font-size:16px;letter-spacing:.005em}
      .container{width:min(1180px,calc(100% - 40px))}
      .site-header{box-shadow:0 4px 18px rgba(0,0,0,.18)}
      .site-header nav a{transition:color .18s ease,opacity .18s ease}
      .hero-text,.page-hero p:last-child,.article-lead{max-width:760px;line-height:1.9}
      .section-heading{margin-bottom:22px}
      .section-heading h2,.side-heading h2{font-size:1.65rem}
      .section-heading h2:after,.side-heading h2:after{content:'';display:block;width:34px;height:3px;margin-top:8px;border-radius:3px;background:var(--accent)}
      .article-card,.side-card{box-shadow:0 8px 28px rgba(0,0,0,.14)}
      .featured{padding:32px;box-shadow:0 12px 36px rgba(0,0,0,.2)}
      .featured h3{font-size:1.7rem;line-height:1.45}
      .compact{padding:22px 24px}
      .compact h2,.compact h3{font-size:1.05rem;line-height:1.55}
      .article-card p,.side-lead,.about p{line-height:1.85}
      .topic{padding:20px 4px}
      .topic b{font-size:.96rem;line-height:1.55}
      .topic small{display:block;margin-top:3px;line-height:1.5}
      .filter{gap:10px;margin-bottom:24px}
      .filter a{padding:8px 14px;font-weight:700;transition:.18s ease}
      .filter a.active{box-shadow:0 4px 14px rgba(117,216,255,.18)}
      .page-hero{padding:76px 0 58px}
      .page-hero h1{margin-bottom:16px}
      .article-page{max-width:860px}
      .article-body{font-size:1.04rem;line-height:1.95}
      .article-body h2{font-size:1.55rem;line-height:1.4;padding-left:12px;border-left:3px solid var(--accent);margin-top:48px}
      .article-body p{margin:1em 0}
      .article-body li{line-height:1.8}
      .notice{line-height:1.8;background:var(--panel2)}
      .pickup-grid{gap:16px}
      .pickup-card{padding:22px;box-shadow:0 8px 24px rgba(0,0,0,.14)}
      .pickup-info h3{font-size:1.12rem;line-height:1.45}
      .pickup-info p{font-size:.8rem;line-height:1.8}
      .button{min-height:44px;display:inline-flex;align-items:center;justify-content:center}
      .read-more,.side-link,.more{font-size:.8rem}
      @media(max-width:800px){
        body{font-size:15.5px}
        .container{width:min(100% - 28px,1180px)}
        .hero-inner{padding:58px 0}
        .hero-text{font-size:1rem;line-height:1.85}
        .section-heading h2,.side-heading h2{font-size:1.42rem}
        .featured{padding:24px}
        .featured h3{font-size:1.35rem}
        .compact{padding:19px 20px}
        .page-hero{padding:54px 0 42px}
        .article-body{font-size:1rem;line-height:1.9}
      }
      @media(max-width:520px){
        .container{width:calc(100% - 24px)}
        .site-header .header-inner{height:64px}
        .hero-inner{padding:48px 0 54px}
        .hero h1{font-size:clamp(2.8rem,15vw,4.6rem);line-height:1.05}
        .section-heading{margin-bottom:16px}
        .section-heading h2,.side-heading h2{font-size:1.3rem}
        .article-list{gap:10px}
        .featured{padding:21px}
        .featured h3{font-size:1.25rem;line-height:1.5}
        .pickup-card{padding:19px}
        .article-page{padding-top:34px}
        .article-page h1{font-size:clamp(1.9rem,9vw,3rem);line-height:1.25}
      }
    `;document.head.appendChild(style);
  }
  function init(){collect();addSwitcher();addHeaderFix();addReadability();apply();}
  document.addEventListener('DOMContentLoaded',init);
  const observer=new MutationObserver(()=>{if(!document.querySelector('.lang-switcher'))addSwitcher();if(!document.getElementById('magsta-header-fix'))addHeaderFix();if(!document.getElementById('magsta-readability'))addReadability();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
