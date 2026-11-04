"""Synthetic metadata only; no PDF content or real review records."""
import copy
import contextlib
import io
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('studio_sources', ROOT / 'scripts/verify_studio_sources.py')
studio_sources = importlib.util.module_from_spec(spec)
spec.loader.exec_module(studio_sources)


class StudioSourcesTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.pdf = self.root / 'fixture.pdf'
        self.pdf.write_bytes(b'synthetic identity fixture')
        digest = hashlib.sha256(self.pdf.read_bytes()).hexdigest()
        self.inventory = {'sourceHash': digest, 'sourcePageCount': 100, 'sections': []}
        self.reviews = {'sourceHash': digest, 'sourcePageCount': 100, 'studios': []}
        for studio, ids in studio_sources.SECTIONS.items():
            refs = []
            for section_id in ids:
                ref = {'sectionId': section_id, 'printedStart': '1', 'pdfPageStart': 2, 'sourceHash': digest}
                refs.append(ref)
                self.inventory['sections'].append({'id': section_id, 'source': {k: v for k, v in ref.items() if k != 'sectionId'}})
            self.reviews['studios'].append({'studioId': studio, 'references': refs, 'manualCheck': {
                'method': 'rendered-page heading', 'sectionId': ids[0], 'printedPage': '1', 'pdfPage': 2,
                'checkedOn': '2000-01-01', 'reviewerNote': 'Synthetic attestation retained verbatim'}})
        self.out = self.root / 'out.json'
        self.out.write_text('unchanged on failure')

    def run_script(self, include_reviews=True, same_path=False):
        inventory_path = self.root / 'inventory.json'
        review_path = self.root / 'reviews.json'
        inventory_path.write_text(json.dumps(self.inventory))
        review_path.write_text(json.dumps(self.reviews))
        output = review_path if same_path else self.out
        args = ['verify_studio_sources.py', '--pdf', str(self.pdf), '--inventory', str(inventory_path), '--out', str(output)]
        if include_reviews:
            args += ['--reviewed-manifest', str(review_path)]
        with patch.object(sys, 'argv', args), patch.object(studio_sources.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, 'Pages: 100\n')):
            studio_sources.main()
        return json.loads(output.read_text())

    def test_requires_explicit_reviewed_input_instead_of_inventing_checks(self):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            self.run_script(include_reviews=False)
        self.assertEqual(self.out.read_text(), 'unchanged on failure')

    def test_preserves_existing_manual_attestation_when_regenerating_in_place(self):
        self.assertEqual(self.run_script(same_path=True), self.reviews)

    def test_rejects_wrong_pdf_hash_and_page_count(self):
        for field, value, message in [('sourceHash', 'wrong', 'hash'), ('sourcePageCount', 99, 'page count')]:
            original = copy.deepcopy(self.inventory)
            self.inventory[field] = value
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, message):
                self.run_script()
            self.inventory = original
            self.assertEqual(self.out.read_text(), 'unchanged on failure')

    def test_rejects_missing_sections_and_invalid_reference_identity_or_pages(self):
        for mutation in ('missing', 'hash', 'zero', 'beyond'):
            original = copy.deepcopy(self.inventory)
            if mutation == 'missing':
                self.inventory['sections'].pop(0)
            else:
                source = self.inventory['sections'][0]['source']
                source['sourceHash' if mutation == 'hash' else 'pdfPageStart'] = {'hash': 'wrong', 'zero': 0, 'beyond': 101}[mutation]
            with self.subTest(mutation=mutation), self.assertRaises((ValueError, KeyError)):
                self.run_script()
            self.inventory = original
            self.assertEqual(self.out.read_text(), 'unchanged on failure')

    def test_rejects_stale_missing_duplicate_or_unattested_review_records(self):
        for mutation in ('hash', 'pages', 'missing', 'duplicate', 'reference', 'manual', 'manual-page', 'manual-section'):
            original = copy.deepcopy(self.reviews)
            if mutation == 'hash': self.reviews['sourceHash'] = 'wrong'
            elif mutation == 'pages': self.reviews['sourcePageCount'] = 99
            elif mutation == 'missing': self.reviews['studios'].pop()
            elif mutation == 'duplicate': self.reviews['studios'].append(copy.deepcopy(self.reviews['studios'][0]))
            elif mutation == 'reference': self.reviews['studios'][0]['references'][0]['pdfPageStart'] = 3
            elif mutation == 'manual': self.reviews['studios'][0].pop('manualCheck')
            elif mutation == 'manual-page': self.reviews['studios'][0]['manualCheck']['pdfPage'] = 101
            elif mutation == 'manual-section': self.reviews['studios'][0]['manualCheck']['sectionId'] = 'other'
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                self.run_script()
            self.reviews = original
            self.assertEqual(self.out.read_text(), 'unchanged on failure')


if __name__ == '__main__': unittest.main()
