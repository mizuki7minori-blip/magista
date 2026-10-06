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

## 5. 公開後に更新する場所
- `articles.html` に記事カードを追加
- `related-articles.js` の articles 配列に記事を追加
- 必要なら `affiliate-config.js` の articleProducts に追加
- トップ掲載対象なら `index.html` の注目記事も更新

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
