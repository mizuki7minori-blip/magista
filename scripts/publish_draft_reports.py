#!/usr/bin/env python3
"""Copy bounded generated reports only; failed runs never erase successful results."""
import argparse
import json
import shutil
from pathlib import Path

SETS = {'fra', 'hob', 'msh', 'sos', 'tmt'}


def publish(input_dir, repo_root):
    destination = Path(repo_root) / 'reports/draft-calibration'
    records = []
    for source in sorted(Path(input_dir).glob('draft-calibration-*')):
        run_file = source / 'run.json'
        if not run_file.exists():
            continue
        run = json.loads(run_file.read_text())
        for code, entry in run.get('sets', {}).items():
            if code not in SETS:
                raise ValueError('unsupported artifact set')
            measured = entry.get('status') == 'measured-card-pool'
            records.append({'set': code, 'status': entry.get('status'), 'tables': entry.get('drafts', 0), 'cpus': entry.get('cpus', 0), 'seed': run.get('seed')})
            if measured:
                target = destination / code
                target.mkdir(parents=True, exist_ok=True)
                for file in source.iterdir():
                    if file.name != 'run.json' and not (file.name.startswith(code.upper() + '-') and file.suffix in {'.json', '.csv'}):
                        continue
                    if not file.is_file() or file.stat().st_size > 2_000_000:
                        raise ValueError('unexpected or oversized report')
                    shutil.copyfile(file, target / file.name)
            else:
                target = destination / 'errors'
                target.mkdir(parents=True, exist_ok=True)
                (target / (code + '.json')).write_text(json.dumps(entry, ensure_ascii=False, indent=2) + '\n')
    if not records:
        raise ValueError('no generated reports found')
    destination.mkdir(parents=True, exist_ok=True)
    (destination / 'publication.json').write_text(json.dumps({'results': records}, indent=2) + '\n')
    return records


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--input-dir', required=True)
    p.add_argument('--repo-root', default='.')
    args = p.parse_args()
    print(json.dumps(publish(args.input_dir, args.repo_root)))
