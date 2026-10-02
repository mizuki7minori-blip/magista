(()=>{'use strict';
const grid=document.getElementById('commander-goal-recommendations');
const tabs=[...document.querySelectorAll('.commander-goal-tab')];
if(!grid||!tabs.length)return;
const DATA={
 balanced:[
  ["Atraxa, Praetors' Voice","増殖・カウンター・プレインズウォーカーなど複数戦略を取りやすい。"],
  ["Muldrotha, the Gravetide","墓地を使いながら継続的にアドバンテージを取れる。"],
  ["Isshin, Two Heavens as One","攻撃誘発を軸にしつつ除去や展開も両立しやすい。"],
  ["Alela, Artful Provocateur","アーティファクト・エンチャントと飛行戦力を自然に組み合わせやすい。"],
  ["Sauron, the Dark Lord","動員・手札入れ替え・大型統率者の圧力をバランス良く使える。"]
 ],
 control:[
  ["Grand Arbiter Augustin IV","相手を遅らせながら自分の呪文を軽くできる。"],
  ["Talion, the Kindly Lord","相手の行動に反応しながら継続的にカード差を作りやすい。"],
  ["Shorikai, Genesis Engine","手札を整えながら盤面をコントロールしやすい。"],
  ["Ertai Resurrected","打ち消し・除去を統率者自身が担える。"],
  ["Marchesa, Dealer of Death","犯罪誘発と手札補充で妨害を価値に変えやすい。"]
 ],
 speed:[
  ["Krenko, Mob Boss","ゴブリンを急速に増やして早いターンから打点を作れる。"],
  ["Winota, Joiner of Forces","攻撃から高コストの人間を踏み倒して展開速度を上げる。"],
  ["Magda, Brazen Outlaw","宝物を増やしながらドラゴンやアーティファクトへ高速アクセス。"],
  ["Animar, Soul of Elements","クリーチャー連打でコストを下げ、大型まで一気に展開しやすい。"],
  ["The Ur-Dragon","コスト軽減と大型ドラゴンの連鎖で爆発力を出しやすい。"]
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
let current='balanced',request=0;
async function fetchCard(name){
 try{const r=await fetch('https://api.scryfall.com/cards/named?exact='+encodeURIComponent(name));if(!r.ok)return null;return await r.json();}catch{return null;}
}
async function render(goal){
 current=goal;const id=++request;
 tabs.forEach(b=>b.classList.toggle('is-active',b.dataset.goal===goal));
 grid.innerHTML='<p>おすすめ統率者を読み込んでいます…</p>';
 const rows=DATA[goal]||DATA.balanced;
 const cards=await Promise.all(rows.map(async([name,note])=>({name,note,card:await fetchCard(name)})));
 if(id!==request)return;
 grid.innerHTML=cards.map(({name,note,card})=>{
   const display=card?.printed_name||card?.name||name;
   const img=imgOf(card);
   const href='commander-builder.html?strategy='+encodeURIComponent(goal)+'&commander='+encodeURIComponent(card?.name||name);
   return '<article class="commander-goal-rec">'+(img?'<img src="'+img+'" loading="lazy" decoding="async" alt="'+display.replace(/"/g,'&quot;')+'">':'')+'<div class="commander-goal-rec-body"><span class="commander-meta">'+LABEL[goal]+'向け</span><h3>'+display+'</h3><p>'+note+'</p><a class="button secondary" href="'+href+'">この統率者で作る</a></div></article>';
 }).join('');
}
tabs.forEach(b=>b.addEventListener('click',()=>render(b.dataset.goal)));
render(current);
})();