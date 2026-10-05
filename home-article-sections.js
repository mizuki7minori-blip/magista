(() => {
  const articles = Array.isArray(window.MAGSTA_ARTICLES) ? window.MAGSTA_ARTICLES : [];
  if (!articles.length) return;

  const trending = articles
    .filter(a => Number.isInteger(a.trending))
    .sort((a,b) => a.trending - b.trending)
    .slice(0,3);

  const popularList = document.querySelector(".popular-articles-list");
  if (popularList && trending.length) {
    popularList.innerHTML = trending.map((a,index) => `
      <li><a href="${a.path}">
        <span class="popular-rank">${index + 1}</span>
        <div><small>${a.label}</small><strong>${a.title}</strong><p>${a.desc}</p></div>
      </a></li>`).join("");
  }

  const picks = articles
    .filter(a => Number.isInteger(a.editorPick))
    .sort((a,b) => a.editorPick - b.editorPick)
    .slice(0,3);

  const pickGrid = document.querySelector(".editor-picks-grid");
  if (pickGrid && picks.length) {
    pickGrid.innerHTML = picks.map(a => `
      <article class="editor-pick-card">
        <span class="tag ${a.category === "limited" ? "limited" : "news"}">${a.label}</span>
        <h3><a href="${a.path}">${a.title}</a></h3>
        <p>${a.desc}</p>
        <a class="editor-pick-link" href="${a.path}">この記事を読む →</a>
      </article>`).join("");
  }
})();
