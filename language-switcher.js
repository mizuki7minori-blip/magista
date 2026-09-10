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
  function init(){collect();addSwitcher();addHeaderFix();apply();}
  document.addEventListener('DOMContentLoaded',init);
  const observer=new MutationObserver(()=>{if(!document.querySelector('.lang-switcher'))addSwitcher();if(!document.getElementById('magsta-header-fix'))addHeaderFix();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
