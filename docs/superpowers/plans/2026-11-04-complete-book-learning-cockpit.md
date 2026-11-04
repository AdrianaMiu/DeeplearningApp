# Complete Book Learning Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing companion into a clear, interactive learning path through all 20 chapters and both appendices, with 120 reviewed assessment items and an optional Gemini File Search RAG grounded in the local book.

**Architecture:** Preserve the existing Vite/React/Dexie application and add a typed learning-entry catalog: current deep lessons plus 20 chapter studios grouped into six milestones. Declarative interaction specifications feed a small renderer set, while typed grading supports chapter checks. The Cloudflare Worker keeps the browser API stable and adds a server-only Gemini File Search adapter whose metadata filters and citations are derived from reviewed allowlists.

**Tech Stack:** React, strict TypeScript, React Router hash routes, Vitest/Testing Library, Playwright/axe, Dexie, Zod, Vite PWA, Cloudflare Workers, Gemini 3.8/3.6 Flash, Gemini File Search, Python/pdftotext ingestion tooling.

**Spec:** `docs/superpowers/specs/2026-11-04-complete-book-learning-cockpit-design.md`

**Scope decomposition:** Content, UI, and RAG are kept in one ordered plan because they share the `LearningEntry`, source-reference, and tutor-context contracts. Tasks 1–7 produce those contracts and content; Tasks 8–10 consume them in the interface; Task 11 consumes the same allowlists in the Worker. Each task still ends in an independently reviewable commit.

## Global Constraints

- Keep `2106.11342v5.pdf`, extracted source text, API keys, local databases, `.env*`, `.dev.vars*`, store dumps, and `config/` out of Git history and deployment artifacts.
- Source identity must remain SHA-256 `93316e525a034cfa935023c3c31196c86f5edfd0e056f50f09676f6364a0be56`, 1,185 PDF pages.
- All authored teaching copy is companion-created; source IDs, printed pages, and one-based PDF pages remain distinct.
- A chapter studio never upgrades untouched source sections or exercises from `unconverted`/`Indexed only`.
- Progress advances only from attempts/reviews; reading, UI controls, hints, revealed solutions, and tutor output cannot directly grant mastery.
- The core learning flow remains available offline and without Gemini.
- English remains the learning language; `ro-help` adds short Romanian guidance while preserving English technical terms.
- Every visual interaction has labelled keyboard controls and a text/table equivalent.
- Use test-driven development for every behavior change and run the complete suite before each deployment claim.
- Preserve Vite base `/DeeplearningApp/`, hash routing, service-worker scope, and the public browser tutor request/response contract.

## Review Focus

- A malformed shape/numeric response must not receive accidental credit through substring matching; Task 6 adds literal grading cases.
- A studio with missing or invalid source metadata must be excluded from the available path rather than crash Curriculum; Tasks 1 and 4 add schema/catalog rejection tests.
- A stale service worker must not strand navigation on old content chunks after deployment; Task 12 adds a production base-path/offline update test.
- A RAG citation from another chapter or content version must be rejected even when Gemini returns otherwise valid JSON; Task 11 adds adversarial Worker fixtures.
- A learner with existing IndexedDB sessions must resume after the new lesson stages are introduced; Task 9 adds backward-compatible session normalization and reload tests.

---

