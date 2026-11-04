"""Offline synthetic fixtures only; never upload or include book text."""
import contextlib
import copy
import io
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

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
        docs, _ = rag.extract_sections(['1.1 Alpha\nFixture material only.'], [section('1.1', 'Alpha')])
        doc = docs[0]
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

class ReviewRegressions(unittest.TestCase):
    setUp = Lifecycle.setUp
    def remote(self, doc=None, name='current', state='STATE_ACTIVE'):
        return {'name': f'fileSearchStores/example/documents/{name}', 'state': state,
                'customMetadata': rag.custom_metadata(doc or self.doc)}

    def run_cli(self, command, api, path):
        pdf = path.parent / 'fixture.pdf'
        pdf.write_bytes(b'synthetic source fixture')
        def source_tool(arguments, **kwargs):
            if arguments[0] == 'pdftotext': Path(arguments[-1]).write_text('fixture')
            return Mock(stdout='Pages: 1185\n')
        with patch.object(rag.hashlib, 'sha256', return_value=Mock(hexdigest=lambda: rag.SOURCE_HASH)), \
                patch.object(rag.subprocess, 'run', side_effect=source_tool), \
                patch.object(rag, 'extract_sections', return_value=(self.docs, [])), \
                patch.object(rag, 'coverage_records', return_value=[]), \
                patch.object(rag, 'GoogleApi', return_value=api), contextlib.redirect_stdout(io.StringIO()):
            rag.main([command, '--pdf', str(pdf), '--manifest', str(path)])

    def test_verify_rejects_stale_sibling_after_replacement_even_if_current_is_active(self):
        current = self.remote()
        for state in ['STATE_ACTIVE', 'STATE_PENDING', 'STATE_FAILED']:
            with self.subTest(state=state), tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / 'manifest.json'
                manifest = rag.make_manifest(self.docs)
                manifest['store'] = 'fileSearchStores/example'
                rag.save_manifest(path, manifest)
                stale = self.remote({**self.doc, 'contentHash': 'old-digest'}, 'stale', state)
                api = Mock()
                api.documents.return_value = [current, stale]
                api.request.side_effect = ValueError('cleanup failed')
                with self.assertRaisesRegex(ValueError, 'cleanup failed'), contextlib.redirect_stdout(io.StringIO()):
                    rag.synchronize(api, 'fileSearchStores/example', self.docs, manifest, path, path.parent)
                api.request.reset_mock()
                with self.assertRaisesRegex(ValueError, 'stale|duplicate'):
                    self.run_cli('verify', api, path)
                api.request.assert_not_called()
                api.documents.return_value = [current]
                self.run_cli('verify', api, path)

    def test_changed_extraction_cannot_overwrite_pending_or_uncertain_upload_journal(self):
        for journal in [
            {'status': 'uploading', 'operation': 'fileSearchStores/example/operations/old'},
            {'status': 'uploading'},
        ]:
            with self.subTest(journal=journal), tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / 'manifest.json'
                manifest = rag.make_manifest([{**self.doc, 'contentHash': 'old-digest'}])
                manifest['store'] = 'fileSearchStores/example'
                manifest['documents'][0].update(journal)
                rag.save_manifest(path, manifest)
                before = path.read_bytes()
                api = Mock()
                api.documents.return_value = []
                api.upload.side_effect = AssertionError('unresolved old upload must prevent a new upload')
                with self.assertRaisesRegex(ValueError, 'unresolved|pending'):
                    self.run_cli('create', api, path)
                api.upload.assert_not_called()
                self.assertEqual(path.read_bytes(), before)

    def test_document_matching_requires_all_expected_chapter_and_page_metadata(self):
        for key in ['chapterId', 'printedStart', 'printedEnd', 'pdfPageStart', 'pdfPageEnd']:
            for missing in [False, True]:
                with self.subTest(key=key, missing=missing):
                    remote = self.remote()
                    if missing:
                        remote['customMetadata'] = [item for item in remote['customMetadata'] if item['key'] != key]
                    else:
                        field = next(item for item in remote['customMetadata'] if item['key'] == key)
                        field['numericValue' if key.startswith('pdf') else 'stringValue'] = 9999 if key.startswith('pdf') else 'wrong'
                    self.assertIsNone(rag.match_document([remote], self.doc))

    def test_duplicate_metadata_keys_are_rejected_even_when_values_match(self):
        remote = self.remote()
        remote['customMetadata'].append(copy.deepcopy(remote['customMetadata'][0]))
        with self.assertRaisesRegex(ValueError, 'Duplicate.*metadata'):
            rag.match_document([remote], self.doc)

    def test_initial_and_partial_manifest_entries_conform_to_required_status_schema(self):
        schema = json.loads((Path(__file__).parents[2] / 'scripts/rag/manifest.schema.json').read_text())
        item_schema = schema['properties']['documents']['items']
        manifest = rag.make_manifest([self.doc, {**self.doc, 'sectionId': '1.2'}])
        self.assertEqual([entry.get('status') for entry in manifest['documents']], ['pending', 'pending'])
        manifest['documents'][0]['status'] = 'uploading'
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'manifest.json'
            rag.save_manifest(path, manifest)
            for entry in json.loads(path.read_text())['documents']:
                self.assertTrue(set(item_schema['required']).issubset(entry))
                self.assertIn(entry['status'], item_schema['properties']['status']['enum'])

if __name__ == '__main__': unittest.main()
