// MAGSTA affiliate settings.
// A8 affiliate materials approved for MAGSTA. Refresh product links if inventory changes.
// Article-specific recommendations are controlled by articleProducts / categoryProducts.
// Add a product once to products, then reference its key from each article.
const MAGSTA_AFFILIATE = {
  disclosure: '※このページにはアフィリエイト広告を含む場合があります。リンク経由で購入・申込みがあった場合、MAGSTAに報酬が入ることがあります。',
  products: [
    {
      key: 'toretoku-buyback',
      categories: ['general', 'market', 'deck', 'card'],
      title: 'MTGカードの宅配買取・トレトク',
      description: '手持ちのカードを売る際に。買取条件は公式ページで確認してください。',
      label: '買取サービスを見る',
      url: 'https://px.a8.net/svt/ejp?a8mat=4BADDD+AZXA2A+2QOI+1HUVDT',
      pixel: 'https://www10.a8.net/0.gif?a8mat=4BADDD+AZXA2A+2QOI+1HUVDT'
    },
    {
      key: 'ff-play-booster',
      categories: ['ff', 'booster', 'set'],
      title: 'FFプレイ・ブースター 日本語版',
      description: '楽天市場の商品ページへ。価格・在庫・送料はリンク先で確認してください。',
      label: '楽天で商品を見る',
      url: 'https://rpx.a8.net/svt/ejp?a8mat=4BADDD+A1ZKKY+2HOM+BW8O1&rakuten=y&a8ejpredirect=http%3A%2F%2Fhb.afl.rakuten.co.jp%2Fhgc%2F0ea62065.34400275.0ea62066.204f04c0%2Fa26082448618_4BADDD_A1ZKKY_2HOM_BW8O1%3Fpc%3Dhttps%253A%252F%252Fitem.rakuten.co.jp%252Fhidamaristore%252Fa52672417325%252F%26m%3Dhttps%253A%252F%252Fitem.rakuten.co.jp%252Fhidamaristore%252Fa52672417325%252F',
      pixel: 'https://www15.a8.net/0.gif?a8mat=4BADDD+A1ZKKY+2HOM+BW8O1'
    }
  ],

  // Exact article override. The pathname is used as the key.
  // Future articles only need one line here to choose their products.
  articleProducts: {
    'article-weekend-2026-09-25.html': ['toretoku-buyback'],
    'article-meta-2026-09.html': ['toretoku-buyback'],
    'article.html': ['toretoku-buyback']
  },

  // Used when an article has no exact override.
  categoryProducts: {
    ff: ['ff-play-booster', 'toretoku-buyback'],
    booster: ['ff-play-booster'],
    market: ['toretoku-buyback'],
    deck: ['toretoku-buyback'],
    card: ['toretoku-buyback'],
    general: ['toretoku-buyback']
  }
};
