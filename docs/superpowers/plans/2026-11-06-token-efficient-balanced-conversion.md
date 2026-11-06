# Token-efficient Balanced Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the companion at balanced depth with compact validated content batches and bounded tutor requests.

**Architecture:** Chapter-local static content modules use shared typed helpers and strict coverage validation; no prose is generated in the browser. A deterministic tutor context reducer enforces per-field and total character budgets before requests reach the Worker.

**Tech Stack:** React, strict TypeScript, Zod, Dexie, Vitest, Python inventory tooling, Vite/PWA, Cloudflare Worker.

**Spec:** `docs/superpowers/specs/2026-11-06-token-efficient-balanced-conversion-design.md`

## Global Constraints

- Do not publish the PDF, original exercise text, secrets, extracted prose or local databases.
- Do not mark a chapter complete while either coverage remainder is nonzero.
- Companion prose must be original, source-linked and distinct after normalization.
- Tutor reduction must not include notes or unrelated learner records.
- RAG remains disabled unless separately provisioned and approved.

## Review Focus

- Repeated boilerplate that technically passes length checks but provides no section-specific teaching value.
- Truncation that removes the learner's latest attempt or question.
- Chapter totals inflated by container, summary or exercise-heading records.
- Exercise evidence accidentally contributing to conceptual mastery.
- Build-size and offline-cache growth from large static content batches.

### Task 1: Compact content authoring and quality gates

**Files:**
- Create: `src/content/coverage/authoring.ts`
- Modify: `src/content/coverage/schema.ts`
- Modify: `src/content/coverage/registry.ts`
- Test: `tests/content/coverage-quality.test.ts`

**Interfaces:**
- Produces: compact section/exercise constructors and normalized duplicate detection used by all chapter batches.

- [ ] Write failing tests for unique normalized prose, minimum section-specific substance and valid batch source IDs.
- [ ] Run the targeted test and confirm the quality failures are detected.
- [ ] Implement shared typed constructors and registry quality issues without runtime content generation.
- [ ] Run targeted and full tests; commit.

### Task 2: Deterministic tutor context budget

**Files:**
- Create: `src/tutor/context-budget.ts`
- Modify: `src/tutor/TutorPanel.tsx`
- Modify: `worker/src/index.ts`
- Test: `tests/tutor/context-budget.test.ts`
- Test: `tests/worker/tutor.test.ts`

**Interfaces:**
- Produces: `compactTutorInput(...)` returning bounded attempt, question, conversation and estimated character count.

- [ ] Write failing tests preserving the latest question/attempt, summarizing older turns and enforcing field/total limits.
- [ ] Confirm failures before implementation.
- [ ] Implement client reduction and matching Worker hard limits/rejection.
- [ ] Run tutor/Worker and full suites; commit.

### Task 3: Finish Chapters 2–3 calibration batch

**Files:**
- Create/modify: `src/content/coverage/chapter-2-*.ts`, `src/content/coverage/chapter-3-*.ts`
- Modify: `src/content/coverage/index.ts`
- Test: `tests/content/chapter-2-coverage.test.ts`, `tests/content/chapter-3-coverage.test.ts`

**Interfaces:**
- Consumes: Task 1 authoring helpers and quality gates.
- Produces: zero remaining sections/exercises for Chapters 2 and 3.

- [ ] Write chapter completeness tests first and confirm they fail with exact remaining counts.
- [ ] Author original concise activities in coherent subchapter batches, reviewing source mappings and equations.
- [ ] Require zero unclassified sections, zero remaining exercises and no quality issues.
- [ ] Run tests/build and commit each complete chapter separately.

### Task 4: Convert Chapters 4–8

- [ ] Repeat the red/content/source-review/green cycle per chapter using Task 1 gates.
- [ ] Commit only complete chapters with exact zero-remainder assertions.

### Task 5: Convert Chapters 9–13

- [ ] Repeat the per-chapter acceptance cycle and commit reviewed chapters independently.

### Task 6: Convert Chapters 14–20

- [ ] Repeat the per-chapter acceptance cycle and commit reviewed chapters independently.

### Task 7: Convert appendices and orientation records

- [ ] Author A.1–A.11, B.1–B.8, installation and notation activities with the same quality gates.
- [ ] Verify appendix completeness and commit.

### Task 8: Whole-book acceptance and deployment

**Files:**
- Modify: release/audit documentation and tests as required.

- [ ] Assert every substantive record and all 609 extracted references have reviewed activities or valid non-substantive classifications.
- [ ] Run source/security, unit, Python, build, Playwright, accessibility, offline and transfer checks.
- [ ] Independently review the branch; fix Critical/Important findings with TDD.
- [ ] Merge and deploy only after explicit completion evidence, then close issue #7.

