"""Pagination/failure tests use synthetic protocol responses, never real-card snapshots."""
import importlib.util
import io
import json
import unittest
from pathlib import Path
import sys
import tempfile
import urllib.error
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from unittest.mock import patch
spec = importlib.util.spec_from_file_location('fetch_draft_cards', Path(__file__).resolve().parents[1] / 'scripts/fetch_draft_cards.py')
fetcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fetcher)

class FetchTests(unittest.TestCase):
    def test_complete_pagination(self):
        pages = [io.BytesIO(json.dumps({'data': [{'name': 'fixture1'}], 'has_more': True, 'next_page': 'https://api.scryfall.com/cards/search?page=2'}).encode()), io.BytesIO(json.dumps({'data': [{'name': 'fixture2'}], 'has_more': False}).encode())]
        with patch.object(fetcher.urllib.request, 'urlopen', side_effect=pages), patch.object(fetcher.time, 'sleep'):
            result = fetcher.fetch_set('tmt')
        self.assertTrue(result['complete'])
        self.assertEqual(len(result['cards']), 2)
        self.assertEqual(result['set'], 'tmt')
        self.assertIn('api.scryfall.com', result['source'])

    def test_partial_failure_not_returned_as_complete(self):
        first = io.BytesIO(json.dumps({'data': [{'name': 'fixture'}], 'has_more': True, 'next_page': 'https://api.scryfall.com/cards/search?page=2'}).encode())
        with patch.object(fetcher.urllib.request, 'urlopen', side_effect=[first, urllib.error.HTTPError('https://api.scryfall.com',403,'blocked',{},None)]), patch.object(fetcher.time, 'sleep'):
            with self.assertRaises(urllib.error.HTTPError):
                fetcher.fetch_set('tmt')

    def test_invalid_pagination_rejected(self):
        first = io.BytesIO(json.dumps({'data': [], 'has_more': True}).encode())
        with patch.object(fetcher.urllib.request, 'urlopen', return_value=first):
            with self.assertRaises(ValueError):
                fetcher.fetch_set('tmt')

    def test_resume_retains_first_page(self):
        with tempfile.TemporaryDirectory() as directory:
            checkpoint = Path(directory) / 'partial.json'
            first = io.BytesIO(json.dumps({'data': [{'id':'a','name':'A'}], 'total_cards':2, 'has_more':True, 'next_page':'https://api.scryfall.com/cards/search?page=2'}).encode())
            blocked = urllib.error.HTTPError('https://api.scryfall.com',403,'blocked',{},None)
            with patch.object(fetcher.urllib.request,'urlopen',side_effect=[first,blocked]), patch.object(fetcher.time,'sleep'):
                with self.assertRaises(urllib.error.HTTPError):
                    fetcher.fetch_set('tmt', checkpoint)
            self.assertEqual(len(json.loads(checkpoint.read_text())['rows']),1)
            second = io.BytesIO(json.dumps({'data':[{'id':'b','name':'B'}],'has_more':False}).encode())
            with patch.object(fetcher.urllib.request,'urlopen',return_value=second) as request, patch.object(fetcher.time,'sleep'):
                result=fetcher.fetch_set('tmt',checkpoint)
            self.assertEqual(len(result['cards']),2)
            self.assertEqual(request.call_count,1)
            self.assertIn('page=2',request.call_args[0][0].full_url)

    def test_retry_429_and_no_retry_403(self):
        import draft_data_io as engine
        retry = urllib.error.HTTPError('https://api.scryfall.com',429,'rate limit',{'Retry-After':'1'},None)
        page = io.BytesIO(b'{"data": []}')
        with patch.object(fetcher.urllib.request,'urlopen',side_effect=[retry,page]) as request, patch.object(fetcher.time,'sleep'):
            engine.request_json('https://api.scryfall.com/cards/search')
            self.assertEqual(request.call_count,2)
        blocked=urllib.error.HTTPError('https://api.scryfall.com',403,'blocked',{},None)
        with patch.object(fetcher.urllib.request,'urlopen',side_effect=blocked) as request, patch.object(fetcher.time,'sleep'):
            with self.assertRaises(urllib.error.HTTPError):engine.request_json('https://api.scryfall.com/cards/search')
            self.assertEqual(request.call_count,1)

    def test_all_ratings_not_truncated(self):
        from fetch_draft_ratings import normalize
        rows=[{'name':'Card'+str(i),'ever_drawn_win_rate':.55,'ever_drawn_game_count':100,'avg_pick':3,'avg_seen':4} for i in range(120)]
        ranking,validation=normalize(rows+[rows[0],{'name':'Invalid','ever_drawn_win_rate':float('inf')}])
        self.assertEqual(len(ranking),121)
        self.assertEqual(validation['duplicates'],1)
        self.assertEqual(validation['invalidValues'],1)
        self.assertAlmostEqual(ranking[0]['wr'],55)
        self.assertEqual(ranking[0]['ata'],3)
        self.assertEqual(ranking[0]['alsa'],4)

if __name__ == '__main__':
    unittest.main()
