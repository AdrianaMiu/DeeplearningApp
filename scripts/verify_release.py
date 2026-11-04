#!/usr/bin/env python3
"""Offline publication audit. Failures print filenames only, never matching values."""
import argparse
import json
from pathlib import Path
import re
import subprocess

SOURCE_HASH = '93316e525a034cfa935023c3c31196c86f5edfd0e056f50f09676f6364a0be56'
CONTENT_VERSION = 'd2l-companion-2026.11-v1'
SECRET = re.compile(rb'AIza[0-9A-Za-z_-]{35}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')


def private_path(path):
    parts = {part.lower() for part in path.parts}
    name = path.name.lower()
    return bool(parts & {'config', '.rag', 'rag-private', '.aws', '.wrangler', 'extracted', 'extracted-text'}
                or name.endswith(('.pdf', '.txt', '.text', '.sqlite', '.sqlite3', '.db'))
                or '.sqlite' in name or name.startswith('.dev.vars')
                or (name == '.env' or name.startswith('.env.')) and name != '.env.example')


def scan_files(root, paths):
    return sorted(str(path) for path in paths if private_path(path)
                  or SECRET.search((root / path).read_bytes()))


def verify_pages(root):
    html = (root / 'index.html').read_text()
    assets = re.findall(r'(?:src|href)=[\"\']([^\"\']+)', html)
    if not any(asset.startswith('/DeeplearningApp/assets/') for asset in assets):
        raise ValueError('dist/index.html')
    if any(asset.startswith('/') and not asset.startswith('/DeeplearningApp/') for asset in assets):
        raise ValueError('dist/index.html')
    manifest = json.loads((root / 'manifest.webmanifest').read_text())
    if manifest.get('scope') != '/DeeplearningApp/' or manifest.get('start_url') != '/DeeplearningApp/#/':
        raise ValueError('dist/manifest.webmanifest')


def verify_rag_vars(variables):
    names = {'GEMINI_FILE_SEARCH_STORE', 'RAG_CONTENT_VERSION', 'RAG_SOURCE_HASH'}
    if any(name.startswith('VITE_') for name in variables):
        raise ValueError('worker/wrangler.jsonc')
    if not names.intersection(variables):
        return  # Companion tutoring is a supported deployment without retrieval.
    if (not names.issubset(variables)
            or not re.fullmatch(r'fileSearchStores/[A-Za-z0-9_-]+', variables['GEMINI_FILE_SEARCH_STORE'])
            or variables['RAG_CONTENT_VERSION'] != CONTENT_VERSION
            or variables['RAG_SOURCE_HASH'] != SOURCE_HASH):
        raise ValueError('worker/wrangler.jsonc')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dist', type=Path)
    parser.add_argument('--worker-out', type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    tracked = subprocess.run(['git', 'ls-files', '-z'], cwd=root, check=True, capture_output=True).stdout
    failures = scan_files(root, [Path(name.decode()) for name in tracked.split(b'\0') if name])
    # Wrangler configuration uses whole-line comments; retain URLs and all actual JSON values.
    config = '\n'.join(line for line in (root / 'worker/wrangler.jsonc').read_text().splitlines()
                       if not line.lstrip().startswith('//'))
    try:
        verify_rag_vars(json.loads(config).get('vars', {}))
    except (ValueError, TypeError):
        failures.append('worker/wrangler.jsonc')
    for artifact in (args.dist, args.worker_out):
        if artifact is None:
            continue
        paths = [path.relative_to(artifact) for path in artifact.rglob('*') if path.is_file()]
        if not paths:
            failures.append(str(artifact))
        failures.extend(str(artifact / path) for path in scan_files(artifact, paths))
    if args.dist:
        try:
            verify_pages(args.dist)
        except (ValueError, OSError) as error:
            failures.append(str(error) if isinstance(error, ValueError) else str(args.dist))
    if failures:
        print('\n'.join(sorted(set(failures))))
        raise SystemExit(1)
    print('Release audit passed (tracked files, selected artifacts, Pages base, optional Worker RAG configuration).')


if __name__ == '__main__':
    main()
