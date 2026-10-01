// MAGSTA affiliate settings.
// A8 affiliate materials approved for MAGSTA. Refresh product links if inventory changes.
// Article-specific, category-specific and series-specific recommendations are controlled here.
const MAGSTA_AFFILIATE = {
  disclosure: '※このページにはアフィリエイト広告を含む場合があります。リンク経由で購入・申込みがあった場合、MAGSTAに報酬が入ることがあります。商品価格・在庫・送料はリンク先で確認してください。',
  products: [
    {
      key: 'toretoku-buyback',
      categories: ['general', 'market', 'deck', 'card'],
      title: 'MTGカードの宅配買取・トレトク',
      description: '手持ちのカードを売る際に。買取条件は公式ページで確認してください。',
      label: '買取サービスを見る',
      url: 'https://px.a8.net/svt/ejp?a8mat=4BADDD+AZXA2A+2QOI+1HUVDT',
      pixel: 'https://www10.a8.net/0.gif?a8mat=4BADDD+AZXA2A+2QOI+1HUVDT',
      affiliate: true
    },
    {
      key: 'ff-play-booster',
      categories: ['ff', 'booster', 'set'],
      title: 'FFプレイ・ブースター 日本語版',
      description: '楽天市場の商品ページへ。価格・在庫・送料はリンク先で確認してください。',
      label: '楽天で商品を見る',
      url: 'https://rpx.a8.net/svt/ejp?a8mat=4BADDD+A1ZKKY+2HOM+BW8O1&rakuten=y&a8ejpredirect=http%3A%2F%2Fhb.afl.rakuten.co.jp%2Fhgc%2F0ea62065.34400275.0ea62066.204f04c0%2Fa26082448618_4BADDD_A1ZKKY_2HOM_BW8O1%3Fpc%3Dhttps%253A%252F%252Fitem.rakuten.co.jp%252Fhidamaristore%252Fa52672417325%252F%26m%3Dhttps%253A%252F%252Fitem.rakuten.co.jp%252Fhidamaristore%252Fa52672417325%252F',
      pixel: 'https://www15.a8.net/0.gif?a8mat=4BADDD+A1ZKKY+2HOM+BW8O1',
      affiliate: true
    },
    {
      key: 'fra-rakuten-search',
      series: ['fra'],
      title: 'リアリティ・フラクチャー 関連商品',
      description: 'プレイ・ブースター、BOX、Bundleなどを楽天市場でまとめて探せます。',
      label: '楽天で関連商品を探す',
      url: 'https://search.rakuten.co.jp/search/mall/MTG+%E3%83%AA%E3%82%A2%E3%83%AA%E3%83%86%E3%82%A3%E3%83%95%E3%83%A9%E3%82%AF%E3%83%81%E3%83%A3%E3%83%BC/',
      affiliate: false
    },
    {
      key: 'hob-rakuten-search',
      series: ['hob'],
      title: 'The Hobbit 関連商品',
      description: 'ブースター、BOX、デッキ、サプライなどの関連商品を楽天市場で検索します。',
      label: '楽天で関連商品を探す',
      url: 'https://search.rakuten.co.jp/search/mall/MTG+The+Hobbit/',
      affiliate: false
    },
    {
      key: 'msh-rakuten-search',
      series: ['msh'],
      title: 'Marvel Super Heroes 関連商品',
      description: 'ブースター、BOX、デッキ、サプライなどの関連商品を楽天市場で検索します。',
      label: '楽天で関連商品を探す',
      url: 'https://search.rakuten.co.jp/search/mall/MTG+Marvel+Super+Heroes/',
      affiliate: false
    },
    {
      key: 'sos-rakuten-search',
      series: ['sos'],
      title: 'Secrets of Strixhaven 関連商品',
      description: 'ブースター、BOX、Bundle、サプライなどの関連商品を楽天市場で検索します。',
      label: '楽天で関連商品を探す',
      url: 'https://search.rakuten.co.jp/search/mall/MTG+Secrets+of+Strixhaven/',
      affiliate: false
    },
    {
      key: 'tmt-rakuten-search',
      series: ['tmt'],
      title: 'TMNT 関連商品',
      description: 'プレイ・ブースター、BOX、デッキ、サプライなどを楽天市場で探せます。',
      label: '楽天で関連商品を探す',
      url: 'https://search.rakuten.co.jp/search/mall/MTG+TMNT/',
      affiliate: false
    },
    {
      key: 'secret-lair-official',
      categories: ['general', 'card', 'set'],
      title: 'Secret Lair ドロップ',
      description: '限定アートやコラボ商品を探したい人向け。販売期間・地域・在庫は公式ページで確認してください。',
      label: 'Secret Lair公式を見る',
      url: 'https://secretlair.wizards.com/',
      affiliate: false,
      kind: 'secret-lair'
    }
  ],

  // Exact article override. The pathname is used as the key.
  articleProducts: {
    'article-weekend-2026-09-25.html': ['toretoku-buyback', 'secret-lair-official'],
    'article-meta-2026-09.html': ['toretoku-buyback', 'secret-lair-official'],
    'article.html': ['toretoku-buyback', 'secret-lair-official']
  },

  // Series-specific products take priority on pages such as limited.html.
  // Replace each Rakuten search URL with an approved A8/Rakuten deep link when available.
  seriesProducts: {
    fra: ['fra-rakuten-search', 'secret-lair-official'],
    hob: ['hob-rakuten-search', 'secret-lair-official'],
    msh: ['msh-rakuten-search', 'secret-lair-official'],
    sos: ['sos-rakuten-search', 'secret-lair-official'],
    tmt: ['tmt-rakuten-search', 'secret-lair-official']
  },

  // Used when an article has no exact override.
  categoryProducts: {
    ff: ['ff-play-booster', 'secret-lair-official', 'toretoku-buyback'],
    booster: ['ff-play-booster', 'secret-lair-official'],
    market: ['toretoku-buyback'],
    deck: ['toretoku-buyback', 'secret-lair-official'],
    card: ['secret-lair-official', 'toretoku-buyback'],
    general: ['secret-lair-official', 'toretoku-buyback']
  }
};
