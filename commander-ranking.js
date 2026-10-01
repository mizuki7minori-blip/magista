(() => {
  const commanders = [
    {rank:1,name:"Y'shtola, Night's Blessed",decks:"55,459",note:"FFコラボから人気が急上昇したエスパー統率者。"},
    {rank:2,name:"Edgar Markov",decks:"51,322",note:"吸血鬼部族の定番。展開力の高いマルドゥ統率者。"},
    {rank:3,name:"The Ur-Dragon",decks:"51,168",note:"5色ドラゴンの代表格。大型ドラゴンを豪快に展開。"},
    {rank:4,name:"Atraxa, Praetors' Voice",decks:"45,170",note:"増殖を軸に幅広い戦略を取れる人気統率者。"},
    {rank:5,name:"Krenko, Mob Boss",decks:"44,295",note:"ゴブリンを大量展開する赤単の定番。"},
    {rank:6,name:"Vivi Ornitier",decks:"41,314",note:"FF出身。呪文連打とコンボを組みやすい人気統率者。"},
    {rank:7,name:"Sauron, the Dark Lord",decks:"40,257",note:"指輪物語の人気統率者。動員とカード選択を活用。"},
    {rank:8,name:"Kaalia of the Vast",decks:"39,966",note:"天使・デーモン・ドラゴンを踏み倒す豪快な統率者。"},
    {rank:9,name:"Teval, the Balanced Scale",decks:"39,242",note:"スゥルタイ色の墓地活用を得意とする統率者。"},
    {rank:10,name:"Fire Lord Azula",decks:"38,192",note:"攻撃的な呪文戦略を組みやすい人気統率者。"}
  ];
  const grid = document.getElementById('commander-ranking');
  if(!grid) return;
  const placeholder = name => `https://placehold.co/488x680?text=${encodeURIComponent(name)}`;
  grid.innerHTML = commanders.map(c => `<article class="commander-card" data-name="${c.name.replace(/"/g,'&quot;')}"><div class="commander-rank">#${c.rank}</div><div class="commander-image-wrap"><div class="commander-image-placeholder">画像を読み込み</div></div><div class="commander-card-body"><h3>${c.name}</h3><p>${c.note}</p><div class="commander-meta"><span>EDHREC ${c.decks} デッキ</span></div><div class="commander-actions"><a class="button secondary" href="commander-builder.html?commander=${encodeURIComponent(c.name)}">この統率者でデッキ作成</a></div></div></article>`).join('');
  const hydrate = async el => {
    if(el.dataset.done) return;
    el.dataset.done='1';
    const name = el.dataset.name;
    try{
      const r = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
      if(!r.ok) throw 0;
      const c = await r.json();
      const img = c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal || placeholder(name);
      el.querySelector('.commander-image-wrap').innerHTML = `<img src="${img}" loading="lazy" decoding="async" alt="${name}">`;
    }catch(e){
      el.querySelector('.commander-image-wrap').innerHTML = `<img src="${placeholder(name)}" loading="lazy" alt="${name}">`;
    }
  };
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting){ io.unobserve(e.target); hydrate(e.target); } }), {rootMargin:'120px 0px'});
    grid.querySelectorAll('.commander-card').forEach(el=>io.observe(el));
  } else grid.querySelectorAll('.commander-card').forEach(hydrate);
})();