#!/usr/bin/env python3
"""Validate the book and record inventory-derived locations for six studios."""
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
}
CHECKED = {'introduction-studio': '1.1', 'classification-studio': '4.1',
           'mlp-studio': '5.1', 'builders-guide-studio': '6.1',
           'cnn-studio': '7.2', 'modern-cnn-studio': '8.1'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pdf', required=True, type=Path)
    parser.add_argument('--inventory', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
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
        checked = next(ref for ref in refs if ref['sectionId'] == CHECKED[studio])
        records.append({'studioId': studio, 'references': refs,
                        'manualCheck': {'method': 'rendered-page heading', 'sectionId': checked['sectionId'],
                                        'printedPage': checked['printedStart'], 'pdfPage': checked['pdfPageStart']}})
    args.out.write_text(json.dumps({'sourceHash': digest, 'sourcePageCount': pages, 'studios': records}, indent=2) + '\n')


if __name__ == '__main__':
    main()
