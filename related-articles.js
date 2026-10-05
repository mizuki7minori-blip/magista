(() => {
  const articles = Array.isArray(window.MAGSTA_ARTICLES) ? window.MAGSTA_ARTICLES : [];

  const current = location.pathname.split("/").pop() || "index.html";
  const currentItem = articles.find(a => a.path === current);
  const body = document.querySelector(".article-body");
  const articlePage = document.querySelector(".article-page");
  if (!body || !currentItem) return;

  const headings = [...body.querySelectorAll(":scope > h2")].filter(h => !h.closest(".related-reading"));
  if (headings.length >= 2 && !document.querySelector(".article-toc") && !document.querySelector(".draft-reading-nav")) {
    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `section-${index + 1}`;
    });

    const toc = document.createElement("nav");
    toc.className = "article-toc";
    toc.setAttribute("aria-labelledby","article-toc-title");
    toc.innerHTML = `
      <div class="article-toc-head">
        <span class="section-kicker">CONTENTS</span>
        <strong id="article-toc-title">この記事の内容</strong>
      </div>
      <ol>
        ${headings.map(h => `<li><a href="#${h.id}">${h.textContent.trim()}</a></li>`).join("")}
      </ol>`;
    body.insertBefore(toc, body.firstChild);
  }

  if (articlePage && !articlePage.querySelector(".article-reading-info")) {
    const textLength = body.textContent.replace(/\s/g,"").length;
    const minutes = Math.max(1, Math.ceil(textLength / 500));
    const meta = articlePage.querySelector(".article-meta");
    if (meta) {
      const info = document.createElement("span");
      info.className = "article-reading-info";
      info.textContent = `約${minutes}分で読めます`;
      meta.appendChild(info);
    }
  }

  if (articlePage) {
    articlePage.dataset.category = currentItem.category;

    const notice = [...body.querySelectorAll(".notice")].find(el => /MAGSTA編集部|編集部分析|編集部コメント/.test(el.textContent));
    if (notice && !notice.classList.contains("editor-comment")) {
      notice.classList.add("editor-comment");
      if (!notice.querySelector(".editor-comment-label")) {
        const label = document.createElement("span");
        label.className = "editor-comment-label";
        label.textContent = "MAGSTA編集部コメント";
        notice.prepend(label);
      }
    }

    if (!articlePage.querySelector(".article-share")) {
      const share = document.createElement("aside");
      share.className = "article-share";
      share.setAttribute("aria-label","この記事をシェア");
      const shareUrl = encodeURIComponent(location.href);
      const shareTitle = encodeURIComponent(document.title);
      share.innerHTML = `
        <span class="section-kicker">SHARE</span>
        <strong>この記事をシェア</strong>
        <div>
          <a href="https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}" target="_blank" rel="noopener noreferrer">Xで共有</a>
          <a href="https://social-plugins.line.me/lineit/share?url=${shareUrl}" target="_blank" rel="noopener noreferrer">LINEで共有</a>
          <button type="button" class="copy-link-button">リンクをコピー</button>
        </div>`;
      const lead = articlePage.querySelector(".article-lead");
      (lead || articlePage.querySelector("h1")).insertAdjacentElement("afterend", share);

      const copyButton = share.querySelector(".copy-link-button");
      copyButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(location.href);
          copyButton.textContent = "コピーしました";
          setTimeout(() => { copyButton.textContent = "リンクをコピー"; }, 1800);
        } catch {
          copyButton.textContent = "URLを選択してコピー";
        }
      });
    }
  }

  if (!document.querySelector(".article-next-actions")) {
    const actions = document.createElement("aside");
    actions.className = "article-next-actions";
    actions.setAttribute("aria-label","次に見る");
    actions.innerHTML = `
      <span class="section-kicker">NEXT</span>
      <strong>次に見るなら</strong>
      <div>
        <a href="articles.html">記事一覧を見る</a>
        <a href="index.html#news">最新記事へ</a>
        <a href="index.html#formats">フォーマットから探す</a>
      </div>`;
    body.appendChild(actions);
  }

  if (!document.querySelector(".related-reading")) {
    const picks = articles
      .filter(a => a.path !== current)
      .sort((a,b) => Number(b.category === currentItem.category) - Number(a.category === currentItem.category))
      .slice(0,3);

    if (picks.length) {
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
    }
  }
})();