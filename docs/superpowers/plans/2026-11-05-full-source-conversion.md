# Full Source Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert every substantive source section and every verified individual exercise into an honest, navigable learning activity with independent progress evidence.

**Architecture:** Immutable source metadata stays separate from authored companion content and learner state. A validated registry maps section/exercise IDs to reviewed activities; Curriculum derives status from it, while IndexedDB stores exercise workflow independently of mastery. Content ships in reviewed chapter batches after correcting the source inventory.

**Tech Stack:** React, strict TypeScript, Zod, Dexie, Vitest, Playwright, Python and `pdftotext`.

**Spec:** `deep_learning_companion_app_context.md`, especially its full-coverage definition.

## Global Constraints

- Keep the hash-verified PDF, extracted prose, credentials and local databases untracked.
- A chapter overview does not convert detailed sections; a generic quiz does not convert an individual exercise.
- Never bulk relabel raw inventory. `reviewed` requires original authored content and source validation.
- Preserve learner data; keep exercise workflow separate from mastery; keep RAG deferred.

## Review Focus

- Multi-page exercise lists stop at the next heading while ignoring nested numbering and running headers.
- Old progress imports safely across the new exercise-state schema.
- Invalid or missing activities cannot appear reviewed or available.
- Curriculum, Progress and backups show the same validated counts/status.
- No source prose enters public content while each exercise remains individually usable.

### Task 1: Correct and attest the source inventory

**Files:** Modify `scripts/extract_inventory.py`, `src/content/generated-inventory.json`, `tests/content/inventory.test.ts`; create `tests/scripts/inventory_extraction_test.py`, `docs/source-inventory-audit.md`.

**Interfaces:** Produce `extract_exercises(pages, headings) -> list[dict]` with stable IDs and actual PDF start pages.

- [ ] Write and watch synthetic tests fail for continuation pages, nested numbering, heading boundaries, running headers and page attribution.
- [ ] Implement boundary-aware pure helpers, regenerate from the verified PDF, inspect representative early/middle/late/appendix pages, document deltas and run inventory/catalog/full unit tests.
- [ ] Commit only verified metadata; do not alter content availability.

### Task 2: Add validated detailed-coverage contracts

**Files:** Create `src/content/coverage/{types,schema,registry}.ts`, `tests/content/coverage-registry.test.ts`; modify `src/content/catalog.ts`.

- [ ] TDD source identity, ownership, classification, required authored fields and honest authored/remaining counts; commit.

### Task 3: Persist individual exercise workflow state

**Files:** Modify `src/domain/types.ts`, `src/data/{db,repository,transfer,schemas}.ts`; add persistence tests.

- [ ] TDD `not_started | attempted | completed | deferred | discussed`, Dexie migration, repository calls and compatible merge/replace export; commit.

### Task 4: Build section and exercise learning routes

**Files:** Create section/exercise routes and state controls; modify App, ChapterAtlas, Progress and styles; add UI tests.

- [ ] TDD validated routing, honest unavailable states, keyboard flow, status persistence and accurate counts; commit.

### Task 5: Author Chapters 1–3 completely

- [ ] Generate gap/completeness tests, classify non-substantive records, then author original section explanations, worked/independent tasks and individual exercise activities with hints and reviewed checks/rubrics.
- [ ] Review source mappings and commit each complete chapter independently.

### Task 6: Convert Chapters 4–8

- [ ] Repeat the per-chapter red/content/source-review/green cycle; commit only at zero remaining substantive sections/exercises.

### Task 7: Convert Chapters 9–13

- [ ] Repeat the per-chapter acceptance cycle and commit independently.

### Task 8: Convert Chapters 14–20

- [ ] Repeat the per-chapter acceptance cycle and commit independently.

### Task 9: Convert Appendices A/B and orientation

- [ ] Author and validate A.1–A.11, B.1–B.8, installation and notation, with conceptual alternatives for paid/cloud tooling; commit.

### Task 10: Whole-book acceptance and deployment

- [ ] Require explicit valid classification for every inventory record and reviewed activity for every substantive/exercise record.
- [ ] Run source/security, unit, Python, build, browser, accessibility, offline and transfer checks; independently review, integrate and deploy.
- [ ] Close issue #7 only with evidence that every completion criterion holds; leave real tutor verification in #4.

## Completion Criteria and Current Status

Every substantive section needs objectives, explanation, worked example and independent task. Every verified exercise needs its own original activity, progressive hints and reviewed check/rubric. At correction start, all 1,019 section records and 471 exercise references are unconverted; 471 is under audit because the old extractor scans only the heading page. The existing 12 lessons, 20 overview studios and 120 quizzes are an initial companion track, not complete conversion.
