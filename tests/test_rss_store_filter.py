"""Regression checks for shop-directory pages leaking into MAGSTA news."""
import unittest

from scripts.update_rss_cache import is_store_page


def article(title, source="source-official", link="https://news.google.com/rss/articles/test"):
    return {"title": title, "sourceClass": source, "link": link}


class StoreFilterTests(unittest.TestCase):
    def test_official_shop_name(self):
        self.assertTrue(is_store_page(article("駄菓子のたまや - mtg-jp.com")))

    def test_shop_landing(self):
        self.assertTrue(is_store_page(article(
            "【BIGWEB | MTG】日本最大級の激安カードゲーム通販専門店 - BIGWEB",
            "source-bigweb")))

    def test_direct_shop_url(self):
        self.assertTrue(is_store_page(article(
            "駄菓子のたまや", link="https://mtg-jp.com/events/shop/0007545/")))

    def test_shop_directory_url(self):
        self.assertTrue(is_store_page(article(
            "公認店舗", link="https://mtg-jp.com/shop/?pref=3")))

    def test_store_directory_title(self):
        self.assertTrue(is_store_page(article("公認店舗一覧 - mtg-jp.com")))

    def test_legitimate_news_is_not_removed(self):
        self.assertFalse(is_store_page(article(
            "2027年のブースター製品に関する更新 - マジック：ザ・ギャザリング")))
        self.assertFalse(is_store_page(article(
            "『リアリティ・フラクチャー』の伝説たち - mtg-jp.com")))
        self.assertFalse(is_store_page(article(
            "WPN店舗のイベントに参加するとMTGアリーナで報酬がもらえるように",
            "source-izzet")))
        self.assertFalse(is_store_page(article(
            "リアリティ・フラクチャーの今週の売れ筋カード",
            "source-hareruya-article")))


if __name__ == "__main__":
    unittest.main()
