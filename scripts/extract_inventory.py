#!/usr/bin/env python3
"""Extract D2L heading and exercise metadata without publishing book prose."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

EXPECTED_HASH = "93316e525a034cfa935023c3c31196c86f5edfd0e056f50f09676f6364a0be56"
PAGE_OFFSET = 40
HEADING = re.compile(r"^\s*((?:\d{1,2}|[AB])(?:\.\d+){0,2})\s+([A-Z][^\n]{1,140}?)\s*$")
EXERCISE_MARKER = re.compile(r"^(?:\s*\d{3}\s{2,})?(\s*)((?:(\d+)\.|(•)))\s+(\S.*)$")

CHAPTER_TITLES = {
    1: "Introduction", 2: "Preliminaries", 3: "Linear Neural Networks for Regression",
    4: "Linear Neural Networks for Classification", 5: "Multilayer Perceptrons",
    6: "Builders’ Guide", 7: "Convolutional Neural Networks",
    8: "Modern Convolutional Neural Networks", 9: "Recurrent Neural Networks",
    10: "Modern Recurrent Neural Networks", 11: "Attention Mechanisms and Transformers",
    12: "Optimization Algorithms", 13: "Computational Performance", 14: "Computer Vision",
    15: "Natural Language Processing: Pretraining", 16: "Natural Language Processing: Applications",
    17: "Reinforcement Learning", 18: "Gaussian Processes", 19: "Hyperparameter Optimization",
    20: "Generative Adversarial Networks",
}


def source_ref(section_id: str, pdf_page: int) -> dict:
    printed = str(pdf_page - PAGE_OFFSET) if pdf_page > PAGE_OFFSET else "front matter"
    return {
        "sectionId": section_id,
        "printedStart": printed,
        "pdfPageStart": pdf_page,
        "sourceHash": EXPECTED_HASH,
        "companionCreated": False,
    }


def extract_exercises(pages: list[str], headings: list[dict], first_pdf_page: int = 41) -> list[dict]:
    """Extract top-level exercise metadata between each Exercises heading and the next heading."""
    ordered_headings = sorted(headings, key=lambda item: (item["pageIndex"], item["lineIndex"]))
    exercises: list[dict] = []
    exercise_order = 1
    for heading_index, heading in enumerate(ordered_headings):
        if heading["title"].strip().lower() != "exercises":
            continue
        boundary = ordered_headings[heading_index + 1] if heading_index + 1 < len(ordered_headings) else None
        candidates_by_page: list[list[tuple[int, int, int | None, bool]]] = []
        last_page = boundary["pageIndex"] if boundary else len(pages) - 1
        for page_index in range(heading["pageIndex"], last_page + 1):
            lines = pages[page_index].splitlines()
            start = heading["lineIndex"] + 1 if page_index == heading["pageIndex"] else 0
            stop = boundary["lineIndex"] if boundary and page_index == boundary["pageIndex"] else len(lines)
            page_candidates: list[tuple[int, int, int | None, bool]] = []
            for line_index in range(start, stop):
                match = EXERCISE_MARKER.match(lines[line_index])
                if not match:
                    continue
                prompt_column = match.start(5)
                number = int(match.group(3)) if match.group(3) else None
                rest = match.group(5).strip()
                if line_index <= 2 and number is not None and rest.isupper():
                    continue
                page_candidates.append((page_index, prompt_column, number, match.group(4) is not None))
            if page_candidates:
                candidates_by_page.append(page_candidates)

        candidates: list[tuple[int, int, int | None, bool]] = []
        first_candidate = next((page[0] for page in candidates_by_page if page), None)
        numbered_mode = first_candidate is not None and first_candidate[2] is not None
        for page_candidates in candidates_by_page:
            same_kind = [item for item in page_candidates if (item[2] is not None) == numbered_mode]
            if not same_kind:
                continue
            top_prompt_column = min(item[1] for item in same_kind)
            candidates.extend(item for item in same_kind if item[1] == top_prompt_column)

        numbered = [item for item in candidates if item[2] is not None]
        bullets = [item for item in candidates if item[3]]
        selected: list[tuple[int, int]] = []
        if numbered:
            expected = 1
            for page_index, _indent, number, _bullet in numbered:
                if number == expected:
                    selected.append((page_index, expected))
                    expected += 1
        elif bullets:
            selected = [(item[0], index) for index, item in enumerate(bullets, start=1)]

        for page_index, number in selected:
            section_id = heading["id"]
            exercises.append({
                "id": f"{section_id}.exercise.{number}", "title": f"Exercise {number}",
                "order": exercise_order, "sectionId": section_id, "sourceExerciseNumber": number,
                "contentStatus": "unconverted", "source": source_ref(section_id, first_pdf_page + page_index),
            })
            exercise_order += 1
    return exercises


def extract(pdf: Path) -> dict:
    digest = hashlib.sha256(pdf.read_bytes()).hexdigest()
    if digest != EXPECTED_HASH:
        raise SystemExit(f"Unexpected PDF hash: {digest}")
    result = subprocess.run(["pdftotext", "-f", "41", "-layout", str(pdf), "-"], check=True, capture_output=True)
    pages = result.stdout.decode("utf-8", errors="replace").split("\f")
    seen: set[str] = set()
    headings: list[dict] = []
    for offset, page in enumerate(pages):
        pdf_page = 41 + offset
        for line_index, line in enumerate(page.splitlines()):
            match = HEADING.match(line)
            if not match:
                continue
            section_id, title = match.groups()
            title = " ".join(title.split()).rstrip(". ")
            if section_id in seen or title.startswith(("To ", "If ", "We ")):
                continue
            root = section_id.split(".")[0]
            if root.isdigit() and not 1 <= int(root) <= 20:
                continue
            seen.add(section_id)
            headings.append({
                "id": section_id, "title": title, "pdfPage": pdf_page,
                "pageIndex": offset, "lineIndex": line_index,
            })

    chapters = []
    for number, title in CHAPTER_TITLES.items():
        heading = next((item for item in headings if item["id"] == str(number)), None)
        pdf_page = heading["pdfPage"] if heading else PAGE_OFFSET + 1
        chapters.append({
            "id": f"chapter-{number}", "title": title, "order": number,
            "kind": "chapter", "contentStatus": "unconverted",
            "source": source_ref(str(number), pdf_page),
        })
    chapters.extend([
        {"id": "appendix-a", "title": "Mathematics for Deep Learning", "order": 21,
         "kind": "appendix", "contentStatus": "unconverted", "source": source_ref("A", 966)},
        {"id": "appendix-b", "title": "Tools for Deep Learning", "order": 22,
         "kind": "appendix", "contentStatus": "unconverted", "source": source_ref("B", 1108)},
    ])

    sections = []
    for order, item in enumerate((entry for entry in headings if "." in entry["id"]), start=1):
        section_id = item["id"]
        root = section_id.split(".")[0]
        parent_parts = section_id.split(".")[:-1]
        parent_id = ".".join(parent_parts) if len(parent_parts) > 1 else (
            f"chapter-{root}" if root.isdigit() else f"appendix-{root.lower()}"
        )
        sections.append({
            "id": section_id, "title": item["title"], "order": order,
            "parentId": parent_id, "level": section_id.count("."),
            "contentStatus": "unconverted", "source": source_ref(section_id, item["pdfPage"]),
        })

    exercises = extract_exercises(pages, headings)

    orientation = [
        {"id": "orientation-installation", "title": "Installation", "order": 1, "kind": "orientation",
         "contentStatus": "unconverted", "source": {**source_ref("installation", 37), "printedStart": "xxxiv"}},
        {"id": "orientation-notation", "title": "Notation", "order": 2, "kind": "orientation",
         "contentStatus": "unconverted", "source": {**source_ref("notation", 40), "printedStart": "xxxvii"}},
    ]
    return {
        "contentVersion": "2026.11.1", "sourceTitle": "Dive into Deep Learning",
        "sourceAuthors": ["Aston Zhang", "Zachary C. Lipton", "Mu Li", "Alexander J. Smola"],
        "sourceHash": EXPECTED_HASH, "sourcePageCount": 1185,
        "chapters": chapters, "sections": sections, "exercises": exercises, "orientation": orientation,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    inventory = extract(args.pdf)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(inventory, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(inventory['sections'])} sections and {len(inventory['exercises'])} exercise references")


if __name__ == "__main__":
    main()
