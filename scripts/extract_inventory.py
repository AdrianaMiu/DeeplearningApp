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
NUMBERED_ITEM = re.compile(r"^\s*(\d+)\.\s+\S")

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


def longest_prefix(numbers: list[int]) -> int:
    values = set(numbers)
    count = 0
    while count + 1 in values:
        count += 1
    return count


def extract(pdf: Path) -> dict:
    digest = hashlib.sha256(pdf.read_bytes()).hexdigest()
    if digest != EXPECTED_HASH:
        raise SystemExit(f"Unexpected PDF hash: {digest}")
    result = subprocess.run(["pdftotext", "-f", "41", "-layout", str(pdf), "-"], check=True, capture_output=True)
    pages = result.stdout.decode("utf-8", errors="replace").split("\f")
    seen: set[str] = set()
    headings: list[dict] = []
    page_text_by_id: dict[str, str] = {}
    for offset, page in enumerate(pages):
        pdf_page = 41 + offset
        for line in page.splitlines():
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
            headings.append({"id": section_id, "title": title, "pdfPage": pdf_page})
            page_text_by_id[section_id] = page

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

    exercises = []
    exercise_order = 1
    for section in sections:
        if section["title"].lower() != "exercises":
            continue
        page = page_text_by_id.get(section["id"], "")
        marker = re.search(rf"^\s*{re.escape(section['id'])}\s+Exercises\s*$", page, re.MULTILINE)
        tail = page[marker.end():] if marker else page
        count = longest_prefix([int(match.group(1)) for match in map(NUMBERED_ITEM.match, tail.splitlines()) if match])
        for number in range(1, count + 1):
            exercise_id = f"{section['id']}.exercise.{number}"
            exercises.append({
                "id": exercise_id, "title": f"Exercise {number}", "order": exercise_order,
                "sectionId": section["id"], "sourceExerciseNumber": number,
                "contentStatus": "unconverted", "source": source_ref(section["id"], section["source"]["pdfPageStart"]),
            })
            exercise_order += 1

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
