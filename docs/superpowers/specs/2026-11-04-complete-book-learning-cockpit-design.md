# Complete Book Learning Cockpit — Design

## Intent

Deep Learning Companion should become a usable path through the entire supplied *Dive into Deep Learning* book, not a polished Chapter 2 demo followed by a list of unavailable material. A learner should understand what every application area is for, see where they are in the book, open a meaningful learning activity for every chapter, and verify understanding through mixed practice.

The product remains an evidence-based learning companion. It does not claim that reading a chapter, opening a lesson, using hints, or receiving tutor help proves mastery.

## Source and current state

- The local source PDF is `2106.11342v5.pdf`, has 1,185 pages, and matches the required SHA-256 `93316e525a034cfa935023c3c31196c86f5edfd0e056f50f09676f6364a0be56`.
- The inventory represents 20 numbered chapters, Appendix A, Appendix B, 1,019 section/subsection records, and 471 exercise references.
- The current application contains 12 reviewed deep lessons covering Chapter 2 and early Chapter 3, plus 32 lesson questions and eight diagnostic questions.
- The current navigation names application areas but gives little explanation of their purpose. Curriculum exposes the source hierarchy, but most rows end at an `unconverted` status with no useful entry point.

## Chosen approach

Use a complete chapter-level track, followed by deeper section-level expansion.

The first complete-book release adds one reviewed **chapter studio** for every chapter or appendix not already represented by a reviewed lesson. Existing Chapter 2 and Chapter 3 lessons remain the deeper foundation track. Every chapter and appendix therefore has a functional entry point, objectives, source references, an interaction, practice, and a chapter check, while all detailed book sections remain visible and honestly labelled.

This approach was chosen over:

- converting all 1,019 inventory records immediately, which would require hundreds of separately reviewed lessons and would encourage false completeness;
- chapter summaries only, which would improve coverage labels but would not develop prediction, implementation, debugging, or transfer ability.

## Goals

1. Give all 20 chapters and both appendices at least one meaningful reviewed learning experience.
2. Add four reviewed, mixed-format questions for every new chapter studio: concept discrimination, calculation or trace, misconception or debugging, and transfer/application.
3. Make every primary application area explain its purpose, what the learner does there, and what evidence it creates.
4. Turn Curriculum into a navigable learning map with milestones, chapter purposes, coverage, available activities, and a clear next action.
5. Turn Lesson into an explicit sequence: Orient, Predict, Understand, Try, Check, Reflect.
6. Add small keyboard-operable interactions across the whole course using a limited set of reusable interaction patterns.
7. Keep progress, review, and mastery rules evidence-based and compatible with existing IndexedDB data.
8. Keep the application responsive, offline-capable, and useful without Gemini.

## Non-goals

- This release does not convert every subsection or every source exercise into a standalone lesson.
- It does not mark all 1,019 sections or 471 exercises as reviewed merely because their parent chapter has a studio.
- It does not reproduce book paragraphs or exercise text.
- It does not execute PyTorch in the browser.
- It does not let AI responses award mastery.
- It does not replace the existing detailed Chapter 2–3 lessons with shallow summaries.

## Honest content model

Add a `ChapterStudio` learning record that uses the existing `Lesson` anatomy and adds:

- `chapterId` and `milestoneId`;
- `purpose`: why the chapter matters;
- `capability`: what the learner should be able to do afterward;
- `sectionCoverage`: source section IDs mapped to a short objective and one of `introduced`, `practiced`, or `reference`;
- `interaction`: a declarative interaction specification;
- `chapterCheckQuestionIds`;
- `contentStatus` and content version.

Add a small `SectionGuide` record for each application destination with an English purpose, an English action/evidence description, and a short Romanian helper explanation. The Romanian text appears only when the learner selects `Romanian help`; English technical terms remain unchanged.

The chapter studio is companion-created teaching content grounded in selected verified source sections. Its existence changes the parent chapter display to `Core studio available`; it does not change untouched subsection and exercise statuses. Deep lessons remain labelled `Deep lesson`. The vocabulary shown to learners is:

- **Core studio available** — a reviewed chapter-level learning path exists.
- **Deep lesson available** — a focused section-level lesson exists.
- **Indexed** — present in the book map but not converted into an activity.
- **Draft** — authored but not accepted for the learning path.

The technical `unconverted | drafted | reviewed | published` values remain in stored schemas, but `unconverted` is explained to the learner as `Indexed only — source mapped, learning activity not authored yet`.

## Complete-book content scope

Keep the 12 current deep lessons. Add 20 studios: Chapter 1; Chapters 4–20; Appendix A; Appendix B. Chapter 2 and Chapter 3 use their existing deep lesson collections as their core paths, with new chapter landing metadata rather than duplicate overview lessons.

Each new studio contains:

