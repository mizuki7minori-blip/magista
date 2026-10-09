# 価格観測の運用

ページ: `/market.html`。海外価格はScryfallの非Foil USD。日本の価格は海外円換算と分離する。

## 国内データ

`domestic-prices.json` の `cards` に Scryfall printing ID をキーとして次の構造で保存する。既存の統率者価格表示との互換性を保つため、既存の価格キーは削除しない。

```json
{
  "cards": {
    "<printing UUID>": {
      "sale": {
        "price": 1000,
        "currency": "JPY",
        "finish": "nonfoil",
        "date": "2026-10-09",
        "source": "販売店名",
        "source_url": "https://example.com/exact-printing"
      },
      "buy": {
        "price": 500,
        "currency": "JPY",
        "finish": "nonfoil",
        "date": "2026-10-09",
        "source": "買取店名",
        "source_url": "https://example.com/exact-printing"
      }
    }
  }
}
```

上記の金額とURLは形式説明用であり実価格ではない。印刷版、言語、状態、非Foil、販売／買取、在庫条件を揃え、同じ価格系列の出典と条件を継続する。日本語版と英語版は別のprinting IDとして扱う。海外と同一printing IDの国内価格が取れない場合は勝手に別の版に置き換えない。国内の日本語版を別バスケットとして追加する際は指数のバージョンを分ける。

当日取得した価格だけ記録。過去の値、ゼロ、NaN、出典なしは欠測として扱う。国内収集の自動接続は未実装。利用できるAPI／提供データと条件を確認してから追加する。

## 日次処理

GitHub Actions `Daily market price history` が変更時と毎日06:43 JSTに実行。初回のサンプル選定後は印刷版とグループ構成を固定。手動実行も可能。UTCとJSTの境界に注意する。失敗時は既存履歴を維持する。指数はバスケット全数が観測できた日にだけ計算し、各系列の最初の完全集計日を100とする。

## 検証

`python3 -m unittest discover -s tests -p 'test_market_history.py'`

過去履歴を捏造しない。初日には価格表と指数100、2日目以降に推移が現れる。サンプルはEDHREC順に偏りがありMTG全体の市場規模を示さない。
