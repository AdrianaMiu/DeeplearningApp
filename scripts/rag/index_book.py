#!/usr/bin/env python3
"""Private, resumable section ingestion. No text or credentials in status output."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time
import unicodedata
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

SOURCE_HASH = '93316e525a034cfa935023c3c31196c86f5edfd0e056f50f09676f6364a0be56'
PAGE_COUNT = 1185
CONTENT_VERSION = 'd2l-companion-2026.11-v1'
ROOT = Path(__file__).resolve().parents[2]
API = 'https://generativelanguage.googleapis.com'
CHUNKING = {'whiteSpaceConfig': {'maxTokensPerChunk': 400, 'maxOverlapTokens': 60}}
HEADING = re.compile(r'^\s*((?:\d{1,2}|[AB])(?:\.\d+){1,3})\s+([A-Z][^\n]{1,180})\s*$')
_exclusions = json.loads(Path(__file__).with_name('reviewed-exclusions.json').read_text())
if _exclusions['sourceHash'] != SOURCE_HASH:
    raise ValueError('Reviewed exclusions do not match the pinned source')
REVIEWED_EMPTY = {item['sectionId']: item for item in _exclusions['sections']}
STORE = re.compile(r'^fileSearchStores/[a-z0-9-]+$')


def validate_identity(digest, page_count):
    if digest != SOURCE_HASH:
        raise ValueError('PDF hash does not match the pinned source')
    if page_count != PAGE_COUNT:
        raise ValueError('PDF page count does not match the pinned source')


def normalized(text):
    return ' '.join(unicodedata.normalize('NFKC', text).split()).rstrip('. ')


def extract_sections(pages, sections, first_pdf_page=41):
    """Direct section text ends at the next heading, including child/excluded headings.

    Parent introductions and child sections are separate documents. PDF page anchors
    validate matches but never stand in for character boundaries on a shared page.
    Unresolved headings are reported, never guessed or uploaded.
    """
    lines = []
    positions = []
    for index, page in enumerate(pages):
        for line in page.splitlines():
            lines.append(line)
            positions.append(first_pdf_page + index)
    headings = []
    for index, line in enumerate(lines):
        match = HEADING.match(line)
        if match:
            headings.append((index, match.group(1), normalized(match.group(2))))
    docs, blocked = [], []
    for record in sections:
        sid = record['id']
        title = normalized(record['title'])
        if title.casefold() in ('summary', 'exercises'):
            continue
        matches = [(i, sid, found_title) for i, found_id, found_title in headings
                   if found_id == sid and found_title == title]
        if len(matches) != 1:
            blocked.append({'sectionId': sid, 'reason': 'missing or ambiguous heading'})
            continue
        start = matches[0][0]
        if positions[start] != record['source']['pdfPageStart']:
            blocked.append({'sectionId': sid, 'reason': 'heading disagrees with inventory PDF page'})
            continue
        end = next((i for i, _, _ in headings if i > start), len(lines))
        body_lines = lines[start + 1:end]
        # Remove standalone page numbers, not mathematical lines or source code.
        body = '\n'.join(line for line in body_lines if not re.fullmatch(r'\s*\d+\s*', line)).strip()
        if not body or not re.search(r'[A-Za-z]{3}', body):
            reviewed = REVIEWED_EMPTY.get(sid)
            if reviewed and reviewed['pdfPageStart'] == positions[start] and reviewed['printedStart'] == record['source']['printedStart']:
                continue
            if any(child['id'].startswith(sid + '.') for child in sections):
                continue  # A container has metadata coverage but no duplicated child prose.
            blocked.append({'sectionId': sid, 'reason': 'empty direct section; needs boundary review'})
            continue
        last = end - 1
        while last > start and not lines[last].strip():
            last -= 1
        pdf_end = positions[last]
        root = sid.split('.')[0]
        docs.append({'sectionId': sid, 'chapterId': f'chapter-{root}' if root.isdigit() else f'appendix-{root.lower()}',
                     'sourceHash': SOURCE_HASH, 'contentVersion': CONTENT_VERSION,
                     'printedStart': record['source']['printedStart'],
                     'printedEnd': str(int(record['source']['printedStart']) + pdf_end - positions[start]),
                     'pdfPageStart': positions[start], 'pdfPageEnd': pdf_end,
                     'boundaryStatus': 'heading-aligned-unreviewed', 'text': body,
                     'contentHash': hashlib.sha256(body.encode()).hexdigest()})
    return docs, blocked


def coverage_records(sections, docs, blocked):
    indexed = {doc['sectionId'] for doc in docs}
    unresolved = {item['sectionId'] for item in blocked}
    coverage = []
    for section in sections:
        sid = section['id']
        item = {'sectionId': sid}
        if sid in indexed:
            item['disposition'] = 'document'
        elif sid in unresolved:
            item['disposition'] = 'blocked'
        elif normalized(section['title']).casefold() in ('summary', 'exercises'):
            item.update(disposition='excluded', reason='summary-or-exercises')
        elif sid in REVIEWED_EMPTY:
            item.update(disposition='excluded', **{k: v for k, v in REVIEWED_EMPTY[sid].items() if k != 'sectionId'})
        else:
            children = [child['id'] for child in sections if child['id'].startswith(sid + '.')]
            if not children:
                raise ValueError('Unaccounted section in extraction coverage')
            item.update(disposition='container', childSectionIds=children)
        coverage.append(item)
    return coverage


def make_manifest(docs):
    return {'schemaVersion': 1, 'sourceHash': SOURCE_HASH, 'sourcePageCount': PAGE_COUNT,
            'contentVersion': CONTENT_VERSION, 'chunkingConfig': CHUNKING, 'store': None,
            'documents': [{k: v for k, v in doc.items() if k != 'text'} for doc in docs]}


def confirm_delete(store, confirmation):
    if not STORE.fullmatch(store or '') or confirmation != store:
        raise ValueError('Deletion requires --store and --confirm with the exact fileSearchStores resource name')


def custom_metadata(doc):
    return [{'key': key, 'numericValue' if isinstance(value, int) else 'stringValue': value}
            for key, value in doc.items() if key in ('sourceHash', 'contentVersion', 'chapterId', 'sectionId',
                'printedStart', 'printedEnd', 'pdfPageStart', 'pdfPageEnd', 'contentHash')]


def metadata(document):
    return {item['key']: item.get('stringValue', item.get('numericValue')) for item in document.get('customMetadata', [])}


def match_document(remote, doc):
    matches = [item for item in remote if all(metadata(item).get(key) == value for key, value in {
        'sourceHash': SOURCE_HASH, 'contentVersion': CONTENT_VERSION, 'sectionId': doc['sectionId'],
        'contentHash': doc['contentHash']}.items())]
    if len(matches) > 1:
        raise ValueError('Duplicate remote section documents; inspect the private store before continuing')
    return matches[0] if matches else None


def save_manifest(path, manifest):
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(manifest, indent=2) + '\n')
    temporary.chmod(0o600)
    temporary.replace(path)


class GoogleApi:
    def __init__(self):
        self.key = os.environ.get('GEMINI_API_KEY')
        if not self.key:
            raise ValueError('Set GEMINI_API_KEY in the administrative shell; do not put it in browser configuration')

    def request(self, method, path, payload=None, headers=None, raw=None):
        url = path if path.startswith('https://') else API + '/v1beta/' + path
        parsed = urlparse(url)
        if parsed.scheme != 'https' or parsed.hostname != 'generativelanguage.googleapis.com':
            raise ValueError('Unexpected upload endpoint')
        data = raw if raw is not None else (json.dumps(payload).encode() if payload is not None else None)
        request = Request(url, data=data, method=method, headers={
            'x-goog-api-key': self.key, 'Content-Type': 'application/json', **(headers or {})})
        try:
            with urlopen(request, timeout=60) as response:
                content = response.read()
                return (json.loads(content) if content else {}), response.headers
        except HTTPError as error:
            # Do not log upstream bodies, request URLs, or key-bearing upload sessions.
            raise ValueError(f'Google request failed (HTTP {error.code}); resume after checking quota/access') from None
        except (URLError, TimeoutError, json.JSONDecodeError):
            raise ValueError('Google transport failed; remote outcome may be uncertain; resume using the manifest') from None

    def documents(self, store):
        documents, token = [], None
        while True:
            query = '?' + urlencode({'pageSize': 20, **({'pageToken': token} if token else {})})
            result, _ = self.request('GET', store + '/documents' + query)
            documents.extend(result.get('documents', []))
            token = result.get('nextPageToken')
            if not token:
                return documents

    def wait(self, operation):
        for _ in range(120):
            if operation.get('done'):
                if operation.get('error'):
                    raise ValueError('File indexing operation failed; inspect private store status')
                return
            name = operation.get('name', '')
            if not re.fullmatch(r'fileSearchStores/[a-z0-9-]+/(?:upload/)?operations/[A-Za-z0-9_-]+', name):
                raise ValueError('Invalid indexing operation name')
            time.sleep(2)
            operation, _ = self.request('GET', name)
        raise ValueError('Indexing still pending; resume with the same manifest')

    def upload(self, store, doc, path):
        data = path.read_bytes()
        _, headers = self.request('POST', API + '/upload/v1beta/' + store + ':uploadToFileSearchStore',
            {'displayName': f"d2l-{doc['sectionId']}-{doc['contentHash'][:16]}",
             'customMetadata': custom_metadata(doc), 'chunkingConfig': CHUNKING},
            {'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start',
             'X-Goog-Upload-Header-Content-Length': str(len(data)), 'X-Goog-Upload-Header-Content-Type': 'text/plain'})
        url = headers.get('x-goog-upload-url', '')
        if not url:
            raise ValueError('Upload session did not return an endpoint')
        result, _ = self.request('POST', url, raw=data, headers={
            'Content-Type': 'text/plain', 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize'})
        return result


def checked_documents(api, store):
    remote = api.documents(store)
    names = set()
    for item in remote:
        name = item.get('name', '')
        fields = metadata(item)
        if (not re.fullmatch(re.escape(store) + r'/documents/[A-Za-z0-9_-]+', name)
                or name in names or fields.get('sourceHash') != SOURCE_HASH
                or fields.get('contentVersion') != CONTENT_VERSION):
            raise ValueError('Remote store contains unexpected document names or source identity')
        names.add(name)
    return remote


def synchronize(api, store, docs, manifest, manifest_path, temp_dir):
    remote = checked_documents(api, store)
    entries = {entry['sectionId']: entry for entry in manifest['documents']}
    for doc in docs:
        entry = entries[doc['sectionId']]
        found = match_document(remote, doc)
        if not found:
            if entry.get('operation'):
                api.wait({'name': entry['operation']})
            elif entry.get('status') == 'uploading':
                raise ValueError(f"Uncertain upload outcome for section {doc['sectionId']}; inspect store before clearing journal status")
            else:
                entry['status'] = 'uploading'
                save_manifest(manifest_path, manifest)
                file = temp_dir / (doc['sectionId'] + '.txt')
                file.write_text(json.dumps(custom_metadata(doc)) + '\n\n' + doc['text'])
                file.chmod(0o600)
                operation = api.upload(store, doc, file)
                entry['operation'] = operation.get('name')
                save_manifest(manifest_path, manifest)
                api.wait(operation)
            remote = checked_documents(api, store)
            found = match_document(remote, doc)
        if not found or found.get('state') != 'STATE_ACTIVE':
            raise ValueError(f"Section {doc['sectionId']} is not active yet; resume later")
        entry.update(status='active', document=found['name'])
        entry.pop('operation', None)
        save_manifest(manifest_path, manifest)
        # Reindex removes only stale versions of this exact owned section after new data is active.
        for old in remote:
            fields = metadata(old)
            if old['name'] != found['name'] and all(fields.get(k) == v for k, v in {
                'sourceHash': SOURCE_HASH, 'contentVersion': CONTENT_VERSION, 'sectionId': doc['sectionId']}.items()):
                api.request('DELETE', old['name'] + '?force=true')
        print(json.dumps({'sectionId': doc['sectionId'], 'status': 'active'}))


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['create', 'verify', 'reindex-section', 'reindex-chapter', 'delete-store'])
    parser.add_argument('--pdf', type=Path, required=True)
    parser.add_argument('--manifest', type=Path, default=ROOT / '.rag/manifest.json')
    parser.add_argument('--store')
    parser.add_argument('--confirm')
    parser.add_argument('--section')
    parser.add_argument('--chapter')
    parser.add_argument('--dry-run', action='store_true', help='No network, credentials, or persistent output')
    args = parser.parse_args(argv)
    if args.command == 'delete-store':
        confirm_delete(args.store, args.confirm)
    inventory = json.loads((ROOT / 'src/content/generated-inventory.json').read_text())
    digest = hashlib.sha256(args.pdf.read_bytes()).hexdigest()
    if digest != SOURCE_HASH:
        validate_identity(digest, PAGE_COUNT)
    info = subprocess.run(['pdfinfo', str(args.pdf)], check=True, capture_output=True, text=True).stdout
    count = re.search(r'^Pages:\s+(\d+)', info, re.MULTILINE)
    validate_identity(digest, int(count.group(1)) if count else 0)
    if args.command == 'delete-store':
        if not args.dry_run:
            GoogleApi().request('DELETE', args.store + '?force=true')
        print(json.dumps({'store': args.store, 'status': 'would-delete' if args.dry_run else 'deleted'}))
        return
    with tempfile.TemporaryDirectory(prefix='d2l-rag-') as directory:
        temp_dir = Path(directory)
        extracted = temp_dir / 'source.txt'
        subprocess.run(['pdftotext', '-f', '41', '-layout', str(args.pdf), str(extracted)], check=True, capture_output=True)
        pages = extracted.read_text().split('\f')
        docs, blocked = extract_sections(pages, inventory['sections'])
        coverage = coverage_records(inventory['sections'], docs, blocked)
        selected_ids = {record['id'] for record in inventory['sections']}
        if args.command == 'reindex-section':
            if not args.section or args.section not in selected_ids:
                raise ValueError('--section must identify an inventory section')
            selected_ids = {args.section}
        if args.command == 'reindex-chapter':
            chapter = next((chapter for chapter in inventory['chapters'] if chapter['id'] == args.chapter), None)
            if not chapter:
                raise ValueError('--chapter must identify an inventory chapter or appendix')
            prefix = chapter['source']['sectionId'] + '.'
            selected_ids = {sid for sid in selected_ids if sid.startswith(prefix)}
        selected = [doc for doc in docs if doc['sectionId'] in selected_ids]
        unresolved = [item for item in blocked if item['sectionId'] in selected_ids]
        print(json.dumps({'status': 'dry-run' if args.dry_run else 'validated-local', 'sourceHash': digest,
            'pageCount': PAGE_COUNT, 'sections': len(selected), 'blocked': unresolved,
            'coverage': {kind: sum(item['disposition'] == kind for item in coverage if item['sectionId'] in selected_ids) for kind in ('document', 'container', 'excluded', 'blocked')},
            'boundaryStatus': 'heading-aligned-unreviewed', 'chunkingConfig': CHUNKING}))
        if args.dry_run:
            return
        if unresolved or not selected:
            raise ValueError('Indexing blocked: ambiguous/empty sections require source boundary review; use dry-run for section IDs')
        previous = json.loads(args.manifest.read_text()) if args.manifest.exists() else None
        if previous and (previous.get('sourceHash') != SOURCE_HASH or previous.get('contentVersion') != CONTENT_VERSION or previous.get('chunkingConfig') != CHUNKING):
            raise ValueError('Manifest identity or chunking mismatch; use a separate manifest/store')
        manifest = make_manifest(docs)
        manifest['coverage'] = coverage
        if previous:
            old_entries = {item['sectionId']: item for item in previous['documents']}
            for entry in manifest['documents']:
                old = old_entries.get(entry['sectionId'], {})
                if old.get('contentHash') == entry['contentHash']:
                    entry.update({key: old[key] for key in ('status', 'document', 'operation') if key in old})
            manifest['store'] = previous.get('store')
        store = args.store or manifest['store']
        if args.store and manifest['store'] and args.store != manifest['store']:
            raise ValueError('Store differs from resume manifest')
        if store and not STORE.fullmatch(store):
            raise ValueError('Invalid store resource name')
        api = GoogleApi()
        if args.command == 'verify':
            if not store:
                raise ValueError('Verification requires --store or a resume manifest')
            remote = checked_documents(api, store)
            if any(not (match := match_document(remote, doc)) or match.get('state') != 'STATE_ACTIVE' for doc in selected):
                raise ValueError('Remote store is missing active documents or matching source metadata')
            print(json.dumps({'store': store, 'status': 'verified', 'sections': len(selected)}))
            return
        if not store:
            if args.command != 'create':
                raise ValueError('Reindex requires an existing store/manifest')
            if previous and previous.get('storeCreationPending'):
                raise ValueError('Uncertain store creation; inspect stores and supply --store before resuming')
            manifest['storeCreationPending'] = True
            save_manifest(args.manifest, manifest)
            created, _ = api.request('POST', 'fileSearchStores', {'displayName': f'D2L {CONTENT_VERSION}'})
            store = created['name']
            if not STORE.fullmatch(store):
                raise ValueError('Unexpected store resource name')
        manifest['store'] = store
        manifest.pop('storeCreationPending', None)
        save_manifest(args.manifest, manifest)
        synchronize(api, store, selected, manifest, args.manifest, temp_dir)
        print(json.dumps({'store': store, 'status': 'complete', 'contentVersion': CONTENT_VERSION, 'sections': len(selected)}))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        # Generic OS/process errors may contain paths or extraction stderr; keep output safe.
        print(json.dumps({'status': 'error', 'message': str(error) if isinstance(error, ValueError) else 'Local source tool failed'}))
        raise SystemExit(1)