- one motivating question and two observable objectives;
- prerequisites and verified section/page references;
- short Intuition, Math, Code, and Work connection views;
- one prediction-before-reveal activity;
- one worked example and one independent task;
- at least two misconceptions and one teach-back prompt;
- one reusable interactive model with a text/table equivalent;
- four questions forming its chapter check;
- an exit state that schedules review but never grants mastery without attempts.

The Appendix A studio contains 11 selectable refresher cards, one for each of A.1–A.11. The Appendix B studio contains eight selectable tool cards, one for each of B.1–B.8. These cards map objectives and source references without pretending that one short interaction exhausts the appendix.

The resulting release has 32 learning entries, 112 reviewed lesson questions, and eight diagnostic questions, for 120 reviewed assessment items total.

## Interaction system

Use declarative specifications rendered by a small set of reusable components rather than building 20 unrelated mini-apps:

1. **Parameter lab** — sliders/number fields update a metric and explanation. Used for softmax, dropout, optimizers, kernels, hyperparameters, and GAN balance.
2. **Shape path** — learners predict and trace shapes through layers. Used for MLPs, module composition, CNNs, modern CNNs, and performance batching.
3. **Sequence stepper** — next/previous controls expose state changes. Used for RNNs, gated RNNs, NLP pretraining, NLP applications, and reinforcement learning.
4. **Matrix/weight explorer** — editable small values produce a table of computed weights or outputs. Used for attention and Appendix A.
5. **Decision canvas** — choose a formulation or tool and receive rule-based feedback. Used for Introduction, Computer Vision, and Appendix B.
6. **Distribution explorer** — observations and parameters update uncertainty or loss. Used for probability-linked material and Gaussian processes.

Every interaction has labelled controls, keyboard operation, visible numeric output, a plain-language explanation of what changed, and a table or ordered-list alternative. Calculations are deterministic and unit tested.

## Information architecture and interface

### Persistent navigation

Retain the desktop sidebar and mobile drawer, but replace numbered links with meaningful icons and two-line labels. Each destination shows a short description on focus/hover and in a permanent `You are here` panel at the top of the page:

- **Today — Continue learning:** one recommended action, resume point, due review.
- **Learn — Explore the book:** milestones, chapters, deep lessons, indexed source.
- **Practice — Check understanding:** diagnostic, lesson practice, chapter checks.
- **Review — Remember later:** due spaced-repetition checks.
- **Lab — Manipulate ideas:** interactive mathematical workbench and notebooks.
- **Progress — Inspect evidence:** coverage, demonstrated concepts, retained concepts.
- **Notes — Capture thinking:** explanations, misconceptions, questions.
- **Settings — Shape the routine:** language, pace, data, tutor privacy.

### Today: learning cockpit

The first viewport answers three questions in order:

1. **What am I learning?** Current milestone, chapter, and capability.
2. **What should I do now?** One primary action with duration and reason.
3. **What evidence do I have?** Recent attempts, due review, and saved reflection.

A compact six-milestone rail shows the whole journey without turning it into a competitive progress bar. A `How this app works` disclosure explains the learning loop once and remains available afterward.

```text
┌───────────────┬──────────────────────────────────────────────────┐
│ Continue      │ You are here: Foundations / Tensor reasoning    │
│ Explore book  │                                                  │
│ Practice      │ NEXT ACTION                                      │
│ Review        │ Read tensors by shape · 35 min                   │
│ Labs          │ [Continue lesson]  Why this is recommended       │
│ Progress      │                                                  │
│ Notes         │ Foundations ━━ Models ── Vision ── Sequences …  │
│ Settings      │                                                  │
│               │ Evidence: 4 attempts  ·  2 reviews due           │
└───────────────┴──────────────────────────────────────────────────┘
```

### Curriculum: book atlas

Default to a milestone view rather than a 22-row accordion wall. Each milestone contains chapter cards with:

- chapter number/title and one-sentence purpose;
- capability gained;
- studio/deep-lesson/question counts;
- source coverage versus learning-activity coverage;
- status in words and icon, not color alone;
- one clear action: Start studio, Continue, Practice, or Inspect sections.

Selecting a chapter opens an in-page chapter drawer/region. It shows the studio path first, then detailed source sections and exercise references. Search and filters support `Available now`, `Needs review`, and `Indexed only`.

```text
MILESTONE 3 · VISUAL REPRESENTATIONS
┌─ Chapter 7 ──────────────────────────────────────────────────────┐
│ Convolutional Neural Networks                                   │
│ Purpose: learn how locality and shared filters find patterns.   │
│ Core studio available · 4 questions · 37 source records         │
│ [Start studio] [Inspect sections]                               │
└─────────────────────────────────────────────────────────────────┘
```

### Lesson: guided notebook

