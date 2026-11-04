"""Offline synthetic fixtures only; never upload or include book text."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('index_book', Path(__file__).parents[2] / 'scripts/rag/index_book.py')
rag = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(rag)

def section(id, title, page=41):
    return {'id': id, 'title': title, 'source': {'pdfPageStart': page, 'printedStart': str(page - 40)}}

class Ingestion(unittest.TestCase):
    def test_checks_hash_and_count_before_extraction(self):
        with self.assertRaisesRegex(ValueError, 'hash'):
            rag.validate_identity('bad', 1185)
        with self.assertRaisesRegex(ValueError, 'page count'):
            rag.validate_identity(rag.SOURCE_HASH, 1)

    def test_hierarchy_and_same_page_headings_exclude_exercises_and_summary(self):
        pages = ['1.1 Alpha\nParent introductory material.\n1.1.1 Beta\nChild detail only.\n1.1.2 Summary\nEXCLUDED summary.\n1.1.3 Exercises\nEXCLUDED exercise.\n1.2 Gamma\nFinal detail.']
        records = [section('1.1', 'Alpha'), section('1.1.1', 'Beta'), section('1.1.2', 'Summary'), section('1.1.3', 'Exercises'), section('1.2', 'Gamma')]
        docs, blocked = rag.extract_sections(pages, records, first_pdf_page=41)
        self.assertEqual(blocked, [])
        self.assertEqual([d['sectionId'] for d in docs], ['1.1', '1.1.1', '1.2'])
        self.assertNotIn('Child detail', docs[0]['text'])
        self.assertNotIn('EXCLUDED', ''.join(d['text'] for d in docs))
        self.assertEqual(docs[1]['pdfPageStart'], 41)
        self.assertEqual(docs[1]['printedStart'], '1')
        self.assertEqual(docs[1]['pdfPageEnd'], 41)

    def test_missing_duplicate_empty_and_wrong_page_fail_closed(self):
        for pages, records in [
            (['not a heading'], [section('1.1', 'Alpha')]),
            (['1.1 Alpha\nText.\n1.1 Alpha\nOther.'], [section('1.1', 'Alpha')]),
            (['1.1 Alpha\n1.2 Beta\nContent.'], [section('1.1', 'Alpha'), section('1.2', 'Beta')]),
            (['1.1 Alpha\nContent.'], [section('1.1', 'Alpha', 42)]),
        ]:
            docs, blocked = rag.extract_sections(pages, records, first_pdf_page=41)
            self.assertIn('1.1', [item['sectionId'] for item in blocked])
            self.assertNotIn('1.1', [item['sectionId'] for item in docs])

    def test_reviewed_empty_source_exclusions_require_exact_pinned_location(self):
        records = [section('13.2.2', 'Barriers and Blockers', 615), section('13.2.3', 'Improving Computation', 615), section('13.2.4', 'Summary', 615)]
        docs, blocked = rag.extract_sections(['13.2.2 Barriers and Blockers\n13.2.3 Improving Computation\n13.2.4 Summary\nExcluded.'], records, first_pdf_page=615)
        self.assertEqual(docs, [])
        self.assertEqual(blocked, [])
        self.assertEqual(set(rag.REVIEWED_EMPTY), {'13.2.2', '13.2.3'})
        docs, blocked = rag.extract_sections(['13.2.2 Barriers and Blockers\n13.2.3 Improving Computation\n13.2.4 Summary\nExcluded.'], records, first_pdf_page=616)
        self.assertEqual(len(blocked), 2)

    def test_deterministic_manifest_has_no_extracted_text(self):
        docs, _ = rag.extract_sections(['1.1 Alpha\nPRIVATE FIXTURE prose.'], [section('1.1', 'Alpha')], first_pdf_page=41)
        manifest = rag.make_manifest(docs)
        self.assertNotIn('PRIVATE FIXTURE', json.dumps(manifest))
        self.assertEqual(manifest, rag.make_manifest(docs))
        self.assertEqual(manifest['chunkingConfig']['whiteSpaceConfig'], {'maxTokensPerChunk': 400, 'maxOverlapTokens': 60})

    def test_deletion_requires_exact_resource_and_confirmation(self):
        for store, confirm in [('fileSearchStores/example', ''), ('fileSearchStores/example', 'example'), ('https://evil', 'https://evil')]:
            with self.assertRaises(ValueError): rag.confirm_delete(store, confirm)
        rag.confirm_delete('fileSearchStores/example', 'fileSearchStores/example')

    def test_resume_reconciles_without_duplicate_upload_and_rejects_foreign_metadata(self):
        doc = {'sectionId': '1.1', 'contentHash': 'abc', 'chapterId': 'chapter-1'}
        remote = {'name': 'fileSearchStores/example/documents/doc', 'state': 'STATE_ACTIVE', 'customMetadata': rag.custom_metadata({**doc, 'sourceHash': rag.SOURCE_HASH, 'contentVersion': rag.CONTENT_VERSION})}
        self.assertEqual(rag.match_document([remote], doc)['name'], remote['name'])
        remote['customMetadata'][0]['stringValue'] = 'foreign'
        self.assertIsNone(rag.match_document([remote], doc))

class Lifecycle(unittest.TestCase):
    def setUp(self):
        self.docs, _ = rag.extract_sections(['1.1 Alpha\nFixture material only.'], [section('1.1', 'Alpha')])
        self.doc = self.docs[0]

    def test_synchronize_resumes_active_doc_without_uploading_or_extracted_manifest_text(self):
        remote = {'name': 'fileSearchStores/example/documents/doc', 'state': 'STATE_ACTIVE', 'customMetadata': rag.custom_metadata(self.doc)}
        class Api:
            def documents(self, store): return [remote]
            def upload(self, *args): raise AssertionError('must not upload an existing document')
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            manifest = rag.make_manifest(self.docs)
            rag.synchronize(Api(), 'fileSearchStores/example', self.docs, manifest, path / 'manifest.json', path)
            self.assertEqual(manifest['documents'][0]['status'], 'active')
            self.assertNotIn('Fixture material', (path / 'manifest.json').read_text())

    def test_uncertain_upload_never_blindly_retries(self):
        class Api:
            def documents(self, store): return []
            def upload(self, *args): raise AssertionError('uncertain operations must not upload twice')
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            manifest = rag.make_manifest(self.docs)
            manifest['documents'][0]['status'] = 'uploading'
            with self.assertRaisesRegex(ValueError, 'Uncertain upload'):
                rag.synchronize(Api(), 'fileSearchStores/example', self.docs, manifest, path / 'manifest.json', path)

    def test_upload_journals_then_removes_only_stale_document_after_active_replacement(self):
        current = {'name': 'fileSearchStores/example/documents/new', 'state': 'STATE_ACTIVE', 'customMetadata': rag.custom_metadata(self.doc)}
        old = {'name': 'fileSearchStores/example/documents/old', 'state': 'STATE_ACTIVE', 'customMetadata': rag.custom_metadata({**self.doc, 'contentHash': 'outdated'})}
        actions = []
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            manifest_path = path / 'manifest.json'
            class Api:
                uploaded = False
                def documents(self, store): return [old, current] if self.uploaded else [old]
                def upload(self, store, doc, file):
                    self_manifest = json.loads(manifest_path.read_text())
                    if self_manifest['documents'][0]['status'] != 'uploading': raise AssertionError('journal missing')
                    self.uploaded = True
                    actions.append('upload')
                    return {'name': 'fileSearchStores/example/operations/op', 'done': True}
                def wait(self, operation): actions.append('wait')
                def request(self, method, target): actions.append((method, target))
            rag.synchronize(Api(), 'fileSearchStores/example', self.docs, rag.make_manifest(self.docs), manifest_path, path)
            self.assertEqual(actions, ['upload', 'wait', ('DELETE', 'fileSearchStores/example/documents/old?force=true')])

    def test_rejects_remote_names_outside_owned_store(self):
        remote = {'name': 'fileSearchStores/foreign/documents/doc', 'state': 'STATE_ACTIVE', 'customMetadata': rag.custom_metadata(self.doc)}
        class Api:
            def documents(self, store): return [remote]
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            with self.assertRaisesRegex(ValueError, 'store'):
                rag.synchronize(Api(), 'fileSearchStores/example', self.docs, rag.make_manifest(self.docs), path / 'manifest.json', path)

if __name__ == '__main__': unittest.main()
