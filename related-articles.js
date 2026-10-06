(() => {
  const articles = [
    {path:"article-metagame-2026-10-06.html",category:"tournament",label:"フォーマット別メタゲーム",title:"【10月6日】MTG最新メタゲーム｜Modernはイゼット果敢と緑単繁殖鱗に注目",desc:"横浜540名のModernデータから主要デッキと新カード動向を整理。"},
    {path:"article-fra-draft-data-2026-10-05.html",category:"limited",label:"リミテッド",title:"リアリティ・フラクチャー ドラフト最新データ",desc:"直近データからアーキタイプとピック傾向を確認。"},
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
    const actionMap = {
      limited: [
        ["limited.html","リミテッド環境を見る","limited_hub"],
        ["limited-tracker.html","ドラフトを記録する","limited_tracker"],
        ["article-fra-draft-data-2026-10-05.html","最新のドラフトデータを見る","limited_latest"]
      ],
      tournament: [
        ["category.html?cat=standard","スタンダードを見る","standard_category"],
        ["category.html?cat=modern","モダンを見る","modern_category"],
        ["articles.html","大会・環境記事をもっと見る","articles"]
      ],
      deck: [
        ["commander-builder.html","統率者デッキを組む","commander_builder"],
        ["commander.html","統率者攻略を見る","commander_hub"],
        ["articles.html","デッキ・環境記事をもっと見る","articles"]
      ],
      news: [
        ["/#news","最新記事を見る","home_news"],
        ["articles.html","記事一覧を見る","articles"],
        ["/#formats","フォーマットから探す","home_formats"]
      ]
    };
    const links = actionMap[currentItem.category] || actionMap.news;
    const actions = document.createElement("aside");
    actions.className = "article-next-actions";
    actions.setAttribute("aria-label","次に見る");
    actions.innerHTML = `
      <span class="section-kicker">NEXT</span>
      <strong>次に見るなら</strong>
      <div>
        ${links.map(([href,label,id])=>`<a href="${href}" data-next-action="${id}">${label}</a>`).join("")}
      </div>`;
    body.appendChild(actions);

    actions.addEventListener("click", event => {
      const link = event.target.closest("a[data-next-action]");
      if (!link || typeof window.gtag !== "function") return;
      window.gtag("event","article_next_click",{
        content_type:"article",
        content_id:current,
        destination:link.dataset.nextAction
      });
    });
  }

  if (!document.querySelector(".related-reading")) {
    const picks = articles
      .filter(a => a.path !== current)
      .sort((a,b) => {
        const categoryDiff = Number(b.category === currentItem.category) - Number(a.category === currentItem.category);
        if (categoryDiff) return categoryDiff;
        return articles.indexOf(a) - articles.indexOf(b);
      })
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