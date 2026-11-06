# Token-efficient balanced conversion design

## Intent

Finish the book companion at balanced depth while avoiding repeated prompts, repeated prose and oversized tutor requests. Every substantive source record remains individually navigable and every extracted exercise reference receives an individual workflow; compactness must never be represented as completion when content is absent.

## Chosen approach

Use typed, chapter-local content batches backed by small reusable authoring helpers. Generate and review several related records together, but store each result as an independently validated activity. Keep the existing detailed studios and interactions for high-value concepts; use concise section activities and exercise rubrics for breadth. Reduce tutor input deterministically before the network call instead of relying on the model to ignore excess history.

Alternatives rejected:

- One model call per record: simplest isolation, but repeats instructions and source context hundreds of times.
- Generic templates for the whole book: cheapest, but produces repetitive activities and hides weak coverage.
- Full RAG on every tutor request: unnecessary cost and latency; retrieval remains optional and lesson-scoped.

## Requirements

- Author in chapter batches of related sections, with unique explanations, tasks and exercise prompts.
- Keep source metadata, companion content and learner evidence separate.
- Validate IDs, source references, minimum substance, duplicate normalized prose and honest remaining counts.
- Use compact shared constructors without generating prose at runtime.
- Limit tutor fields independently: learner attempt, question and recent conversation.
- Replace older conversation turns with one deterministic learning-state summary when history exceeds the active window.
- Record request-size estimates locally for debugging; never send notes, unrelated chapters or personal progress automatically.
- Preserve the no-RAG operating mode and all offline learning paths.

## Balanced depth

- Each substantive section: objectives, concise explanation, worked example and independent task.
- Each exercise reference: original companion prompt, at least two hints and a rubric or deterministic check.
- Existing deep lessons remain the detailed path; new bespoke interactions are reserved for concepts where manipulation materially aids understanding.
- Chapter completion is reported only when its unclassified sections and remaining exercises both reach zero.

## Delivery

First add the compact validation and tutor-budget foundations, then finish Chapters 2–3 as the calibration batch. Convert Chapters 4–8, 9–13, 14–20 and appendices in reviewed ranges. Run a whole-book acceptance gate before closing tracking issue #7.

## Non-goals

- Publishing source exercise text or the PDF.
- Activating book RAG without the separate privacy/provisioning decision.
- Using AI-generated answers as independent mastery evidence.
- Claiming that the extracted count is an independent count of the book.
