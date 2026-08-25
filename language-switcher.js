(() => {
  'use strict';
  const translations = {
    'ニュース':'News','タイムライン':'Timeline','5chまとめ':'Community','ピックアップ':'Weekly Picks','カード相場':'Card Market','ランキング':'Ranking',
    'MAGIC: THE GATHERING COMMUNITY':'MAGIC: THE GATHERING COMMUNITY','MTGの「今」を、':'MTG, right now,','もっと面白く。':'More exciting.','ニュース、5chまとめ、カード相場、新カード情報まで。':'News, community, card prices, and new card information.','マジック：ザ・ギャザリングの話題をひとつに。':'Everything Magic: The Gathering, in one place.',
    '最新記事を見る':'Latest Articles','カード相場を見る':'View Card Market','MTGの最新情報・話題を随時更新':'Latest MTG news and topics, updated regularly','最新記事':'Latest Articles','もっと見る →':'View all →','MTG最新タイムライン':'MTG Latest Timeline','日本語サイト':'Japanese Sites','英語サイト':'English Sites','日本語サイトと英語サイトを分け、英語記事には日本語要約を付けています。':'Japanese and English sources are separated; English articles include Japanese summaries.','今週のピックアップカード':'Weekly Card Picks','今週MAGSTAが注目する3枚。相場・話題性・今後の動きに注目したいカードをピックアップ。':'Three cards MAGSTA is watching this week, based on market trends, buzz, and future potential.','5chまとめ':'Community','一覧 →':'View all →','カード相場':'Card Market','高額カード TOP5':'Top 5 Most Valuable Cards','人気記事':'Popular Articles','これから掲載予定':'Coming soon','MAGSTA MTG':'MAGSTA MTG','MTGのニュース、コミュニティ、カード情報をまとめるサイトです。':'MTG news, community discussions, and card information in one place.','相場情報を見る →':'View market information →','今週の注目':'This Week','値動き注目':'Price Watch','隠れ注目':'Hidden Gem','注目度':'Interest','読み込み中…':'Loading…','最新情報を取得中…':'Loading latest information…'
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
  function init(){collect();addSwitcher();apply();}
  document.addEventListener('DOMContentLoaded',init);
  const observer=new MutationObserver(()=>{if(!document.querySelector('.lang-switcher'))addSwitcher();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
