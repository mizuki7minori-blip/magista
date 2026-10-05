# MAGSTA 新記事の追加手順

1. `article-template.html` をコピーする。
2. ファイル名を `article-カテゴリ-YYYY-MM-DD.html` のように変更する。
3. `{{...}}` のプレースホルダーをすべて置換する。
4. 記事本文の `<h2>` と `<p>` を必要な数だけ追加する。
5. 出典URLと出典名を確認する。
6. mainへ反映する。

mainへ記事HTMLが追加・更新されると `.github/workflows/sync-articles.yml` が動き、
未登録の記事を `article-data.js` と `sitemap.xml` に追加します。

## カテゴリ指定

- ニュース: CATEGORY=`news`, TAG_CLASS=`news`
- 大会・環境: CATEGORY=`tournament`, TAG_CLASS=`tournament`
- リミテッド: CATEGORY=`limited`, TAG_CLASS=`limited`
- デッキ・メタ: CATEGORY=`deck`, TAG_CLASS=`deck`

## 注意

- `article-template.html` 自体は公開記事ではありません。
- 新しい公開記事は必ず `article-*.html` の名前にします。
- 自動同期後、トップの「今週の注目記事」「編集部おすすめ」に出したい記事だけ `article-data.js` に `trending` / `editorPick` を追加します。
- 日付・タイトル・description・canonicalは記事ごとに必ず変更します。
