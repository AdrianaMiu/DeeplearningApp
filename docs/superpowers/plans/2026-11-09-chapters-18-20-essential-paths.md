# Chapters 18–20 Essential Learning Paths Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two reviewed deep lessons to each of Chapters 18–20 so every chapter has a three-entry essential path, honest breadth/depth status, reviewed assessments, and grounded tutor contexts.

**Architecture:** Chapter-specific seed modules produce existing `DeepLesson` and `Question` records; the shared learning catalog remains the source of availability and progress identity. `ChapterLearningSummary` derives an essential-path status from validated core IDs, while detailed inventory coverage remains unchanged. Tutor allowlists mirror only the reviewed new entries and do not block the non-AI release.

**Tech Stack:** React, strict TypeScript, Zod, Vitest, Testing Library, Playwright, Vite/PWA, Cloudflare Worker.

**Spec:** `docs/superpowers/specs/2026-11-06-chapters-18-20-essential-paths-design.md`

## Global Constraints

- Each chapter has three total entries: the existing studio plus two new deep lessons.
- English is canonical; Romanian is optional tutor help and preserves English technical terms.
- Do not publish the PDF, copied exercise text, extracted book prose, secrets, or local data.
- Breadth lessons do not change detailed section/exercise conversion counts or statuses.
- Use `Essential path complete`; never claim that a chapter is fully converted.
- RAG remains disabled.
- Existing entry IDs and learner progress remain stable.
- Verified non-AI learning paths may deploy while Gemini latency remains unresolved.

## Review Focus

- Source references from a neighboring chapter or outside the cited section must invalidate the entry; pin in each chapter content test.
- Duplicate or generic prose across the six lessons must fail content quality checks; pin in the integrated content test.
- Missing one of the three core entries must change essential-path status from complete to planned; pin in the catalog test.
- Curriculum copy must not imply that indexed exercises are authored; pin in the component test.
- Tutor citations outside a lesson's allowlist must be rejected; pin in the Worker test.

---

### Task 1: Chapter 20 essential path

**Files:**
- Create: `src/content/essential-lessons/chapter-20.ts`
- Create: `src/content/essential-questions/chapter-20.ts`
- Modify: `src/content/lessons.ts`
- Modify: `src/content/questions.ts`
- Modify: `src/content/course-map.ts`
- Test: `tests/content/chapter-20-essential-path.test.ts`

**Interfaces:**
- Consumes: `DeepLesson`, `QuestionSeed`, `companionSource(...)`, `makeQuestion(...)`, and the existing `gan-studio`.
- Produces: `chapter20EssentialLessons: DeepLesson[]` with IDs `gan-training-step`, `dcgan-practice`; `chapter20EssentialQuestionSeeds: QuestionSeed[]` with IDs `q33`–`q38`.

- [ ] **Step 1: Write the failing Chapter 20 content test**

Assert exact lesson IDs and order, `chapterId === 'chapter-20'`, reviewed status, nonempty anatomy, source IDs restricted to `20.1*`/`20.2*`, three questions per new lesson, one application question per lesson, and unchanged inventory totals/statuses.

- [ ] **Step 2: Run the test and confirm the missing module failure**

Run: `npm test -- tests/content/chapter-20-essential-path.test.ts`

Expected: FAIL because the Chapter 20 essential modules and core IDs do not exist.

- [ ] **Step 3: Add the two Chapter 20 lessons**

Implement reviewed `DeepLesson` records covering a complete GAN training step and DCGAN architecture/diagnosis. Use original concise prose, source-linked views, prediction, worked example, independent task, misconceptions, and teach-back prompt.

- [ ] **Step 4: Add six Chapter 20 questions**

Create three checks per lesson: conceptual prediction, calculation/code trace, and application/diagnosis. Export seeds and compose them through `makeQuestion` in `questions.ts`.

- [ ] **Step 5: Register the lessons as Chapter 20 core entries**

Append `gan-training-step` and `dcgan-practice` after `gan-studio` in `chapterLearningMap`, and compose the new module in `lessons.ts` without changing existing IDs.

- [ ] **Step 6: Run targeted and catalog tests**

Run: `npm test -- tests/content/chapter-20-essential-path.test.ts tests/content/catalog.test.ts tests/content/studios-complete.test.ts`

Expected: PASS with 34 learning entries and all Chapter 20 core IDs valid.

- [ ] **Step 7: Commit Chapter 20**

```bash
git add src/content/essential-lessons/chapter-20.ts src/content/essential-questions/chapter-20.ts src/content/lessons.ts src/content/questions.ts src/content/course-map.ts tests/content/chapter-20-essential-path.test.ts tests/content/catalog.test.ts tests/content/studios-complete.test.ts
git commit -m "feat: add chapter 20 essential learning path"
```

### Task 2: Chapter 19 essential path

