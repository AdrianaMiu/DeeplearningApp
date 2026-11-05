# Source inventory audit

Source: the local 1,185-page *Dive into Deep Learning* PDF with SHA-256 `93316e525a034cfa935023c3c31196c86f5edfd0e056f50f09676f6364a0be56`. The PDF and extracted prose are excluded from Git.

## Current extracted result

The reproducible inventory currently contains 1,019 section/subsection records, including 148 `Exercises` headings, and **609 extracted individual exercise references**. All 609 remain `unconverted`; this audit corrects metadata and does not claim learning activities exist. The number is an extractor result with structural and representative manual checks, not a claim that every PDF item has been independently transcribed and counted by a second method.

Exercise references by root: Chapter 1: 4; 2: 45; 3: 41; 4: 30; 5: 42; 6: 18; 7: 35; 8: 44; 9: 33; 10: 28; 11: 30; 12: 53; 13: 29; 14: 41; 15: 25; 16: 18; 17: 9; 18: 18; 19: 7; 20: 3; Appendix A: 43; Appendix B: 13.

## Defect and delta

The previous extractor examined only the page containing each `Exercises` heading and accepted nested numbered lists as top-level exercises. It also missed an unnumbered bullet exercise and items whose QR footnote number shared the same extracted line.

The corrected scanner uses the next recognized source heading as the boundary, follows lists across pages, groups markers by prompt-column alignment, selects the list kind from the first marker, ignores indented nested numbering/bullets, supports the single top-level bullet case and preserves each item's actual one-based PDF page. It now also creates a reconciliation record for every recognized `Exercises` heading and aborts extraction when a heading selects zero items or when its selected numbered candidates contain a gap, duplicate, or ordering anomaly. Passing `--audit-output PATH` preserves all 148 per-heading records for inspection.

Compared with the old 471-reference inventory, 466 IDs remain, 143 valid references are added and five false nested references are removed: `17.1.5.exercise.3`, `19.1.4.exercise.4`, `19.1.4.exercise.5`, `19.3.5.exercise.3`, and `B.2.6.exercise.3`.

## Verification evidence

Synthetic tests cover multi-page continuation, nested numbering, a next-heading boundary, shifted odd/even-page indentation, transition to two-digit numbering, nested bullets, an unnumbered top-level exercise and QR-footnote line contamination. They also prove that a numbering gap and a zero-item heading fail loudly, and that successful extraction reconciles every heading rather than stopping after a partial list.

Rendered source pages were manually compared for early multi-page numbering (§2.3.13, PDF 93–94), middle-book nested lists (§17.1.5 and §19.1.4/§19.3.5), late appendix/cloud lists (§B.2.6 and §B.3.7), the unnumbered §20.1.6 exercise, and the same-page boundary after §A.8.9. These representative checks support the five removals as nested subitems and the sampled additions/boundaries as real. They do not constitute an independent page-by-page count of all 609 references; until that exists, the UI and release notes should say “609 extracted references,” not “609 independently verified exercises.”

The count is an exercise-reference inventory, not a license to publish prompt text and not evidence of conversion. Full completion still requires 609 original companion exercise activities plus the substantive section activities defined in the conversion plan.
