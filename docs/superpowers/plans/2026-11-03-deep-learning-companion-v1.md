# Deep Learning Companion v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the approved offline-capable Deep Learning Companion v1 to GitHub Pages with a separately deployable guarded Gemini tutor Worker.

**Architecture:** A Vite React TypeScript SPA uses hash routing and IndexedDB for local-first learning data. Versioned static content drives deterministic learning interactions and evidence-based progress; a Cloudflare Worker is the only component that can access Gemini.

**Tech Stack:** React, TypeScript, Vite, React Router, Dexie, Zod, KaTeX, Vitest, Testing Library, Playwright, vite-plugin-pwa, Cloudflare Workers, Gemini REST API.

**Spec:** `deep_learning_companion_app_context.md` plus the user-approved implementation plan in the conversation.

## Global Constraints

- GitHub Pages base is `/DeeplearningApp/`; routes use a hash router.
- The supplied PDF, `config/`, secrets, caches, databases, and environment files never enter Git history.
- Attempts are append-only and progress is derived from evidence.
- The core learning flow works without animation, a mouse, or an LLM.
- Only reviewed/published content reaches the tutor context allowlist.
- Gemini and Turnstile secrets stay in Cloudflare Worker secrets.
- Every production behavior follows RED → GREEN TDD.

## Review Focus

- Malformed or incompatible tensor shapes return a useful result without crashing.
- Corrupt/foreign import files are rejected before local data changes.
- Assisted or revealed attempts never advance independent mastery.
- GitHub Pages subpath navigation and service-worker scope remain correct.
- Tutor abuse/error cases fail closed while lessons remain usable.

---

### Task 1: Project foundation, schemas, and source inventory

**Files:** Create project/tooling config, `src/domain/types.ts`, `src/content/inventory.ts`, `scripts/extract_inventory.py`, and schema tests.

**Interfaces:** Produces versioned `CurriculumInventory`, `Lesson`, `Question`, `Attempt`, and related types consumed by every later task.

- [ ] Write schema and inventory tests asserting 20 chapters, appendices A/B, A.1–A.11, B.1–B.8, unique IDs, source hash, and no embedded PDF text.
- [ ] Run focused tests; expect failure because modules do not exist.
- [ ] Add the minimal scaffold, strict config, schemas, inventory data, and repeatable `pdftotext` extraction script.
- [ ] Run focused tests and the full suite; expect pass.
- [ ] Commit `feat: establish curriculum foundation`.

### Task 2: Learning engine and mathematical interactions

**Files:** Create `src/domain/broadcasting.ts`, `gradients.ts`, `regression.ts`, `progress.ts`, `review.ts` with unit tests.

**Interfaces:** Produces deterministic broadcasting, finite-difference, regression-loss, mastery, recommendation, and scheduling functions.

- [ ] Write failing tests for compatible/incompatible broadcasting, finite differences, regression loss, intervals 1/3/7/14/30, assisted evidence exclusion, Demonstrated, and Retained.
- [ ] Run focused tests; expect missing-function failures.
- [ ] Implement minimal pure functions and refactor only after green.
- [ ] Run focused and full suites; expect pass.
- [ ] Commit `feat: add evidence-based learning engine`.

### Task 3: Reviewed lessons, diagnostic, questions, and notebook

**Files:** Create content modules for 12 lessons, 8 diagnostic items, 32 lesson questions, and `public/labs/linear-regression-pytorch.ipynb`; add content validation tests.

**Interfaces:** Produces `lessons`, `questions`, `diagnosticQuestions`, and downloadable lab metadata.

- [ ] Write failing content tests for exact counts, required lesson anatomy, question-type mix, source references, and reviewed status.
- [ ] Run focused tests; expect count/module failures.
- [ ] Author original companion content and notebook without redistributing the PDF.
- [ ] Run focused and full suites; expect pass.
- [ ] Commit `content: add foundations learning release`.

### Task 4: IndexedDB persistence and import/export

**Files:** Create `src/data/db.ts`, `repository.ts`, `transfer.ts`, hooks, and fake-IndexedDB tests.

**Interfaces:** Produces append-only attempt/session/note operations, `exportProgress()`, `previewImport()`, `importProgress(mode)`, and `resetProgress()`.

- [ ] Write failing tests for append-only attempts, duplicate-safe merge, newest settings, replace, invalid import rollback, and export round-trip.
- [ ] Run focused tests; expect missing repository behavior.
- [ ] Implement Dexie storage and Zod-validated transfer.
- [ ] Run focused and full suites; expect pass.
- [ ] Commit `feat: persist and transfer learning progress`.

### Task 5: Accessible application shell and learning flows

**Files:** Create routes/components/styles for Today, Curriculum, Lesson, Practice, Review, Lab, Progress, Notes, Settings, diagnostic, and three explorers; add component tests.

**Interfaces:** Consumes content/domain/data APIs; produces keyboard-accessible user flows and responsive scientific-notebook UI.

- [ ] Write failing component tests for navigation, diagnostic skip/override, prediction-before-reveal, assisted attempts, pause/resume, notes, export/import, and textual interaction alternatives.
- [ ] Run focused tests; expect missing UI.
- [ ] Implement the shell and routes with bundled fonts, visible focus, reduced motion, concise states, and lazy route loading.
- [ ] Run component tests, accessibility checks, and full suite; expect pass.
- [ ] Commit `feat: build learning companion interface`.

### Task 6: Guarded Gemini tutor Worker

**Files:** Create `worker/src/index.ts`, allowlisted context, Wrangler config, Worker tests, and tutor client/panel tests.

**Interfaces:** `POST /api/tutor` accepts the approved request shape and returns validated structured coaching; `/health` exposes no secrets.

- [ ] Write failing tests for CORS, payload validation, attempt-first short circuit, allowlist enforcement, Turnstile/rate limits, malformed Gemini responses, and safe errors.
- [ ] Run focused tests; expect missing Worker/client.
- [ ] Implement Worker and tutor panel with disclosure, offline fallback, and no mastery side effects.
- [ ] Run focused and full suites; expect pass.
- [ ] Commit `feat: add guarded grounded tutor`.

### Task 7: PWA, deployment, browser QA, and publication

**Files:** Create PWA assets, GitHub Pages and Worker workflows, README/setup docs, and Playwright tests.

**Interfaces:** Produces `dist/`, GitHub Pages deployment, separately deployable Worker, and verified release documentation.

- [ ] Write failing browser tests for broadcasting flow, reload persistence, keyboard use, reduced motion, offline/tutor errors, and `/DeeplearningApp/` assets.
- [ ] Add PWA/deployment configuration and documentation; run browser tests, unit tests, typecheck, build, and secret scan.
- [ ] Review UI against current Vercel web guidelines; fix Important findings with RED → GREEN tests.
- [ ] Commit `chore: prepare verified GitHub Pages release`.
- [ ] Push without force, enable Pages Actions, deploy Worker only when credentials exist, and verify live URLs.
- [ ] Create a GitHub milestone, implementation/content/deployment issues, labels, and a GitHub Project board linked to the repository; close issues already completed and leave future content expansion visible.