**Files:**
- Create: `src/content/essential-lessons/chapter-19.ts`
- Create: `src/content/essential-questions/chapter-19.ts`
- Modify: `src/content/lessons.ts`
- Modify: `src/content/questions.ts`
- Modify: `src/content/course-map.ts`
- Test: `tests/content/chapter-19-essential-path.test.ts`

**Interfaces:**
- Consumes: Task 1 composition pattern and the existing `hyperparameter-optimization-studio`.
- Produces: `chapter19EssentialLessons: DeepLesson[]` with IDs `hpo-experiment-design`, `asynchronous-multifidelity-hpo`; question seeds `q39`–`q44`.

- [ ] **Step 1: Write the failing Chapter 19 content test**

Assert exact IDs/order, reviewed anatomy, source IDs restricted to `19.*`, three questions per lesson, application coverage, unique prose, and unchanged detailed inventory status.

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- tests/content/chapter-19-essential-path.test.ts`

Expected: FAIL because the Chapter 19 modules and core IDs are absent.

- [ ] **Step 3: Implement two Chapter 19 lessons**

Cover trustworthy HPO experiments and asynchronous/multi-fidelity allocation, including validation isolation, seeds, searcher/scheduler separation, early-ranking uncertainty, and fair compute accounting.

- [ ] **Step 4: Add six Chapter 19 questions**

Add conceptual, numeric/code-trace, and transfer/diagnosis questions per lesson through `makeQuestion`.

- [ ] **Step 5: Register Chapter 19 core IDs and run targeted tests**

Run: `npm test -- tests/content/chapter-19-essential-path.test.ts tests/content/catalog.test.ts tests/content/studios-complete.test.ts`

Expected: PASS with 36 total entries and three valid Chapter 19 entries.

- [ ] **Step 6: Commit Chapter 19**

```bash
git add src/content/essential-lessons/chapter-19.ts src/content/essential-questions/chapter-19.ts src/content/lessons.ts src/content/questions.ts src/content/course-map.ts tests/content/chapter-19-essential-path.test.ts tests/content/catalog.test.ts tests/content/studios-complete.test.ts
git commit -m "feat: add chapter 19 essential learning path"
```

### Task 3: Chapter 18 essential path

**Files:**
- Create: `src/content/essential-lessons/chapter-18.ts`
- Create: `src/content/essential-questions/chapter-18.ts`
- Modify: `src/content/lessons.ts`
- Modify: `src/content/questions.ts`
- Modify: `src/content/course-map.ts`
- Test: `tests/content/chapter-18-essential-path.test.ts`

**Interfaces:**
- Consumes: Task 1 composition pattern and the existing `gaussian-processes-studio`.
- Produces: `chapter18EssentialLessons: DeepLesson[]` with IDs `gp-posterior-inference`, `gp-regression-practice`; question seeds `q45`–`q50`.

- [ ] **Step 1: Write the failing Chapter 18 content test**

Assert exact IDs/order, reviewed anatomy, source IDs restricted to `18.2*`/`18.3*`, three questions per lesson, application coverage, distinct prose, and unchanged inventory status.

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- tests/content/chapter-18-essential-path.test.ts`

Expected: FAIL because the Chapter 18 modules and core IDs are absent.

- [ ] **Step 3: Implement two Chapter 18 lessons**

Cover GP posterior conditioning and small GP regression practice, including covariance/noise, uncertainty distinctions, stable solves, marginal-likelihood intuition, and kernel-assumption diagnosis.

- [ ] **Step 4: Add six Chapter 18 questions**

Add conceptual, covariance calculation/code-trace, and application/diagnosis questions per lesson through `makeQuestion`.

- [ ] **Step 5: Register Chapter 18 core IDs and run targeted tests**

Run: `npm test -- tests/content/chapter-18-essential-path.test.ts tests/content/catalog.test.ts tests/content/studios-complete.test.ts`

Expected: PASS with 38 total entries and three valid Chapter 18 entries.

- [ ] **Step 6: Commit Chapter 18**

```bash
git add src/content/essential-lessons/chapter-18.ts src/content/essential-questions/chapter-18.ts src/content/lessons.ts src/content/questions.ts src/content/course-map.ts tests/content/chapter-18-essential-path.test.ts tests/content/catalog.test.ts tests/content/studios-complete.test.ts
git commit -m "feat: add chapter 18 essential learning path"
```

### Task 4: Essential-path curriculum status

**Files:**
- Modify: `src/content/catalog.ts`
- Modify: `src/components/ChapterAtlas.tsx`
- Modify: `src/domain/types.ts`
- Test: `tests/content/catalog.test.ts`
- Test: `tests/ui/curriculum-essential-path.test.tsx`

**Interfaces:**
- Consumes: validated `coreEntryIds` and `availableEntryIds` from Tasks 1–3.
- Produces: `ChapterLearningSummary.essentialPathStatus: 'planned' | 'complete'` and `essentialEntryCount: number`.

- [ ] **Step 1: Write failing catalog derivation tests**

