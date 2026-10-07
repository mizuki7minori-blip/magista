import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location('publisher',Path(__file__).resolve().parents[1]/'scripts/publish_draft_reports.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class PublicationTest(unittest.TestCase):
    def test_commit_and_failure_preserves_success(self):
        with tempfile.TemporaryDirectory() as root:
            root=Path(root); remote=root/'remote.git'; repo=root/'repo'; artifacts=root/'artifacts'; source=artifacts/'draft-calibration-tmt-12345'
            source.mkdir(parents=True)
            subprocess.run(['git','init','--bare',str(remote)],check=True,capture_output=True)
            subprocess.run(['git','clone',str(remote),str(repo)],check=True,capture_output=True)
            def git(*args):return subprocess.run(['git',*args],cwd=repo,check=True,capture_output=True,text=True).stdout.strip()
            git('config','user.name','Synthetic publication test');git('config','user.email','test@example.invalid')
            run={'seed':12345,'sets':{'tmt':{'status':'measured-card-pool','drafts':100,'cpus':800,'dataKind':'synthetic-test-only'}}}
            (source/'run.json').write_text(json.dumps(run));(source/'TMT-cards.csv').write_text('name,ata\nsynthetic,3\n')
            module.publish(artifacts,repo)
            git('add','reports/draft-calibration');git('commit','-m','Synthetic generated reports');git('push','origin','HEAD:calibration-results')
            git('fetch','origin','calibration-results');self.assertEqual(git('rev-parse','HEAD'),git('rev-parse','FETCH_HEAD'))
            run['sets']['tmt']={'status':'input-error','reason':'synthetic failure'};(source/'run.json').write_text(json.dumps(run));module.publish(artifacts,repo)
            self.assertIn('synthetic,3',(repo/'reports/draft-calibration/tmt/TMT-cards.csv').read_text())
            self.assertEqual(json.loads((repo/'reports/draft-calibration/errors/tmt.json').read_text())['reason'],'synthetic failure')

if __name__=='__main__':unittest.main()
