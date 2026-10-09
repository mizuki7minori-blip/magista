import importlib.util
import pathlib
import unittest
spec = importlib.util.spec_from_file_location('market', pathlib.Path(__file__).resolve().parents[1] / 'scripts/update_market_history.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class MarketTest(unittest.TestCase):
    def test_fixed_basket_and_missing_quote(self):
        basket = {'cards': [{'id': 'a', 'formats': ['modern'], 'set': 'x'}, {'id': 'b', 'formats': ['modern'], 'set': 'x'}]}
        history = [{'date': '2026-10-01', 'cards': [{'id': 'a', 'usd': 10}, {'id': 'b', 'usd': 100}]}, {'date': '2026-10-02', 'cards': [{'id': 'a', 'usd': 20}, {'id': 'b', 'usd': None}]}, {'date': '2026-10-03', 'cards': [{'id': 'a', 'usd': 20}, {'id': 'b', 'usd': 100}]}]
        self.assertEqual([p['index'] for p in m.index_series(basket, history, 'all', 'usd')], [100, None, 150])
        self.assertTrue(all(p['index'] is None for p in m.index_series(basket, history, 'all', 'jp_sale')))

    def test_domestic_requires_dated_printing_quote(self):
        quote = {'price': 1000, 'currency': 'JPY', 'finish': 'nonfoil', 'date': '2026-10-09', 'source': '店', 'source_url': 'https://example.com/item'}
        data = {'cards': {'a': {'sale': quote}}}
        self.assertEqual(m.domestic_quote(data, {'id': 'a'}, '2026-10-09', 'sale')['value'], 1000)
        self.assertIsNone(m.domestic_quote(data, {'id': 'a'}, '2026-10-10', 'sale'))
        self.assertIsNone(m.domestic_quote(data, {'id': 'b'}, '2026-10-09', 'sale'))

    def test_fx_separate_from_domestic(self):
        self.assertEqual(m.value({'usd': 10}, 'usd_jpy', {'fx': {'usd_jpy': 140}}), 1400)
        self.assertIsNone(m.value({'usd': 10}, 'jp_sale', {'fx': {'usd_jpy': 140}}))
        self.assertIsNone(m.number('NaN'))

if __name__ == '__main__':
    unittest.main()