Assert Chapters 18–20 return `{ essentialPathStatus: 'complete', essentialEntryCount: 3 }`; removing one core entry returns `planned`. Assert detailed authored section/exercise counts are unchanged.

- [ ] **Step 2: Write failing Curriculum component tests**

Assert the chapter card and details display `3 essential lessons available` and `Essential path complete`, while still displaying detailed authored totals and `Depth expansion planned` for unconverted records.

- [ ] **Step 3: Run and confirm failures**

Run: `npm test -- tests/content/catalog.test.ts tests/ui/curriculum-essential-path.test.tsx`

Expected: FAIL because summary fields and UI copy are absent.

- [ ] **Step 4: Implement summary derivation**

Extend the summary type and derive completeness only when every validated core ID is available and the chapter has at least three core entries. Unknown/partial chapters remain `planned`.

- [ ] **Step 5: Implement honest Curriculum labels**

Show essential-path availability independently from studios/deep lessons and detailed conversion. Do not replace the 609-reference inventory or authored counts.

- [ ] **Step 6: Run targeted UI/catalog tests and commit**

Run: `npm test -- tests/content/catalog.test.ts tests/ui/curriculum-essential-path.test.tsx tests/ui/source-activity.test.tsx`

Expected: PASS.

```bash
git add src/content/catalog.ts src/components/ChapterAtlas.tsx src/domain/types.ts tests/content/catalog.test.ts tests/ui/curriculum-essential-path.test.tsx
git commit -m "feat: distinguish essential paths from depth coverage"
```

### Task 5: Grounded tutor allowlists for six lessons

**Files:**
- Modify: `worker/src/context.ts`
- Test: `tests/worker/context.test.ts`
- Test: `tests/worker/tutor.test.ts`

**Interfaces:**
- Consumes: the six reviewed lesson IDs, concept IDs, summaries, and source references from Tasks 1–3.
- Produces: six `TutorContext` allowlist entries; no change to request format, deadlines, RAG, or quota behavior.

- [ ] **Step 1: Write failing context parity and citation tests**

Assert every new reviewed lesson has one matching context with identical concept IDs and allowed refs. Assert an out-of-allowlist citation returns `MALFORMED_TUTOR_RESPONSE`.

- [ ] **Step 2: Run and confirm missing-context failures**

Run: `npm test -- tests/worker/context.test.ts tests/worker/tutor.test.ts`

- [ ] **Step 3: Add concise Worker contexts**

Add six static summaries and exact source refs. Do not add arbitrary client context, book excerpts, RAG bindings, or latency changes.

- [ ] **Step 4: Run Worker tests and commit**

Run: `npm test -- tests/worker/context.test.ts tests/worker/tutor.test.ts`

Expected: PASS.

```bash
git add worker/src/context.ts tests/worker/context.test.ts tests/worker/tutor.test.ts
git commit -m "feat: ground tutor for chapters 18 to 20"
```

### Task 6: Integrated acceptance and publication readiness

**Files:**
- Modify: `tests/e2e/companion.spec.ts`
- Modify: `README.md`
- Modify: `docs/content-status.md` if present; otherwise create it.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verified six-lesson release with explicit essential/depth status; does not close full-book issue #7.

- [ ] **Step 1: Add a failing end-to-end breadth-path test**

Navigate Chapter 20 from Curriculum, assert three ordered entries, open both new lessons, complete one non-AI check, reload, and verify saved evidence. Assert the page still labels detailed records as depth expansion rather than fully converted.

- [ ] **Step 2: Run the focused Playwright test and confirm failure before final wiring**

Run: `npm run test:e2e -- --grep "Chapter 20 essential path"`

- [ ] **Step 3: Update release documentation**

Document Chapters 18–20 as essential-path complete, six new lessons, 18 new questions, unchanged detailed inventory coverage, and tutor latency as a nonblocking open issue.

- [ ] **Step 4: Run complete verification**

Run: `npm run typecheck`

Run: `npm test`

Run: `npm run build`

Run: `npm run test:e2e`

Run: `npm run audit:release`

Expected: all commands exit 0; production paths use `/DeeplearningApp/`; no secret, PDF, database, cache, `.env`, `.dev.vars`, or `config/` is tracked.

- [ ] **Step 5: Request independent review and fix Critical/Important findings with TDD**

Use `superpowers:requesting-code-review` over the complete branch range. Re-run the complete verification after fixes.

- [ ] **Step 6: Commit release evidence**

```bash
git add tests/e2e/companion.spec.ts README.md docs/content-status.md
git commit -m "docs: record chapters 18 to 20 essential release"
```

- [ ] **Step 7: Merge, push, and verify Pages only after explicit completion evidence**

Use `superpowers:verification-before-completion` and `superpowers:finishing-a-development-branch`. Confirm the deployed bytes contain the new asset hashes and the public Chapter 18–20 paths show three entries each.
