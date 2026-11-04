#!/usr/bin/env python3
"""Validate the book and record inventory-derived locations for all studios.

Manual check constants record completed visual inspection, not an automated claim
that equations have been checked. Only metadata is written to the manifest.
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
CHECKED = {'introduction-studio': '1.1', 'classification-studio': '4.1',
           'mlp-studio': '5.1', 'builders-guide-studio': '6.1',
           'cnn-studio': '7.2', 'modern-cnn-studio': '8.1'}

# Visually checked against the pinned PDF on 2026-11-04. Page numbers here
# may be inside a section; reference locations above remain its start page.
ADDITIONAL_CHECKS = {
    'rnn-studio': ('9.4', 398, ['9.4.2']),
    'modern-rnn-studio': ('10.1', 422, ['10.1.3']),
    'attention-transformers-studio': ('11.3', 474, ['11.3.2', '11.3.3']),
    'optimization-studio': ('12.3', 540, ['12.3.4']),
    'performance-studio': ('13.2', 612, []),
    'computer-vision-studio': ('14.4', 675, ['14.4.2']),
    'nlp-pretraining-studio': ('15.1', 757, ['15.1.1']),
    'nlp-applications-studio': ('16.5', 833, ['16.5.1']),
    'reinforcement-learning-studio': ('17.2', 854, ['17.2.1', '17.2.3']),
    'gaussian-processes-studio': ('18.3', 886, ['18.3.1']),
    'hyperparameter-optimization-studio': ('19.1', 901, ['unnumbered objective']),
    'gan-studio': ('20.1', 953, ['20.1.1', '20.1.2']),
    'math-appendix-studio': ('A.2', 984, ['A.2']),
    'tools-appendix-studio': ('B.1', 1108, []),
}


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
        if studio in ADDITIONAL_CHECKS:
            section_id, checked_page, equations = ADDITIONAL_CHECKS[studio]
            checked = next(ref for ref in refs if ref['sectionId'] == section_id)
            if not checked['pdfPageStart'] <= checked_page <= pages:
                raise ValueError(f'Invalid manual check location: {studio}')
            manual_check = {
                'method': 'rendered-page heading and equation' if equations else 'rendered-page heading',
                'sectionId': section_id,
                'printedPage': str(int(checked['printedStart']) + checked_page - checked['pdfPageStart']),
                'pdfPage': checked_page,
                'equationIds': equations,
                'checkedOn': '2026-11-04',
            }
        else:
            checked = next(ref for ref in refs if ref['sectionId'] == CHECKED[studio])
            manual_check = {'method': 'rendered-page heading', 'sectionId': checked['sectionId'],
                            'printedPage': checked['printedStart'], 'pdfPage': checked['pdfPageStart']}
        records.append({'studioId': studio, 'references': refs,
                        'manualCheck': manual_check})
    args.out.write_text(json.dumps({'sourceHash': digest, 'sourcePageCount': pages, 'studios': records}, indent=2) + '\n')


if __name__ == '__main__':
    main()
