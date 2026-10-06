# MAGSTA 記事作成チェックリスト

## 1. 新規記事を作る
- `article-template.html` を複製
- ファイル名を `article-テーマ-YYYY-MM-DD.html` に変更
- `{{...}}` のプレースホルダーをすべて置換
- カード名は `《日本語カード名》` で記載

## 2. 必須項目
- TITLE
- DESCRIPTION
- FILENAME
- PUBLISHED_ISO / MODIFIED_ISO
- CATEGORY_LABEL / CATEGORY_CLASS
- DATE / DATE_DISPLAY
- LEAD
- 本文
- 出典
- 編集部分析
- 結論

## 3. カテゴリの目安
- news: ニュース
- tournament: 大会・メタゲーム
- limited: リミテッド
- deck: デッキ・環境

## 4. 公開前確認
- 公式・一次情報を最低1件確認
- 事実と編集部分析を分ける
- 日付・大会名・カード名を再確認
- 外部リンクが開くか確認
- `《カード名》` がカードプレビュー対象になるか確認
- スマホ幅で横スクロールが出ていないか確認

## 5. 公開後の自動反映
`article-*.html` を main ブランチへ追加・更新すると、GitHub Actions が `article-index.json` を自動再生成します。

この台帳を使って、以下が自動反映されます。
- `articles.html` の編集記事一覧
- トップページの最新記事
- トップページの最新記事カード
- 記事途中・記事末の関連記事候補

必要に応じて手動で更新するのは、記事固有の商品を出したい場合の `affiliate-config.js` だけです。

## 6. 自動で付く機能
テンプレートから作れば、以下は共通スクリプトで自動対応します。
- 目次
- 読了時間
- シェア
- カードプレビュー
- 記事途中の関連リンク
- 記事末の次アクション
- 信頼性・訂正方針表示
- 関連記事
- 広告・アフィリエイト


## 7. Search Console確認項目
Search Consoleを接続したら、毎週以下を確認します。
- 検索クエリ別の表示回数
- CTRが低い記事
- 平均掲載順位が8〜20位の記事
- クリックが増えている記事
- インデックス未登録URL

### 改善の優先順位
1. 表示回数が多くCTRが低い → タイトル・description改善
2. 8〜20位の記事 → 本文追記・内部リンク追加
3. インデックス未登録 → sitemap・canonical・robots確認
4. 検索流入が伸びた記事 → 関連記事・続編を作成

新規 `article-*.html` の追加・更新時は、`article-index.json` と `sitemap.xml` がGitHub Actionsで自動再生成されます。
