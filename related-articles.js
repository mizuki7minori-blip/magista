(() => {
  let articles = [
    {path:"article-metagame-2026-10-06.html",category:"tournament",label:"フォーマット別メタゲーム",title:"【10月6日】MTG最新メタゲーム｜Modernはイゼット果敢と緑単繁殖鱗に注目",desc:"横浜540名のModernデータから主要デッキと新カード動向を整理。",keywords:["モダン","modern","繁殖鱗","イゼット","果敢","コーリ鋼","戦闘魔道士","メタゲーム","横浜"]},
    {path:"article-fra-draft-data-2026-10-05.html",category:"limited",label:"リミテッド",title:"リアリティ・フラクチャー ドラフト最新データ",desc:"直近データからアーキタイプとピック傾向を確認。",keywords:["リアリティ","フラクチャー","ドラフト","リミテッド","アーキタイプ","ピック","17lands"]},
    {path:"article-weekly-news-2026-10-05.html",category:"news",label:"週間ニュース",title:"【10月5日】MTG週間ニュース｜リアリティ・フラクチャー発売、横浜Modern TOP8が確定",desc:"横浜Modern TOP8と新カードの実戦採用を整理。",keywords:["横浜","modern","モダン","リアリティ","フラクチャー","top8","新カード","大会"]},
    {path:"article-zeta-set-2026-10-02.html",category:"news",label:"NEWS",title:"Secret Lair × MSCHF「The Zeta Set」が12月9日に再販決定",desc:"24時間限定の受注販売と発送予定を日本語で整理。",keywords:["secret lair","mschf","zeta","再販","受注","限定","販売"]},
    {path:"article-weekend-2026-10-02.html",category:"tournament",label:"週末注目情報",title:"【10月2日】MTG週末注目情報｜新環境スタンダードに注目",desc:"週末に見るべき大会・デッキ・環境情報を整理。",keywords:["スタンダード","standard","大会","新環境","週末","デッキ","メタゲーム"]},
    {path:"article-fra-draft-2026-09-25.html",category:"limited",label:"リミテッド",title:"リアリティ・フラクチャーのドラフトで取るべきカードは？",desc:"初手候補とピックの考え方を日本語で確認。",keywords:["リアリティ","フラクチャー","ドラフト","リミテッド","初手","ピック","色"]},
    {path:"article-weekend-2026-09-25.html",category:"tournament",label:"週末注目情報",title:"【9月25日】週末注目情報｜スタンダード・モダン・パイオニア",desc:"直近大会から今週末の注目デッキを整理。",keywords:["スタンダード","モダン","パイオニア","大会","週末","デッキ","環境"]},
    {path:"article-meta-2026-09.html",category:"deck",label:"デッキ・環境",title:"現在のメタゲームと注目カード動向",desc:"競技シーンと注目カードの変化をまとめて確認。",keywords:["メタゲーム","注目カード","大会","環境","スタンダード","モダン","デッキ"]}
  ];

  const current = location.pathname.split("/").pop() || "index.html";
  const body = document.querySelector(".article-body");
  const articlePage = document.querySelector(".article-page");
  if (!body) return;

  async function boot(){
    try{
      const response=await fetch("article-index.json",{signal:AbortSignal.timeout(5000),cache:"force-cache"});
      if(response.ok){
        const data=await response.json();
        if(Array.isArray(data.items)&&data.items.length){
          articles=data.items.map(item=>({
            path:item.path,
            category:item.category||"news",
            label:item.label||"記事",
            title:item.title||item.path,
            desc:item.desc||item.lead||"",
            keywords:Array.isArray(item.keywords)?item.keywords:[]
          }));
        }
      }
    }catch{}
    const currentItem = articles.find(a => a.path === current);
    if (!currentItem) return;

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

  if (!document.querySelector(".article-inline-related")) {
    const sourceText=(articlePage?.textContent||'').toLowerCase().normalize('NFKC');
    const inlineCandidates=articles
      .filter(a=>a.path!==current)
      .map(a=>{
        let score=a.category===currentItem.category?8:0;
        for(const keyword of a.keywords||[]){
          const word=keyword.toLowerCase().normalize('NFKC');
          if(word&&sourceText.includes(word))score+=3;
        }
        score+=(a.keywords||[]).filter(k=>(currentItem.keywords||[]).includes(k)).length*4;
        return {...a,score};
      })
      .sort((a,b)=>b.score-a.score);
    const inlinePick=inlineCandidates[0];
    const bodyHeadings=[...body.querySelectorAll(":scope > h2")];
    const anchor=bodyHeadings[Math.max(1,Math.floor(bodyHeadings.length/2))];
    if(inlinePick&&anchor){
      const box=document.createElement("aside");
      box.className="article-inline-related";
      box.setAttribute("aria-label","関連して読む");
      box.innerHTML=`
        <span>RELATED</span>
        <div>
          <small>${inlinePick.label}</small>
          <strong>${inlinePick.title}</strong>
          <p>${inlinePick.desc}</p>
        </div>
        <a href="${inlinePick.path}" data-inline-related="${inlinePick.path}">この記事も読む →</a>`;
      anchor.before(box);
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
    const sourceText=(articlePage?.textContent||'').toLowerCase().normalize('NFKC');
    const contextualAction=()=>{
      if(currentItem.category==='limited')return ["limited-tracker.html","この環境でドラフトを試す","limited_tracker","ピックを記録しながら実戦感覚で確認"];
      if(/モダン|modern/.test(sourceText))return ["category.html?cat=modern","Modernの記事を続けて見る","modern_category","大会結果・メタゲーム・注目カードをまとめて確認"];
      if(/スタンダード|standard/.test(sourceText))return ["category.html?cat=standard","Standardの記事を続けて見る","standard_category","新環境・デッキ・注目カードをまとめて確認"];
      if(/パイオニア|pioneer/.test(sourceText))return ["category.html?cat=pioneer","Pioneerの記事を続けて見る","pioneer_category","大会結果と環境変化をまとめて確認"];
      if(/統率者|commander|edh/.test(sourceText))return ["commander-builder.html","このテーマで統率者を組む","commander_builder","目的と予算からデッキ構築へ進む"];
      if(currentItem.category==='deck')return ["commander-builder.html","デッキ構築へ進む","commander_builder","記事を読んだ流れで構築を試す"];
      return ["articles.html","関連する記事をもっと見る","articles","MAGSTAの最新記事・攻略を続けて確認"];
    };
    const primary=contextualAction();
    const links = (actionMap[currentItem.category] || actionMap.news).filter(([href])=>href!==primary[0]);
    const actions = document.createElement("aside");
    actions.className = "article-next-actions article-action-panel";
    actions.setAttribute("aria-label","次に見る");
    actions.innerHTML = `
      <span class="section-kicker">NEXT STEP</span>
      <strong>この記事の次に</strong>
      <a class="article-primary-action" href="${primary[0]}" data-next-action="${primary[2]}">
        <span>おすすめ</span>
        <b>${primary[1]}</b>
        <small>${primary[3]}</small>
      </a>
      <div class="article-secondary-actions">
        ${links.slice(0,3).map(([href,label,id])=>`<a href="${href}" data-next-action="${id}">${label}</a>`).join("")}
      </div>`;
    body.appendChild(actions);
  });
  }

  if (!document.querySelector(".article-trust-note")) {
    const trust = document.createElement("aside");
    trust.className = "article-trust-note";
    trust.setAttribute("aria-label","MAGSTAの記事方針");
    trust.innerHTML = `
      <span class="section-kicker">MAGSTA POLICY</span>
      <strong>この記事の情報について</strong>
      <p>公式情報・大会カバレージ・一次データを優先し、確認できた事実と編集部の分析を分けて掲載しています。誤りや更新が必要な情報は確認後に修正します。</p>
      <div><a href="strategy.html">編集・訂正方針を見る</a><a href="contact.html">訂正を知らせる</a></div>`;
    body.appendChild(trust);
  }

  if (!document.querySelector(".related-reading")) {
    const sourceText=(document.querySelector('.article-page')?.textContent||'').toLowerCase().normalize('NFKC');
    const scoreArticle=a=>{
      let score=a.category===currentItem.category?8:0;
      for(const keyword of a.keywords||[]){
        const word=keyword.toLowerCase().normalize('NFKC');
        if(word&&sourceText.includes(word))score+=3;
      }
      const currentWords=(currentItem.keywords||[]).map(x=>x.toLowerCase().normalize('NFKC'));
      const candidateWords=(a.keywords||[]).map(x=>x.toLowerCase().normalize('NFKC'));
      score+=candidateWords.filter(word=>currentWords.includes(word)).length*4;
      return score;
    };
    const picks = articles
      .filter(a => a.path !== current)
      .map(a=>({...a,relatedScore:scoreArticle(a)}))
      .sort((a,b)=>b.relatedScore-a.relatedScore||articles.findIndex(x=>x.path===a.path)-articles.findIndex(x=>x.path===b.path))
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
  }
  boot();
})();