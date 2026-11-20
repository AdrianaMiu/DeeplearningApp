# Chapters 18–20 Essential Learning Paths — Design

## Intent

Make the least-developed final chapters useful before attempting section-by-section conversion of the whole book. Chapters 18–20 will each offer a coherent path of three short lessons: the existing core studio plus two new essential lessons. This is the first batch in a breadth-first pass over the book; detailed section and exercise conversion remains a later depth pass.

## Goals

- Give Chapters 18, 19, and 20 three useful learning entries each.
- Teach the chapter's most important ideas at a general-to-applied level in roughly 30–45 minutes per chapter.
- Add reviewed checks and one interaction or applied decision per chapter path.
- Preserve precise source references and original companion prose without publishing book text.
- Enable the grounded tutor only for the new reviewed lesson contexts.
- Make the curriculum distinguish an essential path from detailed source conversion.
- Keep existing local progress and stable entry IDs intact.

## Non-goals

- This batch does not convert every source section or all 28 indexed exercises in Chapters 18–20.
- It does not mark any of these chapters fully converted.
- It does not enable book RAG.
- It does not solve the separate tutor-latency defect. Verified non-AI learning paths may ship while that defect remains open.

## Chosen approach

We considered: (1) reverse chapter order, (2) thematic paths, and (3) practical-importance order. The chosen approach is reverse order in small batches, starting with Chapters 18–20, because it gives neglected chapters useful coverage quickly while retaining the book's chapter structure.

Each chapter receives three entries rather than one long lesson. The existing core studio remains the conceptual anchor and two new deep lessons add mechanics and application. This avoids duplicating existing material and keeps sessions resumable.

## Learning paths

### Chapter 18 — Gaussian Processes

1. **Encode similarity with a GP kernel** (existing studio): function uncertainty, RBF similarity, and length scale.
2. **Condition a prior into a posterior**: observations, noise, posterior mean, posterior uncertainty, and the distinction between epistemic and observation uncertainty. Sources: 18.2 and 18.3.1–18.3.3.
3. **Build and diagnose a small GP regression model**: covariance matrix, diagonal noise, stable linear solves, marginal likelihood intuition, and when kernel assumptions fail. Sources: 18.3.2–18.3.5.

### Chapter 19 — Hyperparameter Optimization

1. **Spend a search budget deliberately** (existing studio): validation-based search and multi-fidelity allocation.
2. **Design a trustworthy HPO experiment**: search spaces, random search, validation isolation, seeds, trial ledgers, and fair comparisons. Sources: 19.1 and 19.2.
3. **Allocate resources asynchronously**: scheduler/searcher separation, asynchronous random search, successive halving, stragglers, and early-ranking uncertainty. Sources: 19.3–19.5.

### Chapter 20 — Generative Adversarial Networks

1. **Separate two adversarial updates** (existing studio): generator/discriminator roles and alternating gradients.
2. **Trace a complete GAN training step**: latent samples, detach boundaries, discriminator and generator objectives, update order, and diagnostic signals. Sources: 20.1.
3. **Move from a toy GAN to a DCGAN**: convolutional generator/discriminator structure, normalization and activations, sample-quality/diversity checks, instability, and mode collapse. Sources: 20.2.

## Assessment and interaction

- Each new lesson gets three reviewed questions: one conceptual prediction, one calculation/code-trace item, and one transfer or diagnosis item.
- The chapter path therefore exposes at least ten reviewed checks including the existing studio questions.
- Existing parameter labs remain. New lessons reuse lightweight HTML/SVG/table interactions where they materially clarify covariance, resource allocation, or alternating updates.
- Assisted tutor answers remain evidence but cannot independently advance mastery.

## Curriculum presentation

Chapter cards show `3 essential lessons available` separately from detailed conversion counts. Chapter details explain that the essential path is complete for the breadth pass while individual source sections and exercises may remain `Depth expansion planned`. The global inventory continues to show all 609 references; these counts are never presented as completed activities.

## Content and tutor architecture

- Add stable lesson records through the existing validated lesson/catalog structures; do not generate prose at runtime.
- Extend chapter learning maps with the two new entry IDs per chapter.
- Add original questions and source references using existing schemas.
- Add the new reviewed lesson IDs and allowed source references to Worker tutor contexts.
- Keep the current bounded tutor request format. Tutor contexts may be included, but tutor latency does not block release of verified non-AI learning paths.

## Verification

- Schema tests verify unique IDs, valid source ranges, reviewed question totals, and three available entries per chapter.
- Component tests verify the essential-path label, navigation order, resume behavior, and honest depth status.
- Tutor tests verify new IDs are allowlisted and reject citations outside each lesson's references.
- Run typecheck, unit/content tests, production build, Playwright keyboard/mobile flow, and publication audit.

## Delivery sequence

1. Implement Chapter 20's two new lessons and tests.
2. Implement Chapter 19's two new lessons and tests.
3. Implement Chapter 18's two new lessons and tests.
4. Add curriculum essential-path presentation and integrated acceptance tests.
5. Review, merge to `main`, deploy, and verify the public site.
6. Repair and verify tutor latency independently; it does not block the content release.

## Builder decisions

- Three entries per chapter includes the existing studio, so this batch adds six lessons rather than nine.
- Chapter completion language is scoped: `essential path complete`, never `chapter fully converted`.
- English remains the canonical lesson language; Romanian remains optional tutor help while preserving English technical terms.
- The essential-path release proceeds when its non-AI learning flows pass verification, even if Gemini remains temporarily unreliable.
