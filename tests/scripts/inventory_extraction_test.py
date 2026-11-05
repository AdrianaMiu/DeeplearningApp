import importlib.util
import json
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[2] / "scripts" / "extract_inventory.py"
SPEC = importlib.util.spec_from_file_location("extract_inventory", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)

WORKTREE_ROOT = Path(__file__).parents[2]
PDF_CANDIDATES = [
    WORKTREE_ROOT / "2106.11342v5.pdf",
    Path(__file__).parents[4] / "2106.11342v5.pdf",
]
VERIFIED_PDF = next((path for path in PDF_CANDIDATES if path.exists()), None)


class ExerciseExtractionTests(unittest.TestCase):
    def test_reports_a_numbering_gap_instead_of_silently_truncating_the_list(self):
        pages = ["2.1.8 Exercises\n      1. First\n      3. Third\n"]
        headings = [{"id": "2.1.8", "title": "Exercises", "pageIndex": 0, "lineIndex": 0}]
        audit = []

        with self.assertRaisesRegex(ValueError, r"2\.1\.8.*missing.*2"):
            MODULE.extract_exercises(pages, headings, first_pdf_page=50, audit=audit)

        self.assertEqual(audit[0]["sectionId"], "2.1.8")
        self.assertEqual(audit[0]["candidateNumbers"], [1, 3])
        self.assertEqual(audit[0]["selectedNumbers"], [1])
        self.assertTrue(audit[0]["anomalies"])

    def test_reports_every_exercise_heading_including_zero_item_sections(self):
        pages = ["2.1.8 Exercises\nNo recognizable items\n2.2 Next\n"]
        headings = [
            {"id": "2.1.8", "title": "Exercises", "pageIndex": 0, "lineIndex": 0},
            {"id": "2.2", "title": "Next", "pageIndex": 0, "lineIndex": 2},
        ]
        audit = []

        with self.assertRaisesRegex(ValueError, r"2\.1\.8.*zero exercise items"):
            MODULE.extract_exercises(pages, headings, audit=audit)

        self.assertEqual(len(audit), 1)
        self.assertEqual(audit[0]["selectedNumbers"], [])

    def test_reconciles_each_heading_when_all_sequences_are_contiguous(self):
        pages = [
            "2.1.8 Exercises\n  1. First\n  2. Second\n2.2.5 Exercises\n  1. Only\n"
        ]
        headings = [
            {"id": "2.1.8", "title": "Exercises", "pageIndex": 0, "lineIndex": 0},
            {"id": "2.2.5", "title": "Exercises", "pageIndex": 0, "lineIndex": 3},
        ]
        audit = []

        exercises = MODULE.extract_exercises(pages, headings, audit=audit)

        self.assertEqual(len(exercises), 3)
        self.assertEqual([item["sectionId"] for item in audit], ["2.1.8", "2.2.5"])
        self.assertTrue(all(not item["anomalies"] for item in audit))

    def test_continues_numbered_exercises_across_pages_and_records_item_pages(self):
        pages = [
            "2.3.13 Exercises\n     1. First task\n        1. Nested choice\n        2. Nested choice\n",
            "Book running header\n             2. Second task\n             3. Third task\n2.4 Derivatives\n      1. Not an exercise\n",
        ]
        headings = [
            {"id": "2.3.13", "title": "Exercises", "pageIndex": 0, "lineIndex": 0},
            {"id": "2.4", "title": "Derivatives", "pageIndex": 1, "lineIndex": 4},
        ]

        exercises = MODULE.extract_exercises(pages, headings, first_pdf_page=93)

        self.assertEqual([item["sourceExerciseNumber"] for item in exercises], [1, 2, 3])
        self.assertEqual([item["source"]["pdfPageStart"] for item in exercises], [93, 94, 94])

    def test_stops_at_next_heading_and_ignores_later_numbered_output(self):
        pages = [
            "A.8.9 Exercises\n       1. First\n       2. Second\n       3. Third\nA.9 Naive Bayes\n       9. Model output\n"
        ]
        headings = [
            {"id": "A.8.9", "title": "Exercises", "pageIndex": 0, "lineIndex": 0},
            {"id": "A.9", "title": "Naive Bayes", "pageIndex": 0, "lineIndex": 4},
        ]

        exercises = MODULE.extract_exercises(pages, headings, first_pdf_page=1072)

        self.assertEqual([item["sourceExerciseNumber"] for item in exercises], [1, 2, 3])

    def test_counts_an_unnumbered_top_level_bullet_as_an_individual_exercise(self):
        pages = ["20.1.6 Exercises\n      • One exercise\n          • Supporting detail\n20.2 Next section\n"]
        headings = [
            {"id": "20.1.6", "title": "Exercises", "pageIndex": 0, "lineIndex": 0},
            {"id": "20.2", "title": "Next section", "pageIndex": 0, "lineIndex": 3},
        ]

        exercises = MODULE.extract_exercises(pages, headings, first_pdf_page=958)

        self.assertEqual(len(exercises), 1)
        self.assertEqual(exercises[0]["id"], "20.1.6.exercise.1")
        self.assertEqual(exercises[0]["source"]["pdfPageStart"], 958)

    def test_ignores_running_headers_and_nested_numbering_on_a_continuation_page(self):
        pages = [
            "3.1.6 Exercises\n     1. First task\n",
            "2. PRELIMINARIES\n        1. Nested\n        2. Nested\n     2. Second task\n",
        ]
        headings = [{"id": "3.1.6", "title": "Exercises", "pageIndex": 0, "lineIndex": 0}]

        exercises = MODULE.extract_exercises(pages, headings, first_pdf_page=132)

        self.assertEqual([item["sourceExerciseNumber"] for item in exercises], [1, 2])
        self.assertEqual(exercises[-1]["source"]["pdfPageStart"], 133)

    def test_recovers_an_exercise_marker_after_a_qr_footnote_number(self):
        pages = [
            "B.3.7 Exercises\n"
            "299    1. First cloud task\n"
            "       2. Second cloud task\n"
            "       3. Third cloud task\n"
        ]
        headings = [{"id": "B.3.7", "title": "Exercises", "pageIndex": 0, "lineIndex": 0}]

        exercises = MODULE.extract_exercises(pages, headings, first_pdf_page=1124)

        self.assertEqual([item["sourceExerciseNumber"] for item in exercises], [1, 2, 3])

    def test_aligns_top_level_items_by_prompt_column_when_numbers_reach_ten(self):
        lines = ["2.4.6 Exercises"]
        lines.extend(f"       {number}. Task" for number in range(1, 10))
        lines.append("      10. Task")
        pages = ["\n".join(lines)]
        headings = [{"id": "2.4.6", "title": "Exercises", "pageIndex": 0, "lineIndex": 0}]

        exercises = MODULE.extract_exercises(pages, headings, first_pdf_page=99)

        self.assertEqual([item["sourceExerciseNumber"] for item in exercises], list(range(1, 11)))

    def test_nested_bullets_do_not_hide_numbered_top_level_exercises(self):
        pages = [
            "A.1.11 Exercises\n"
            "      1. First task\n"
            "      2. Second task\n"
            "      3. Third task\n"
            "      4. Fourth task\n"
            "      • Nested supporting point\n"
        ]
        headings = [{"id": "A.1.11", "title": "Exercises", "pageIndex": 0, "lineIndex": 0}]

        exercises = MODULE.extract_exercises(pages, headings, first_pdf_page=983)

        self.assertEqual([item["sourceExerciseNumber"] for item in exercises], [1, 2, 3, 4])

    @unittest.skipUnless(VERIFIED_PDF, "verified source PDF is not available locally")
    def test_verified_pdf_reproduces_the_checked_in_inventory_and_all_heading_audits(self):
        audit = []

        inventory = MODULE.extract(VERIFIED_PDF, exercise_audit=audit)
        checked_in = json.loads((WORKTREE_ROOT / "src/content/generated-inventory.json").read_text())

        self.assertEqual(inventory, checked_in)
        self.assertEqual(len(audit), 148)
        self.assertEqual(sum(len(item["selectedNumbers"]) for item in audit), 609)
        self.assertTrue(all(not item["anomalies"] for item in audit))


if __name__ == "__main__":
    unittest.main()
