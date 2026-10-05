(() => {
  const articles = [
    {path:"article-weekly-news-2026-10-05.html",category:"news",label:"週間ニュース",title:"【10月5日】MTG週間ニュース｜リアリティ・フラクチャー発売、横浜Modern TOP8が確定",desc:"横浜Modern TOP8と新カードの実戦採用を整理。"},
    {path:"article-zeta-set-2026-10-02.html",category:"news",label:"NEWS",title:"Secret Lair × MSCHF「The Zeta Set」が12月9日に再販決定",desc:"24時間限定の受注販売と発送予定を日本語で整理。"},
    {path:"article-weekend-2026-10-02.html",category:"tournament",label:"週末注目情報",title:"【10月2日】MTG週末注目情報｜新環境スタンダードに注目",desc:"週末に見るべき大会・デッキ・環境情報を整理。"},
    {path:"article-fra-draft-2026-09-25.html",category:"limited",label:"リミテッド",title:"リアリティ・フラクチャーのドラフトで取るべきカードは？",desc:"初手候補とピックの考え方を日本語で確認。"},
    {path:"article-weekend-2026-09-25.html",category:"tournament",label:"週末注目情報",title:"【9月25日】週末注目情報｜スタンダード・モダン・パイオニア",desc:"直近大会から今週末の注目デッキを整理。"},
    {path:"article-meta-2026-09.html",category:"deck",label:"デッキ・環境",title:"現在のメタゲームと注目カード動向",desc:"競技シーンと注目カードの変化をまとめて確認。"}
  ];
  const current = location.pathname.split("/").pop() || "index.html";
  const currentItem = articles.find(a => a.path === current);
  const body = document.querySelector(".article-body");
  if (!body || !currentItem || document.querySelector(".related-reading")) return;

  const picks = articles
    .filter(a => a.path !== current)
    .sort((a,b) => Number(b.category === currentItem.category) - Number(a.category === currentItem.category))
    .slice(0,3);

  if (!picks.length) return;
  const section = document.createElement("section");
  section.className = "related-reading";
  section.setAttribute("aria-labelledby","related-reading-title");
  section.innerHTML = `
    <span class="section-kicker">RELATED</span>
    <h2 id="related-reading-title">あわせて読みたい</h2>
    <div class="related-reading-grid">
      ${picks.map(a => `
        <a class="related-reading-card" href="${a.path}">
          <span>${a.label}</span>
          <strong>${a.title}</strong>
          <p>${a.desc}</p>
          <b>記事を読む →</b>
        </a>`).join("")}
    </div>`;
  body.appendChild(section);
})();