Use a sticky lesson rail with six real stages: Orient, Predict, Understand, Try, Check, Reflect. Each stage explains what to do and why it helps. The four learning views become tabs with explanatory labels:

- Intuition — build a mental model;
- Math — connect symbols and quantities;
- Code — translate the idea into operations;
- My work — transfer it to computer vision, RF, or ML pipelines.

The learner can move backward freely. Worked examples remain gated by a prediction. `Check` links to the current lesson or chapter question set rather than the generic first practice question. Pause stores the active stage.

```text
Orient ━ Predict ━ Understand ─ Try ─ Check ─ Reflect

Why this matters                    Source §7.1–§7.3
┌──────────────────────────────┬───────────────────────────────────┐
│ Interaction / prediction     │ Intuition · Math · Code · My work│
│ with numeric text output     │ active explanation               │
└──────────────────────────────┴───────────────────────────────────┘
```

### Practice

Offer three explicit modes: Quick practice, Chapter check, and Diagnostic. The chosen mode explains what it measures. Chapter checks show four question types and an estimated time. Feedback identifies the rule, the mistaken step, and the next attempt. Question selection remains deterministic and offline.

Render the response control by question type: radio groups for multiple choice, numeric inputs with tolerance-aware grading, structured shape inputs, and text areas with a visible rubric for explanation/transfer. Replace substring matching with a typed deterministic grader that normalizes equivalent shape notation and numeric values without accepting partial accidental matches.

### Other destinations

Review, Lab, Progress, Notes, and Settings receive the same purpose header, an empty-state next action, and contextual links back into the learning loop. No page should present a number without explaining what behavior created it.

## Visual direction

Preserve the scientific notebook identity, but make the characteristic visual a **signal path through the book**: thin ruled connectors join milestone, chapter, activity, attempt, and review states. This relationship graphic is functional, not decorative.

Palette:

- Ink navy `#102E37` — primary text and structure.
- Lab teal `#087078` — active progress and interactive controls.
- Correction coral `#B94F48` — misconceptions and corrections.
- Evidence gold `#9A7222` — source references and demonstrated evidence.
- Paper `#FBFCF7` and bench `#EEF2ED` — reading and workspace surfaces.

Typography keeps the existing bundled/system sans for controls and Georgia-style serif for instructional headings; no external font request is introduced. Body lines stay below 75 characters. The redesign avoids identical card grids: milestone rails, chapter rows, notebook stages, and evidence strips have shapes that match their information.

Motion is limited to user-triggered stage transitions, interaction feedback, and navigation drawer changes. Reduced-motion removes interpolation without hiding state changes.

## React and performance structure

- Keep route-level lazy loading.
- Split content by chapter/milestone into statically analyzable modules so opening Today does not parse every question and studio.
- Build maps for repeated lesson, chapter, and question lookup rather than filtering large arrays during every render.
- Keep interaction state local to the active lesson and derive display values during render.
- Lazy-load interactive renderers and the tutor panel only when opened or reached.
- Preserve versioned IndexedDB records and add only optional fields or a migration with round-trip tests.
- Precache authored content modules through the existing Vite PWA build; tutor calls remain network-only.

Tutor support expands to a studio only after its server-side summary and allowed section IDs are added to the matching content-version allowlist. The browser sends studio/concept IDs but never source text. A studio remains fully functional when its tutor context is absent, offline, rate-limited, or unavailable.

## Gemini book RAG

The book becomes a private retrieval source for the tutor through Gemini File Search. This is retrieval-augmented generation, not model fine-tuning and not a permanent modification of Gemini's base knowledge.

### Ingestion

- `2106.11342v5.pdf` remains ignored, untracked, and absent from all Pages/Worker deployment artifacts.
- A local administrative script verifies the exact SHA-256 and 1,185-page count before reading the file.
- The script extracts one document per substantive section using the verified inventory/page mapping. Each document begins with companion-generated metadata and contains only that section's extracted source text.
- Every imported document carries File Search custom metadata: `sourceHash`, `contentVersion`, `chapterId`, `sectionId`, `printedStart`, `printedEnd`, `pdfPageStart`, and `pdfPageEnd`.
- Chunking uses bounded overlapping chunks and records the chosen configuration in a versioned local manifest. Mathematical sections receive extraction checks against rendered PDF pages before their studio is marked reviewed.
- One File Search store contains the complete book index. The store resource name is configured only in the Worker environment as `GEMINI_FILE_SEARCH_STORE`; it is never sent to the browser.
- Administrative commands support `create`, `verify`, `reindex-section`, `reindex-chapter`, and `delete-store`. Destructive store deletion requires the exact resource name and explicit confirmation.

Directly uploading the complete PDF was rejected as the primary method. It is simpler, but section documents provide stable source IDs, printed/PDF page mapping, chapter filtering, and controlled reindexing when one extraction is corrected.

