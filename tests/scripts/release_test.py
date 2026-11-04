"""Release audit behavior; all leak candidates are synthetic."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('release', ROOT / 'scripts/verify_release.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class ReleaseTest(unittest.TestCase):
    def test_excludes_private_files_but_allows_public_metadata_and_examples(self):
        for path in ['book.pdf', 'config/private.json', '.rag/manifest.json', 'worker/.dev.vars', '.env.production',
                     'dump.txt', 'extracted/chapter.json', 'progress.sqlite3-wal', 'local.db', 'rag-private/a.json', '.aws/config']:
            with self.subTest(path=path): self.assertTrue(release.private_path(Path(path)))
        for path in ['.env.example', 'src/content/generated-inventory.json', 'scripts/rag/manifest.schema.json',
                     'worker/wrangler.jsonc', 'public/labs/linear-regression-pytorch.ipynb']:
            with self.subTest(path=path): self.assertFalse(release.private_path(Path(path)))

    def test_finds_secret_signatures_and_private_artifacts_without_printing_values(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'safe.js').write_text('const count = 32;')
            (root / 'bad.js').write_text('AIza' + 'X' * 35)
            (root / 'book.pdf').write_bytes(b'%PDF-synthetic')
            self.assertEqual(release.scan_files(root, [Path('safe.js'), Path('bad.js'), Path('book.pdf')]),
                             ['bad.js', 'book.pdf'])

    def test_rejects_wrong_pages_base_or_manifest_scope(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'index.html').write_text('<script type="module" src="/DeeplearningApp/assets/a.js"></script>')
            manifest = {'scope': '/DeeplearningApp/', 'start_url': '/DeeplearningApp/#/'}
            (root / 'manifest.webmanifest').write_text(json.dumps(manifest))
            release.verify_pages(root)
            for mutation in ('asset', 'scope', 'start'):
                with self.subTest(mutation=mutation):
                    (root / 'index.html').write_text('<script src="/assets/a.js"></script>' if mutation == 'asset' else '<script src="/DeeplearningApp/assets/a.js"></script>')
                    changed = dict(manifest)
                    if mutation == 'scope': changed['scope'] = '/'
                    if mutation == 'start': changed['start_url'] = '/#/'
                    (root / 'manifest.webmanifest').write_text(json.dumps(changed))
                    with self.assertRaises(ValueError): release.verify_pages(root)

    def test_accepts_optional_rag_and_rejects_partial_or_mismatched_configuration(self):
        release.verify_rag_vars({})
        good = {'GEMINI_FILE_SEARCH_STORE': 'fileSearchStores/synthetic',
                'RAG_SOURCE_HASH': release.SOURCE_HASH, 'RAG_CONTENT_VERSION': release.CONTENT_VERSION}
        release.verify_rag_vars(good)
        for name in good:
            partial = dict(good)
            del partial[name]
            with self.subTest(name=name), self.assertRaises(ValueError): release.verify_rag_vars(partial)
        for name in good:
            wrong = dict(good)
            wrong[name] = 'wrong'
            with self.subTest(name=name), self.assertRaises(ValueError): release.verify_rag_vars(wrong)
        with self.assertRaises(ValueError): release.verify_rag_vars({'VITE_GEMINI_API_KEY': 'synthetic'})


if __name__ == '__main__': unittest.main()
