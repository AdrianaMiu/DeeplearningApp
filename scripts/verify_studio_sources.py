#!/usr/bin/env python3
"""Validate the book and record inventory-derived locations for all studios.

Regeneration preserves explicitly supplied review records for unchanged references.
It never performs or invents a visual inspection. Only metadata is written.
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

SECTIONS = {
    'introduction-studio': ['1.1', '1.2'],
    'classification-studio': ['4.1', '4.2'],
    'mlp-studio': ['5.1', '5.6'],
    'builders-guide-studio': ['6.1', '6.2'],
    'cnn-studio': ['7.2', '7.3'],
    'modern-cnn-studio': ['8.1', '8.6'],
    'rnn-studio': ['9.4', '9.7'],
    'modern-rnn-studio': ['10.1', '10.2'],
    'attention-transformers-studio': ['11.3', '11.7'],
    'optimization-studio': ['12.3', '12.6'],
    'performance-studio': ['13.2', '13.5'],
    'computer-vision-studio': ['14.3', '14.4'],
    'nlp-pretraining-studio': ['15.1', '15.8'],
    'nlp-applications-studio': ['16.5', '16.6'],
    'reinforcement-learning-studio': ['17.1', '17.2'],
    'gaussian-processes-studio': ['18.2', '18.3'],
    'hyperparameter-optimization-studio': ['19.1', '19.4'],
    'gan-studio': ['20.1', '20.2'],
    'math-appendix-studio': [f'A.{n}' for n in range(1, 12)],
    'tools-appendix-studio': [f'B.{n}' for n in range(1, 9)],
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pdf', required=True, type=Path)
    parser.add_argument('--inventory', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--reviewed-manifest', required=True, type=Path,
                        help='Existing manually reviewed metadata; may equal --out')
    args = parser.parse_args()
    reviewed = json.loads(args.reviewed_manifest.read_text())
    inventory = json.loads(args.inventory.read_text())
    hasher = hashlib.sha256()
    with args.pdf.open('rb') as pdf:
        for chunk in iter(lambda: pdf.read(1024 * 1024), b''):
            hasher.update(chunk)
    digest = hasher.hexdigest()
    if digest != inventory['sourceHash']:
        raise ValueError('PDF hash does not match inventory')
    info = subprocess.run(['pdfinfo', str(args.pdf)], check=True, capture_output=True, text=True).stdout
    pages = int(next(line.split(':', 1)[1] for line in info.splitlines() if line.startswith('Pages:')))
    if pages != inventory['sourcePageCount']:
        raise ValueError('PDF page count does not match inventory')
    if reviewed.get('sourceHash') != digest or reviewed.get('sourcePageCount') != pages:
        raise ValueError('Reviewed manifest source identity does not match PDF')
    review_rows = reviewed.get('studios', [])
    reviews = {row['studioId']: row for row in review_rows}
    if len(reviews) != len(review_rows) or set(reviews) != set(SECTIONS):
        raise ValueError('Reviewed manifest must contain every studio exactly once')
    sections = {s['id']: s for s in inventory['sections']}
    records = []
    for studio, ids in SECTIONS.items():
        refs = []
        for section_id in ids:
            section = sections[section_id]
            source = section['source']
            page = source['pdfPageStart']
            if source['sourceHash'] != digest or not 1 <= page <= pages:
                raise ValueError(f'Invalid source location: {section_id}')
            # A selected reference is the start page only, avoiding unverified section ends.
            refs.append({'sectionId': section_id, 'printedStart': source['printedStart'],
                         'pdfPageStart': page, 'sourceHash': digest})
        review = reviews[studio]
        if review.get('references') != refs:
            raise ValueError(f'References changed; manual review required: {studio}')
        check = review.get('manualCheck', {})
        checked = next((ref for ref in refs if ref['sectionId'] == check.get('sectionId')), None)
        if (not check.get('method') or not check.get('printedPage') or checked is None
                or not isinstance(check.get('pdfPage'), int)
                or not checked['pdfPageStart'] <= check['pdfPage'] <= pages):
            raise ValueError(f'Invalid existing manual check: {studio}')
        # Preserve the full reviewed row, including dates/history; do not renew attestations.
        records.append(review)
    args.out.write_text(json.dumps({'sourceHash': digest, 'sourcePageCount': pages, 'studios': records}, indent=2) + '\n')


if __name__ == '__main__':
    main()
