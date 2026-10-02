(()=>{'use strict';
const grid=document.getElementById('commander-goal-recommendations');
const tabs=[...document.querySelectorAll('.commander-goal-tab')];
const refresh=document.getElementById('commander-goal-refresh');
if(!grid||!tabs.length)return;
const DATA={
 balanced:[
  ["Atraxa, Praetors' Voice","増殖・カウンター・プレインズウォーカーなど複数戦略を取りやすい。"],
  ["Muldrotha, the Gravetide","墓地を使いながら継続的にアドバンテージを取れる。"],
  ["Isshin, Two Heavens as One","攻撃誘発を軸にしつつ除去や展開も両立しやすい。"],
  ["Alela, Artful Provocateur","アーティファクト・エンチャントと飛行戦力を自然に組み合わせやすい。"],
  ["Sauron, the Dark Lord","動員・手札入れ替え・大型統率者の圧力をバランス良く使える。"],
  ["Kenrith, the Returned King","5色の柔軟性が高く、卓に合わせて役割を変えやすい。"],
  ["Prosper, Tome-Bound","衝動的ドローと宝物で安定してリソースを伸ばせる。"],
  ["Chulane, Teller of Tales","展開とドローを同時に進めやすく、対応力も高い。"],
  ["Korvold, Fae-Cursed King","生け贄とドローで攻防のバランスを取りやすい。"],
  ["Breya, Etherium Shaper","アーティファクト軸で除去・コンボ・展開を柔軟に切り替えられる。"]
 ],
 control:[
  ["Grand Arbiter Augustin IV","相手を遅らせながら自分の呪文を軽くできる。"],
  ["Talion, the Kindly Lord","相手の行動に反応しながら継続的にカード差を作りやすい。"],
  ["Shorikai, Genesis Engine","手札を整えながら盤面をコントロールしやすい。"],
  ["Ertai Resurrected","打ち消し・除去を統率者自身が担える。"],
  ["Marchesa, Dealer of Death","犯罪誘発と手札補充で妨害を価値に変えやすい。"],
  ["Oloro, Ageless Ascetic","継続的なライフゲインで長期戦を支えやすい。"],
  ["Aminatou, the Fateshifter","ブリンクとトップ操作で盤面を細かく制御できる。"],
  ["Zur the Enchanter","必要なエンチャントを直接探してコントロールしやすい。"],
  ["Tasigur, the Golden Fang","墓地を使いながら長期戦で手札を回復しやすい。"],
  ["Baral, Chief of Compliance","打ち消し中心の構成でテンポと手札効率を両立しやすい。"]
 ],
 speed:[
  ["Krenko, Mob Boss","ゴブリンを急速に増やして早いターンから打点を作れる。"],
  ["Winota, Joiner of Forces","攻撃から高コストの人間を踏み倒して展開速度を上げる。"],
  ["Magda, Brazen Outlaw","宝物を増やしながらドラゴンやアーティファクトへ高速アクセス。"],
  ["Animar, Soul of Elements","クリーチャー連打でコストを下げ、大型まで一気に展開しやすい。"],
  ["The Ur-Dragon","コスト軽減と大型ドラゴンの連鎖で爆発力を出しやすい。"],
  ["Godo, Bandit Warlord","装備品から一気に勝ち筋へ向かえる高速プランを取りやすい。"],
  ["Rograkh, Son of Rohgahh","0マナ統率者として高速展開やコンボの起点になりやすい。"],
  ["Jeska, Thrice Reborn","低コスト統率者と組み合わせて速い打点やコンボを狙える。"],
  ["Selvala, Heart of the Wilds","大量マナを出して大型呪文へ素早く到達しやすい。"],
  ["Omnath, Locus of Creation","土地展開からマナとカード差を一気に伸ばしやすい。"]
 ],
 combo:[
  ["Vivi Ornitier","呪文連打とマナ生成を利用したコンボ構築に向く。"],
  ["Niv-Mizzet, Parun","ドローとダメージ誘発を利用した定番コンボを組みやすい。"],
  ["Kinnan, Bonder Prodigy","マナ加速を倍化しつつ無限マナ系コンボにつなげやすい。"],
  ["Tayam, Luminous Enigma","カウンターと墓地を使ったループコンボを構築しやすい。"],
  ["Tivit, Seller of Secrets","アーティファクト・投票・追加ターン系コンボと相性が良い。"]
 ]
};
const LABEL={balanced:'バランス',control:'妨害',speed:'スピード',combo:'コンボ'};
const imgOf=c=>c?.image_uris?.normal||c?.card_faces?.[0]?.image_uris?.normal||'';
let current='balanced',request=0,offset=0;
async function fetchCard(name){
 try{const r=await fetch('https://api.scryfall.com/cards/named?exact='+encodeURIComponent(name));if(!r.ok)return null;return await r.json();}catch{return null;}
}
async function render(goal){
 current=goal;const id=++request;
 tabs.forEach(b=>b.classList.toggle('is-active',b.dataset.goal===goal));
 grid.innerHTML='<p>おすすめ統率者を読み込んでいます…</p>';
 const all=DATA[goal]||DATA.balanced;
 const start=all.length?offset%all.length:0;
 const rows=[];for(let i=0;i<Math.min(5,all.length);i++)rows.push(all[(start+i)%all.length]);
 const cards=await Promise.all(rows.map(async([name,note])=>({name,note,card:await fetchCard(name)})));
 if(id!==request)return;
 grid.innerHTML=cards.map(({name,note,card})=>{
   const display=card?.printed_name||card?.name||name;
   const img=imgOf(card);
   const href='commander-builder.html?strategy='+encodeURIComponent(goal)+'&commander='+encodeURIComponent(card?.name||name);
   return '<article class="commander-goal-rec">'+(img?'<img src="'+img+'" loading="lazy" decoding="async" alt="'+display.replace(/"/g,'&quot;')+'">':'')+'<div class="commander-goal-rec-body"><span class="commander-meta">'+LABEL[goal]+'向け</span><h3>'+display+'</h3><p>'+note+'</p><a class="button secondary" href="'+href+'">この統率者で作る</a></div></article>';
 }).join('');
}
tabs.forEach(b=>b.addEventListener('click',()=>{offset=0;render(b.dataset.goal);}));
if(refresh)refresh.addEventListener('click',()=>{offset+=5;render(current);});
render(current);
})();