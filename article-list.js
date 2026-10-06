(() => {
  const buttons = [...document.querySelectorAll("[data-article-filter]")];
   const status = document.querySelector("[data-article-filter-status]");
  if (!buttons.length || !cards.length) return;

  const labels = {all:"すべて",news:"ニュース",tournament:"大会・環境",limited:"リミテッド",deck:"デッキ・メタ"};

  const apply = (filter) => {
    let visible = 0;
    const cards = [...document.querySelectorAll(".article-list .article-card[data-article-category]")];
    cards.forEach(card => {
      const show = filter === "all" || card.dataset.articleCategory === filter;
      card.hidden = !show;
      if (show) visible += 1;
    });
    buttons.forEach(btn => {
      const active = btn.dataset.articleFilter === filter;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    if (status) status.textContent = `${labels[filter] || "記事"}：${visible}件表示中`;
    const url = new URL(location.href);
    if (filter === "all") url.searchParams.delete("filter");
    else url.searchParams.set("filter", filter);
    history.replaceState(null, "", url);
  };

  buttons.forEach(btn => btn.addEventListener("click", () => apply(btn.dataset.articleFilter)));
  const initial = new URL(location.href).searchParams.get("filter");
  const initialFilter=labels[initial] ? initial : "all";
  apply(initialFilter);
  document.addEventListener("magsta:article-index-rendered",()=>apply(new URL(location.href).searchParams.get("filter")||initialFilter));
})();