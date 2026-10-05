(() => {
  const articles = Array.isArray(window.MAGSTA_ARTICLES) ? window.MAGSTA_ARTICLES : [];
  const list = document.querySelector(".article-list");
  if (!list || !articles.length) return;

  list.querySelectorAll(".article-card.featured").forEach(card => card.remove());

  const tagClass = {
    news: "news",
    tournament: "tournament",
    limited: "deck",
    deck: "news"
  };

  const fragment = document.createDocumentFragment();
  [...articles]
    .sort((a,b) => String(b.date).localeCompare(String(a.date)))
    .forEach(article => {
      const card = document.createElement("article");
      card.className = "article-card featured";
      card.dataset.articleCategory = article.category;
      card.innerHTML = `
        <div class="article-meta">
          <span class="tag ${tagClass[article.category] || "news"}">${article.label}</span>
          <span>公開 ${article.date.replaceAll("-", ".")}</span>
          <span>編集：犬居</span>
        </div>
        <h2>${article.title}</h2>
        <p>${article.desc}</p>
        <a class="read-more" href="${article.path}">記事を読む</a>`;
      fragment.appendChild(card);
    });

  list.prepend(fragment);
})();