### Retrieval and generation

1. The browser sends the existing lesson ID, concept IDs, question, attempt, mode, and Turnstile token.
2. The Worker resolves the lesson/studio to its reviewed server-side context and allowed chapter/section IDs.
3. The Worker calls Gemini File Search using a server-constructed metadata filter for the current `sourceHash`, `contentVersion`, and allowed `chapterId` or `sectionId` values. Client input never participates in the filter syntax.
4. Gemini receives only the retrieved chunks plus companion lesson context and produces the existing structured tutor response.
5. The Worker accepts only File Search citations whose metadata maps back to the allowed source records. It replaces model-provided display metadata with verified server values.
6. If retrieval returns no permitted evidence, citations are missing, output is malformed, or the service times out, the Worker returns `insufficientEvidence` or the existing safe unavailable state. The lesson remains usable.

Tutor citations shown in the UI distinguish `Book source` from `Companion explanation` and include section ID plus printed and PDF page positions. The UI does not display long source excerpts.

### Privacy, cost, and lifecycle

- The first tutor use discloses that the indexed book and invoked conversation fragments are processed by Gemini. The existing warning about free-tier product improvement remains visible.
- The raw Gemini File object is temporary, while File Search embeddings/documents persist until deleted. Settings documentation provides the exact deletion command and explains that resetting browser progress does not delete the remote RAG store.
- Billing remains disabled unless the user explicitly changes it. Quota or billing errors are normal non-AI states.
- Indexing cost/quota and retrieved-token usage are documented separately from ordinary generation requests.
- The public repository contains the ingestion code, manifest schema, and source metadata, but not extracted book text, RAG index payloads, credentials, store dumps, or the PDF.

### Compatibility and migration

Gemini 3 structured output remains the response contract. The Worker may use the current `generateContent` File Search tool while it remains supported; transport-specific parsing is isolated behind a provider adapter so migration to the Interactions API does not change the browser contract.

The existing reviewed companion summaries remain a fallback while the store is absent. RAG is enabled only when `GEMINI_FILE_SEARCH_STORE` exists and its manifest source/content versions match the deployed Worker.

## Accessibility

- Every destination has a unique heading and purpose description.
- The mobile drawer traps neither focus nor page scroll and closes on Escape/navigation.
- The lesson rail uses buttons or links with current-step semantics, not clickable `div` elements.
- Tabs expose `tablist`, `tab`, and `tabpanel` semantics and work with arrow keys.
- Interactions announce recalculated results through restrained live regions.
- Status always combines text, icon, and color.
- Equation text alternatives and interaction tables remain available.
- Touch targets remain at least 44px and contrast remains WCAG 2.2 AA.

## Verification and acceptance

Content/schema tests must prove:

- 20 numbered chapters and two appendices each resolve to a functional core learning path;
- Chapters 2 and 3 retain all existing deep lessons;
- 20 new studios contain complete lesson anatomy and verified source references;
- each new studio has exactly four mixed questions including one application item;
- all 120 question IDs are unique and all question references resolve;
- no chapter-level studio changes untouched section/exercise statuses;
- all references use the expected source hash and valid PDF pages.
- the RAG manifest covers every indexed substantive section exactly once and excludes the raw/extracted source from tracked files.

Component and end-to-end tests must prove:

- each navigation destination explains its purpose;
- a learner can start a studio from a milestone, predict, reveal, use an interaction, open its chapter check, answer, pause, reload, and resume the correct stage;
- chapter filters and indexed-only explanations are understandable and keyboard accessible;
- mobile navigation, tabs, reduced motion, and offline content work;
- evidence remains distinct from reading and assisted attempts cannot advance mastery.
- RAG filters are built only from server allowlists, unknown citation metadata is rejected, and absent/mismatched stores fall back safely.

Production acceptance requires unit/component/Playwright/axe checks, a successful `/DeeplearningApp/` build, a clean secret/PDF scan of tracked files, and successful Pages deployment. The source PDF remains ignored and untracked.

## Delivery sequence

1. Add coverage metadata, chapter purposes, and content/schema tests.
2. Add the 20 reviewed chapter studios and 80 questions in source-verified batches.
3. Add reusable interaction specifications and renderers.
4. Redesign navigation, Today, and Curriculum around the learning cockpit.
5. Redesign Lesson and Practice around explicit stages and chapter checks.
6. Add purpose guidance and contextual next actions to remaining routes.
7. Complete accessibility, responsive, offline, and end-to-end verification.
8. Add the source-verified ingestion tool, Gemini File Search adapter, citation validation, and RAG lifecycle documentation.
9. Push and verify GitHub Pages and the Worker; update GitHub issues/task tracking to reflect delivered and later deep-lesson batches.