### Task 1: Learning-entry and milestone contracts

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/content/course-map.ts`
- Modify: `src/content/lessons.ts`
- Test: `tests/content/course-map.test.ts`
- Test: `tests/content/learning-content.test.ts`

**Interfaces:**
- Produces: `Milestone`, `SectionCoverage`, `InteractionSpec`, `LessonBase`, `DeepLesson`, `ChapterStudio`, `LearningEntry`, `learningEntries`, `learningEntryById`, `milestones`, and `chapterLearningMap`.
- `ChapterStudio` extends `LessonBase` with `kind: 'chapter-studio'`, `chapterId`, `milestoneId`, `purpose`, `capability`, `sectionCoverage`, `interaction`, and `chapterCheckQuestionIds`.
- Existing lesson IDs and source references remain unchanged; each receives `kind: 'deep-lesson'`, `chapterId`, and `milestoneId`.

- [ ] **Step 1: Write failing catalog tests** named `defines the six approved milestones`, `maps every book unit to one core path`, and `preserves the twelve deep lesson IDs`; assert `milestones.length === 6`, `chapterLearningMap.size === 22`, and the literal existing-ID set.
- [ ] **Step 2: Run `npm test -- tests/content/course-map.test.ts tests/content/learning-content.test.ts`** and verify failure because the contracts/catalog do not exist.
- [ ] **Step 3: Add the discriminated types and six-milestone course map** with chapters `1–2`, `3–6`, `7–8`, `9–11`, `12–16`, and `17–20/A/B` respectively.
- [ ] **Step 4: Convert the current lesson seed mapper to produce `DeepLesson` records** without changing authored copy or IDs, and create indexed `Map` lookups at module scope.
- [ ] **Step 5: Re-run the targeted tests** and verify they pass.
- [ ] **Step 6: Commit** with `feat: add complete course map contracts`.

### Task 2: Source-verified chapter studio foundations

**Files:**
- Create: `src/content/studios/foundations.ts`
- Create: `src/content/studios/vision.ts`
- Create: `src/content/studios/index.ts`
- Create: `scripts/verify_studio_sources.py`
- Create: `src/content/studio-source-manifest.json`
- Test: `tests/content/studios-foundations.test.ts`
- Modify: `tests/content/learning-content.test.ts`

**Interfaces:**
- Consumes: Task 1 `ChapterStudio`, `chapterLearningMap`, source inventory, and `companionSource`.
- Produces: studios `introduction-studio`, `classification-studio`, `mlp-studio`, `builders-guide-studio`, `cnn-studio`, and `modern-cnn-studio` plus source-manifest entries.

- [ ] **Step 1: Write failing tests** named `authors the first six chapter studios` and `uses verified source locations`; assert the literal six-ID set, every anatomy field is non-empty, every studio has an interaction and at least two refs, and every ref has the required hash with `pdfPageStart > 0`.
- [ ] **Step 2: Run `npm test -- tests/content/studios-foundations.test.ts`** and verify the missing studios fail.
- [ ] **Step 3: Implement `scripts/verify_studio_sources.py --pdf 2106.11342v5.pdf --inventory src/content/generated-inventory.json --out src/content/studio-source-manifest.json`** to validate hash/page count, resolve chosen section boundaries, and emit metadata only.
- [ ] **Step 4: Run the verifier locally** and manually compare at least one heading/equation mapping from each new studio against rendered PDF pages; record checks in the manifest.
- [ ] **Step 5: Author the six studios** with the standard lesson anatomy and interaction specs grounded only in verified references.
- [ ] **Step 6: Run targeted tests** and verify pass.
- [ ] **Step 7: Commit** with `feat: add introduction through modern cnn studios`.

### Task 3: Sequence, systems, applications, and advanced studios

**Files:**
- Create: `src/content/studios/sequences.ts`
- Create: `src/content/studios/systems.ts`
- Create: `src/content/studios/advanced.ts`
- Create: `src/content/studios/appendices.ts`
- Modify: `src/content/studios/index.ts`
- Modify: `src/content/studio-source-manifest.json`
- Test: `tests/content/studios-complete.test.ts`

**Interfaces:**
- Consumes: Task 1 contracts and Task 2 verification script/manifest.
- Produces: the remaining 14 studio IDs: `rnn-studio`, `modern-rnn-studio`, `attention-transformers-studio`, `optimization-studio`, `performance-studio`, `computer-vision-studio`, `nlp-pretraining-studio`, `nlp-applications-studio`, `reinforcement-learning-studio`, `gaussian-processes-studio`, `hyperparameter-optimization-studio`, `gan-studio`, `math-appendix-studio`, `tools-appendix-studio`.

- [ ] **Step 1: Write failing tests** named `completes all twenty studios`, `covers every required appendix section`, and `does not promote inventory records`; assert `studios.length === 20`, literal sets `A.1…A.11`/`B.1…B.8`, and deep equality of inventory status counts before/after catalog construction.
- [ ] **Step 2: Run `npm test -- tests/content/studios-complete.test.ts`** and verify the 14 missing studios fail.
- [ ] **Step 3: Extend and run the source verifier** for the selected sections in Chapters 9–20 and Appendices A/B, then manually check representative equations/headings for every mathematical studio.
- [ ] **Step 4: Author sequence and attention studios** using sequence-stepper/matrix interaction specs.
- [ ] **Step 5: Author optimization, performance, vision, and NLP studios** using parameter/shape/decision interaction specs.
- [ ] **Step 6: Author RL, GP, HPO, GAN, and appendix studios** with deterministic small examples and complete appendix cards.
- [ ] **Step 7: Run targeted content tests** and verify 32 total learning entries and all 22 core paths.
- [ ] **Step 8: Commit** with `feat: complete chapter studio learning track`.

### Task 4: Studio catalog validation and availability

**Files:**
- Create: `src/content/catalog.ts`
- Modify: `src/content/studios/index.ts`
- Modify: `src/content/course-map.ts`
- Test: `tests/content/catalog.test.ts`

**Interfaces:**
- Consumes: Tasks 1–3 learning entries and source manifest.
- Produces: `getAvailableLearningEntries(): LearningEntry[]`, `getChapterLearningSummary(chapterId): ChapterLearningSummary`, and `validateLearningCatalog(): CatalogIssue[]`.

- [ ] **Step 1: Write failing tests** named `reports duplicate and missing catalog identities`, `rejects invalid source references`, and `excludes an invalid entry without crashing`; assert literal `CatalogIssue.code` values and that the malformed fixture ID is absent from `getAvailableLearningEntries()`.
- [ ] **Step 2: Run `npm test -- tests/content/catalog.test.ts`** and verify missing validator failures.
- [ ] **Step 3: Implement catalog validation and module-scope lookup maps**; treat production catalog issues as unavailable content with an inspectable reason.
- [ ] **Step 4: Run targeted tests** and verify pass.
- [ ] **Step 5: Commit** with `feat: validate complete learning catalog`.

### Task 5: Eighty studio questions and chapter checks

**Files:**
- Create: `src/content/studio-questions/foundations.ts`
- Create: `src/content/studio-questions/sequences.ts`
- Create: `src/content/studio-questions/systems.ts`
- Create: `src/content/studio-questions/advanced.ts`
- Create: `src/content/studio-questions/index.ts`
- Modify: `src/content/questions.ts`
- Modify: `src/content/question-helpers.ts`
- Test: `tests/content/studio-questions.test.ts`
- Modify: `tests/content/learning-content.test.ts`

**Interfaces:**
- Consumes: `ChapterStudio.chapterCheckQuestionIds` and existing `Question` contract.
- Produces: four questions per new studio with IDs `studio-<chapter>-q1` through `q4`; `questions` contains 112 lesson/studio questions and all assessment content totals 120 with diagnostics.

- [ ] **Step 1: Write failing tests** named `provides four mixed questions for every studio` and `contains 120 unique reviewed assessment items`; assert counts `80`, `112`, `120`, four references for every studio, at least three literal types per set, and `some(applicationEvidence)` for each.
- [ ] **Step 2: Run `npm test -- tests/content/studio-questions.test.ts tests/content/learning-content.test.ts`** and verify count/reference failures.
- [ ] **Step 3: Author questions for Chapters 1 and 4–8** with misconception distractors and independently checked literal answers.
- [ ] **Step 4: Author questions for Chapters 9–16** including trace/debug items rather than recognition-only checks.
- [ ] **Step 5: Author questions for Chapters 17–20 and both appendices** including transfer/application items.
- [ ] **Step 6: Run targeted tests** and verify all IDs, refs, type mixes, hints, and explanations.
- [ ] **Step 7: Commit** with `feat: add complete book chapter checks`.

### Task 6: Typed deterministic grading and practice controls

**Files:**
- Create: `src/domain/grading.ts`
- Create: `src/components/QuestionResponse.tsx`
- Modify: `src/routes/Practice.tsx`
- Test: `tests/domain/grading.test.ts`
- Test: `tests/ui/practice-modes.test.tsx`

**Interfaces:**
- Produces: `gradeQuestion(question: Question, response: string): GradeResult` where `GradeResult` contains `score`, `correct`, `matchedRule`, and `feedback`; `QuestionResponse` renders controls by `QuestionType`.
- Practice query `?mode=quick|chapter|diagnostic&entry=<id>` chooses an explicit mode and persists evidence through the existing repository.

- [ ] **Step 1: Write failing grader tests** named `grades typed responses without substring credit`; assert `3.50005` passes tolerance `0.001`, `-2` stays negative, `(4,3,6)` equals `4 × 3 × 6`, `No` does not equal `Not sure`, ordered traces reject reordered steps, and response `3` does not satisfy expected `32`.
- [ ] **Step 2: Run `npm test -- tests/domain/grading.test.ts`** and verify failure against the current substring scorer.
- [ ] **Step 3: Implement the pure typed grader** without UI or persistence dependencies.
- [ ] **Step 4: Write failing component tests** named `renders a response control for each question type` and `completes a four-item chapter check`; assert radio/numeric/text roles, visible rubric text, mode headings, and question counters `1/4` through `4/4`.
- [ ] **Step 5: Implement `QuestionResponse` and refactor Practice** to use the pure grader and URL-selected entry.
- [ ] **Step 6: Run domain/UI tests** and verify pass, then run existing progress/review tests to ensure attempt semantics are unchanged.
- [ ] **Step 7: Commit** with `feat: add typed chapter check practice`.

### Task 7: Reusable chapter interaction renderers

**Files:**
- Create: `src/components/interactions/InteractionRenderer.tsx`
- Create: `src/components/interactions/ParameterLab.tsx`
- Create: `src/components/interactions/ShapePath.tsx`
- Create: `src/components/interactions/SequenceStepper.tsx`
- Create: `src/components/interactions/MatrixExplorer.tsx`
- Create: `src/components/interactions/DecisionCanvas.tsx`
- Create: `src/components/interactions/DistributionExplorer.tsx`
- Create: `src/domain/studio-interactions.ts`
- Test: `tests/domain/studio-interactions.test.ts`
- Test: `tests/ui/studio-interactions.test.tsx`

**Interfaces:**
- Consumes: Task 1 `InteractionSpec` union.
- Produces: pure calculation functions per interaction kind and lazy `InteractionRenderer({ spec })` with accessible tables/live output.

- [ ] **Step 1: Write failing pure-function tests** named `calculates every studio interaction deterministically`; use one hand-derived literal output per union member and assert invalid dimensions/empty sequences return an explanatory result instead of `NaN` or throwing.
- [ ] **Step 2: Run `npm test -- tests/domain/studio-interactions.test.ts`** and verify missing functions fail.
- [ ] **Step 3: Implement deterministic calculators** with no React dependency.
- [ ] **Step 4: Write failing UI tests** named `exposes keyboard and table paths for every interaction`; assert labelled spinbutton/slider controls, one named table or ordered list per renderer, and updated result text in `role=status` after keyboard input.
- [ ] **Step 5: Implement the six focused renderers and lazy dispatcher**; do not import the entire renderer set into Today/Curriculum.
- [ ] **Step 6: Run targeted domain/UI tests** and verify pass.
- [ ] **Step 7: Commit** with `feat: add reusable chapter interactions`.

### Task 8: Navigation guidance and route-purpose system

**Files:**
- Create: `src/content/section-guides.ts`
- Create: `src/components/PagePurpose.tsx`
- Modify: `src/components/Layout.tsx`
- Modify: `src/styles.css`
- Test: `tests/ui/navigation-guidance.test.tsx`

**Interfaces:**
- Produces: `SectionGuide`, `sectionGuideByRoute`, bilingual `PagePurpose`, meaningful navigation icons/labels, and an accessible mobile drawer.

- [ ] **Step 1: Write failing tests** named `explains every primary destination` and `operates the mobile drawer accessibly`; assert all eight guide keys, Romanian helper visibility under `ro-help`, `aria-expanded`, Escape closure, and focus returning to the menu button.
- [ ] **Step 2: Run `npm test -- tests/ui/navigation-guidance.test.tsx`** and verify missing guidance/focus behavior.
- [ ] **Step 3: Author eight route guides** and implement `PagePurpose` using learner language settings.
- [ ] **Step 4: Refactor Layout navigation** to semantic icons, two-line labels, current-route explanation, and accessible mobile state.
- [ ] **Step 5: Add navigation/purpose styles** using the approved palette and 44px targets.
- [ ] **Step 6: Run targeted tests** and verify pass.
- [ ] **Step 7: Commit** with `feat: explain every application section`.

### Task 9: Learning cockpit and book atlas

**Files:**
- Modify: `src/routes/Today.tsx`
- Modify: `src/routes/Curriculum.tsx`
- Modify: `src/App.tsx`
- Create: `src/components/MilestoneRail.tsx`
- Create: `src/components/ChapterAtlas.tsx`
- Test: `tests/ui/learning-cockpit.test.tsx`
- Modify: `tests/e2e/companion.spec.ts`

**Interfaces:**
- Consumes: Task 4 catalog summaries and existing progress snapshot.
- Produces: Today cockpit, milestone rail, Curriculum atlas, and hash-deep-link route `/curriculum/:chapterId?` with filters `available|review|indexed`.

- [ ] **Step 1: Write failing component tests** named `answers the three cockpit questions`, `browses all chapters by milestone`, and `explains indexed-only content`; assert the literal six milestone headings, 22 chapter rows, visible recommendation reason, filter results, and normalized legacy resume target `predict`.
- [ ] **Step 2: Run `npm test -- tests/ui/learning-cockpit.test.tsx`** and verify current pages fail the new behavior.
- [ ] **Step 3: Implement `MilestoneRail` and refactor Today** to one primary action plus evidence/review/resume panels.
- [ ] **Step 4: Implement `ChapterAtlas` and refactor Curriculum** to milestone-first browsing with a deep-linked details region and unchanged individual exercise inventory.
- [ ] **Step 5: Add an E2E path** from Today to a non-foundation chapter studio and back to its source sections.
- [ ] **Step 6: Run component and E2E tests** and verify pass on desktop/mobile widths.
- [ ] **Step 7: Commit** with `feat: add learning cockpit and book atlas`.

### Task 10: Guided lesson notebook

**Files:**
- Modify: `src/routes/Lesson.tsx`
- Create: `src/components/LessonJourney.tsx`
- Create: `src/components/LessonViewTabs.tsx`
- Modify: `src/data/repository.ts`
- Test: `tests/ui/guided-lesson.test.tsx`
- Modify: `tests/e2e/companion.spec.ts`

**Interfaces:**
- Consumes: `LearningEntry`, Task 7 interaction renderer, Task 6 Practice URL contract.
- Produces: six-stage lesson UI with stage IDs `orient|predict|understand|try|check|reflect`; saves these values to `SessionRecord.resumeStep` while accepting legacy `prediction|worked-example`.

- [ ] **Step 1: Write failing tests** named `moves through the six guided stages`, `keeps worked content behind a prediction`, and `resumes legacy and current sessions`; assert the literal stage-ID sequence, disabled reveal before input, selected tab changes on ArrowRight, entry-specific Practice URL, and restored stage after reload.
- [ ] **Step 2: Run `npm test -- tests/ui/guided-lesson.test.tsx`** and verify current Lesson fails.
- [ ] **Step 3: Implement journey and tab components** with correct ARIA semantics and no inline component definitions.
- [ ] **Step 4: Refactor Lesson** around the six stages and current learning-entry lookup; load `TutorPanel` only when opened.
- [ ] **Step 5: Add E2E coverage** for predict → reveal → interact → chapter check → pause → reload → resume.
- [ ] **Step 6: Run component/E2E tests** and verify pass.
- [ ] **Step 7: Commit** with `feat: turn lessons into guided notebook journeys`.

### Task 11: Gemini File Search RAG ingestion and Worker adapter

**Files:**
- Create: `scripts/rag/index_book.py`
- Create: `scripts/rag/README.md`
- Create: `scripts/rag/manifest.schema.json`
- Create: `worker/src/gemini.ts`
- Create: `worker/src/rag.ts`
- Modify: `worker/src/context.ts`
- Modify: `worker/src/index.ts`
- Modify: `worker/wrangler.jsonc`
- Modify: `.env.example`
- Modify: `.gitignore`
- Test: `tests/worker/rag.test.ts`
- Modify: `tests/worker/tutor.test.ts`

**Interfaces:**
- Ingestion command: `python3 scripts/rag/index_book.py <create|verify|reindex-section|reindex-chapter|delete-store> --pdf 2106.11342v5.pdf`; reads `GEMINI_API_KEY`, never prints it, and outputs store/document status only.
- Worker environment adds optional `GEMINI_FILE_SEARCH_STORE` and `RAG_CONTENT_VERSION`.
- `buildRagFilter(context: TutorContext): string` uses server metadata only.
- `generateGroundedTutorReply(input, context, env, fetcher): Promise<GroundedTutorResult>` returns structured tutor fields plus normalized citations.

- [ ] **Step 1: Write failing Worker tests** named `builds RAG filters only from the lesson allowlist`, `maps valid File Search citations`, `rejects citations outside the current chapter`, and `falls back safely when RAG is unavailable`; assert exact filter literals, verified server page metadata, `MALFORMED_TUTOR_RESPONSE` for foreign refs, and unchanged non-RAG success/error codes.
- [ ] **Step 2: Run `npm test -- tests/worker/rag.test.ts tests/worker/tutor.test.ts`** and verify missing adapter failures.
- [ ] **Step 3: Implement `worker/src/rag.ts`** to escape fixed metadata values, construct allowlisted filters, parse File Search citations, and map them to verified server refs.
- [ ] **Step 4: Extract Gemini transport into `worker/src/gemini.ts`** and combine File Search with the existing response JSON schema without changing the browser response contract.
- [ ] **Step 5: Wire optional RAG into `handleTutorRequest`**; when absent/mismatched, use current companion-summary grounding and existing safe errors.
- [ ] **Step 6: Implement the ingestion CLI** with hash/page verification, temporary extraction outside the repository, section metadata, bounded chunking, resumable idempotent indexing, dry-run/verify output, and exact-name confirmation for deletion.
- [ ] **Step 7: Add ignore rules and lifecycle documentation**; verify `git ls-files` contains no PDF/extracted text/store payload/secret.
- [ ] **Step 8: Run Worker tests and Wrangler dry-run** and verify pass.
- [ ] **Step 9: Commit** with `feat: ground tutor with Gemini book retrieval`.

### Task 12: Remaining route guidance, accessibility, and PWA verification

**Files:**
- Modify: `src/routes/Review.tsx`
- Modify: `src/routes/Lab.tsx`
- Modify: `src/routes/Progress.tsx`
- Modify: `src/routes/Notes.tsx`
- Modify: `src/routes/Settings.tsx`
- Modify: `src/styles.css`
- Modify: `vite.config.ts`
- Test: `tests/ui/route-guidance.test.tsx`
- Modify: `tests/e2e/companion.spec.ts`

**Interfaces:**
- Consumes: `PagePurpose` and the established learning loop.
- Produces: purposeful route headers, contextual empty-state actions, responsive scientific-notebook styling, and verified PWA update/base behavior.

- [ ] **Step 1: Write failing component tests** named `guides empty and populated secondary routes`; for Review/Lab/Progress/Notes/Settings assert purpose text, one contextual action, status text plus icon, and explanatory copy adjacent to every progress total.
- [ ] **Step 2: Run `npm test -- tests/ui/route-guidance.test.tsx`** and verify failures.
- [ ] **Step 3: Refactor the five routes** to use guidance and contextual actions without changing storage semantics.
- [ ] **Step 4: Apply the approved visual system** including signal-path connectors, varied information shapes, responsive layouts, focus styles, and reduced-motion behavior.
- [ ] **Step 5: Extend Playwright/axe tests** for keyboard-only navigation, tabs, mobile drawer, 320px layout, reduced motion, offline published content, stale-service-worker update, and `/DeeplearningApp/` asset paths.
- [ ] **Step 6: Run component/E2E accessibility tests** and verify pass.
- [ ] **Step 7: Commit** with `feat: complete guided interface and accessibility`.

### Task 13: Full regression, production artifacts, and RAG provisioning

**Files:**
- Modify: `README.md`
- Modify: `worker/README.md` (create if absent)
- Modify: `.github/workflows/worker.yml`
- Modify: `.github/workflows/pages.yml`

**Interfaces:**
- Produces: documented setup/deploy/rollback instructions and CI checks for content, secrets, Worker bundle, Pages, and RAG configuration presence without indexing the book in CI.

- [ ] **Step 1: Add CI assertions** for content counts, tracked-file exclusions, Worker dry-run, Pages base path, and optional `GEMINI_FILE_SEARCH_STORE` configuration.
- [ ] **Step 2: Document local RAG provisioning** including free-tier data disclosure, create/verify/reindex/delete commands, and the distinction between browser reset and remote store deletion.
- [ ] **Step 3: Run fresh verification:** `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`, and Wrangler dry-run; require zero failures.
- [ ] **Step 4: Run `python3 scripts/rag/index_book.py verify --pdf 2106.11342v5.pdf`** against the configured store and require matching source/content versions before enabling RAG.
- [ ] **Step 5: Run tracked-file and build-artifact scans** and verify no secret/PDF/extracted text/local database/config file appears.
- [ ] **Step 6: Commit** with `docs: finalize complete companion operations`.

### Task 14: GitHub tracking, deployment, and live acceptance

**Files:**
- No product files unless deployment verification exposes a defect.

**Interfaces:**
- Produces: GitHub milestone `Complete Book Learning Cockpit`, linked task issues, deployed Pages/Worker commits, and live acceptance evidence.

- [ ] **Step 1: Create/update GitHub milestone and issues** for Content track, Interactions/grading, Learning cockpit, Guided lessons, RAG, Accessibility/PWA, and Future deep-section batches; link commits and close only verified work.
- [ ] **Step 2: Push `main` without force** and watch Pages and Worker workflows to terminal success.
- [ ] **Step 3: Verify live URLs**: Pages HTTP 200, Worker `/health`, correct production asset base, and deployed commit identity.
- [ ] **Step 4: Perform a real browser tutor test** with Turnstile: one valid book-grounded reply with visible allowed citation, one insufficient-evidence question, and one offline/unavailable continuation.
- [ ] **Step 5: Perform the complete live learning path** from a later chapter studio through interaction, chapter check, evidence, pause/reload/resume, and scheduled review.
- [ ] **Step 6: Record final test/deploy evidence in the tracking issues** and report any intentionally deferred section-level conversion as future work, not completed content.

