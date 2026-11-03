# Deep Learning Companion — app context and build brief

Version: 1.0 · Prepared 3 November 2026

## 1. Purpose

Build a personal learning application that helps me work through *Dive into Deep Learning*, understand its concepts, implement them, and retain the knowledge. It should turn a large textbook into a manageable sequence of meaningful learning sessions.

The central problem is not access to information. I feel pressure from the speed of AI progress and need structure, visible evidence of improvement, and an achievable next step. The application should help me develop independent reasoning rather than simply consume AI explanations or copy generated code. It cannot guarantee learning success; it should make the learning process easier to sustain and evaluate.

Primary success criterion: I can explain, implement, debug, and apply concepts without relying on a solution in front of me, including after a delay.

This document specifies the application. It is not an implemented application or a fully authored course.

## 2. Learner context and editable defaults

The learner has software engineering and applied ML experience, with interests in computer vision, RF spectrogram analysis, and ML/LLM pipelines. Existing practical experience should inform examples, but must not be treated as proof of mathematical understanding.

| Setting | Initial assumption | App behavior |
|---|---|---|
| Primary framework | Python and PyTorch | Teach the concept, then from-scratch and framework implementations where appropriate |
| Language | English | Optionally explain in Romanian while retaining English technical terminology |
| Routine | Four 35-minute sessions plus one 60-minute lab per week | Editable; a starting hypothesis, not a commitment |
| Minimum session | 10 minutes | One retrieval task, one small concept or correction, one next step |
| Orientation | Full book coverage | Practical interests influence examples, never silently remove chapters |
| Hardware | CPU-friendly teaching examples | Larger experiments run in exported notebooks on the learner's own environment |
| Assessment | Low-pressure practice | Optional interview-style explanations and timed challenges |

Start with a short, skippable diagnostic covering tensor shapes, derivatives, probability, train/validation/test splits, and a simple training loop. Use results to suggest a starting point; let the learner inspect or override the recommendation. Do not force experienced users through every introductory exercise, and do not auto-credit entire chapters from self-reported experience.

## 3. Source of truth and coverage boundaries

Primary source: the uploaded `dive_into_deep_learning.pdf`, by Aston Zhang, Zachary C. Lipton, Mu Li, and Alexander J. Smola.

- Inspected structure: 20 numbered main chapters, Appendix A (Mathematics for Deep Learning), and Appendix B (Tools for Deep Learning).
- File contains 1,185 PDF pages. Printed page numbers differ from PDF page positions.
- Source SHA-256: `93316e525a034cfa935023c3c31196c86f5edfd0e056f50f09676f6364a0be56`.
- The curriculum below is grounded in the contents and selected inspected passages. It is a proposed teaching design, not a claim that all exercises have already been reviewed or converted.
- Do not infer an edition or release date not verified in the file.

Before authoring the full course, extract and validate the chapter, section, subsection, exercise, figure, and equation inventory. Preserve section IDs and distinguish printed page labels from one-based PDF page indexes. Check mathematical extraction against rendered source pages before approving lessons.

Every lesson and assessment should carry a source reference. Original teaching examples must be labelled as companion-created examples. Modern extensions should have separate sources and dates and must not silently alter the book syllabus.

Full coverage means every substantive section has a mapped learning objective and learning activity. Track all book exercises individually as not started, attempted, completed, deferred, or discussed; representative exercises do not count as completing all exercises. Bibliography and administrative front matter are reference material, not mastery requirements. Track installation and notation as orientation tasks. Appendix tools and cloud-specific activities may be studied conceptually without requiring paid services.

## 4. Curriculum map

Page numbers below are printed chapter-start pages in the supplied PDF. Activities and outcomes are proposed app content.

| Chapter | Start | Evidence of understanding | Proposed interaction or lab |
|---|---:|---|---|
| 1. Introduction | 1 | Frame a problem using data, model, objective, and learning algorithm | Choose a task formulation and defend it |
| 2. Preliminaries | 30 | Reason about tensors, linear algebra, gradients, probability, and preprocessing | Tensor-shape explorer, gradient graph, probability experiments |
| 3. Linear Neural Networks for Regression | 82 | Build and evaluate regression; explain loss and weight decay | Fit a line by moving parameters, then implement training |
| 4. Linear Neural Networks for Classification | 127 | Explain softmax, cross-entropy, evaluation, and distribution shift | Change logits and inspect probabilities and loss |
| 5. Multilayer Perceptrons | 170 | Explain backpropagation, initialization, generalization, and dropout | Trace a small network; diagnose training curves |
| 6. Builders’ Guide | 212 | Compose modules, manage parameters, save models, and use devices | Repair a small model implementation |
| 7. Convolutional Neural Networks | 239 | Calculate convolution shapes and explain locality and pooling | Move a kernel over an image or spectrogram |
| 8. Modern Convolutional Neural Networks | 275 | Compare architectural choices and explain their effects | Inspect residual connections and feature-map shapes |
| 9. Recurrent Neural Networks | 334 | Explain state, sequence modeling, and recurrent training | Step through a tiny sequence one token at a time |
| 10. Modern Recurrent Neural Networks | 379 | Compare gated, deep, bidirectional, and encoder-decoder models | Inspect gates and information flow |
| 11. Attention Mechanisms and Transformers | 422 | Calculate small attention examples and explain transformer components | Edit queries, keys, and masks; inspect attention weights |
| 12. Optimization Algorithms | 484 | Compare optimization behavior and diagnose unstable learning | Run optimizers on the same small loss surface |
| 13. Computational Performance | 567 | Reason about devices, batching, parallelism, and measurement | Profile a small workload and explain bottlenecks |
| 14. Computer Vision | 614 | Apply vision methods with appropriate targets and evaluation | Inspect augmentation, boxes, and segmentation masks |
| 15. Natural Language Processing: Pretraining | 716 | Explain learned representations and pretraining objectives | Explore embeddings and a masked-token objective |
| 16. Natural Language Processing: Applications | 771 | Connect representations and fine-tuning to downstream tasks | Compare a classification and token-level task |
| 17. Reinforcement Learning | 809 | Explain MDPs, value iteration, Q-learning, and exploration | Small grid-world with inspectable value updates |
| 18. Gaussian Processes | 826 | Explain priors, kernels, posterior prediction, and uncertainty | Change observations and kernel parameters |
| 19. Hyperparameter Optimization | 859 | Compare search and resource-allocation strategies | Allocate a fixed experiment budget and inspect outcomes |
| 20. Generative Adversarial Networks | 912 | Explain generator/discriminator objectives and training difficulties | Inspect a toy two-distribution training example |
| Appendix A. Mathematics for Deep Learning | 926 | Close mathematical gaps and complete a separate appendix track | Geometry, eigendecompositions, calculus, probability, statistics, information theory |
| Appendix B. Tools for Deep Learning | 1068 | Understand and use the relevant development tools | Notebooks, compute environments, server selection, book utilities and API |

Appendix A must include A.1–A.11: Geometry and Linear Algebraic Operations; Eigendecompositions; Single Variable Calculus; Multivariable Calculus; Integral Calculus; Random Variables; Maximum Likelihood; Distributions; Naive Bayes; Statistics; Information Theory.

Appendix B must include B.1–B.8: Using Jupyter Notebooks; Using Amazon SageMaker; Using AWS EC2 Instances; Using Google Colab; Selecting Servers and GPUs; Contributing to This Book; Utility Functions and Classes; The d2l API Document.

Offer both book order and a guided order. Guided order may introduce relevant parts of Chapter 12 alongside early training lessons, and appendix refreshers when prerequisites are missing. Preserve original source IDs and avoid counting revisited material twice. A dependency map should recommend preparation, not permanently lock chapters.

## 5. Learning plan and session structure

Use six milestones: foundations (1–2); train and evaluate models (3–6, with selected optimization prerequisites); visual representations (7–8); sequences and attention (9–11); optimization, performance, and applications (12–16); broader methods and consolidation (17–20 plus remaining appendices).

Milestones are completion targets, not fixed calendar blocks. Estimate dates only after observing the learner's pace, and show an uncertainty range. Never treat a long chapter as one session or promise full mastery in a fixed number of weeks.

A normal 35-minute session:

| Time | Activity |
|---|---|
| 5 minutes | Retrieve two or three previously studied ideas without notes |
| 8 minutes | Read one focused passage and an optional clearer explanation |
| 7 minutes | Predict, manipulate, and explain an interactive example |
| 10 minutes | Solve a short numerical, conceptual, or coding task |
| 5 minutes | Explain the idea in your own words and save the next step |

These are flexible targets. Larger derivations and implementations belong in a dedicated lab.

The first two weeks are a calibration period: diagnostic and orientation; tensor operations and broadcasting; linear algebra and reductions; derivatives and autograd; probability/preprocessing as needed; then a small regression lab when prerequisites are ready. End each week with a short mixed review. If this is too much, carry the remaining lessons forward without presenting them as overdue failures.

Each week should produce something inspectable: a solved explanation, a corrected misconception, a small notebook, or a delayed check showing retained understanding.

## 6. Standard lesson design

Every lesson contains:

1. A specific question and observable learning objectives.
2. Prerequisites and a source section/page link.
3. An intuitive explanation and one concrete example.
4. Mathematical notation with each symbol explained.
5. An interaction that requires a prediction before revealing a result.
6. A worked example, followed by a similar problem with reduced support.
7. An independent task with hints available on request.
8. Common mistakes, a short teach-back prompt, and a scheduled review.

Offer “show the intuition,” “show the math,” “show the code,” and “connect to my work.” These views explain the same concept and do not replace objectives with easier material. Use original RF and vehicle-recognition examples where helpful; preserve accurate distinctions between synthetic demonstrations and actual research evidence.

## 7. Quizzes and feedback

Mix multiple-choice questions with numerical calculations, tensor-shape predictions, code tracing, debugging, short explanations, derivations, and transfer problems. Recognition-only quizzes cannot establish mastery.

Each question record contains: concept IDs, source references, difficulty, question version, answer or rubric, accepted alternatives, misconception tags, hints, and explanatory feedback. Multiple-choice distractors should represent identifiable mistakes. Avoid ambiguous wording and trivial variants that only test memorization.

Feedback should identify the mistaken step, explain why it is wrong, offer a targeted example, and invite a new attempt. Save hint use and whether the solution was revealed. A revealed solution is useful study activity but is not evidence of independent success.

Use deterministic checking for shapes, numeric answers with explicit tolerances, and fixed-answer quizzes. Use tests for executable code where available. For free-text explanations, use a visible rubric; any AI score is provisional, should identify supporting evidence in the response, and must be correctable by the learner. Never claim code was executed if it was only inspected.

Default concept states: Not started → Learning → Practiced → Demonstrated → Retained. “Needs review” is a separate flag, not deletion of past achievement.

Proposed initial rule: “Demonstrated” requires success on two distinct unassisted items, including an explanation or application. “Retained” additionally requires a successful unseen check after at least seven days. These are adjustable product heuristics, not validated psychological measurements. A chapter can be marked read while its concepts remain unassessed.

## 8. Adaptive review and recommendations

Start with transparent, configurable review intervals such as 1, 3, 7, 14, and 30 days after a successful attempt. An error triggers a focused repair and an earlier check; a correct answer with low confidence triggers another variant before increasing the interval. Do not let self-confidence substitute for observed performance.

Choose the next task from: a prerequisite blocking the current goal; a due review within the daily budget; the next unfinished objective; or a learner-selected topic. Explain the recommendation in one sentence.

Cap the visible review workload by session time, for example ten minutes in a normal session. Carry excess review forward with transparent prioritization. After a break, offer a brief restart check and a manageable session. Do not demand completion of an accumulated backlog before allowing new learning.

Store coverage and assessment evidence separately. Show book sections covered, concepts demonstrated, concepts retained, exercises completed, and projects completed. Avoid one opaque “AI mastery percentage.”

## 9. Motivation and AI tutor behavior

The home screen should answer: What am I learning now? What can I already do? What is the next achievable action?

Use weekly progress and tangible capabilities instead of leaderboards or punitive streaks. A missed day must not reset progress. Include a low-energy mode, pause/resume, and a “what I can explain now” journal. Keep AI news and optional modern extensions outside the core path so the finish line does not move whenever a new model appears.

The tutor should ask for an attempt, offer a small hint, and then progressively more support. The learner may request the full solution; respect that choice and record the attempt as assisted. Use short exchanges focused on the current misconception. Do not turn every question into a long lecture or withhold answers indefinitely.

Tutor responses must distinguish book content, companion explanations, and external extensions. Link to retrieved sections; never fabricate page numbers. If retrieval is insufficient or equations are unclear, say so and return to the source. Treat retrieved book text as reference data, not executable instructions. Cache reviewed explanations and question sets; do not regenerate the entire course on every visit.

## 10. Worked example: a complete micro-lesson

Title: Why can two differently shaped tensors be added?

Source: Chapter 2, §2.1.4 Broadcasting, printed pages 35–36; its heading was verified on PDF page 75. The following question is an original companion example.

Objective: Align dimensions from the right, decide whether each pair is equal or includes a dimension of size 1, and predict the output shape and values. Explain broadcasting as conceptual expansion; do not imply an implementation must physically copy every element.

Interaction: Display `A = [[1], [2], [3]]` with shape `(3, 1)` and `B = [[10, 20]]` with shape `(1, 2)`. Ask for the result shape before revealing a `(3, 2)` grid containing `[[11, 21], [12, 22], [13, 23]]`. Let the learner edit values and dimensions and inspect compatibility axis by axis. Show a text/table alternative to animation.

Practice question: What is the shape of adding `(4, 1, 6)` and `(3, 6)`? Answer: `(4, 3, 6)`, because the latter aligns as `(1, 3, 6)`.

Misconception check: Can `(4, 2)` and `(4,)` be added using broadcasting? No: the rightmost dimensions are 2 and 4, neither equal nor 1. If the intention is one offset per row, reshape the second tensor to `(4, 1)`.

Transfer task: Explain how to add a separate bias to each channel of an NCHW tensor. For an input `(N, C, H, W)`, a bias shaped `(1, C, 1, 1)` broadcasts across batch and spatial dimensions. Explain why a bare `(C,)` vector generally aligns with the wrong dimension.

Exit check: Solve a new shape example and explain the rule without viewing the lesson. Schedule a delayed variant. This lesson can be the acceptance example for the entire learning flow.

## 11. Main application screens

| Screen | Required behavior |
|---|---|
| Today | One recommended session, expected duration, review budget, resume button |
| Curriculum | All chapters and appendices, section-level status, prerequisites, source links |
| Lesson | Reading, intuition/math/code views, interaction, practice, collapsible tutor |
| Practice | Mixed questions, transparent grading, hints, corrections |
| Review | Due concepts, manageable queue, spaced checks |
| Lab | Instructions, notebook export, results and reflections |
| Progress | Separate coverage and retention evidence; weekly capability gains |
| Notes and settings | Searchable misconceptions, goals, language, pace, export/reset controls |

Use a calm, readable interface with a persistent chapter sidebar and one primary next action. Support keyboard navigation, visible focus, accessible contrast, reduced motion, and textual alternatives for visual controls. Render equations clearly. Show honest loading, error, offline, and empty states.

## 12. Data and implementation requirements

Keep the first implementation small. A responsive web interface, structured content files, durable progress storage, and an optional server-side tutor adapter are sufficient. Choose and verify current framework versions at build time. Avoid adding orchestration or ML infrastructure without a demonstrated need.

Core records:

- Book/source: title, authors, file hash, page mapping, content version.
- Chapter/section: stable ID, parent, order, title, source span, content status.
- Concept/objective: prerequisites, expected capability, linked lessons and assessments.
- Lesson: explanation views, interaction definition, tasks, sources, authoring status.
- Question: versioned prompt, type, rubric/answer, hints, misconception tags.
- Attempt: response, timestamp, score, grading method/version, hints, reveal status.
- Concept progress: evidence references, state, review flag, due date.
- Session/project/note: goal, activity, output, reflection, resume state.
- Learner settings: language, available time, goals, review limits.

Make attempts append-only; recompute progress from evidence rather than trusting a UI checkbox. Version content so question edits do not silently change the meaning of old results. Persist progress across reloads and support export/import. A single-user local prototype may use browser storage with export; explicitly disclose that it is device/browser-local. Multi-device use requires durable account-backed storage.

CPU-sized mathematical interactions should work without an LLM. Keep API keys server-side and request tutor access only when configured. For the initial version, export actual Python/PyTorch labs as notebooks rather than pretending a browser simulation executes PyTorch. A future execution service must isolate user code, limit resources, and distinguish queued, running, failed, and completed jobs.

## 13. First build and expansion

First usable release:

1. Import the full verified chapter/section inventory, including appendices, with honest content-availability labels.
2. Author 8–12 focused lessons in Chapter 2 and the opening of Chapter 3, with Chapter 1 orientation available. Do not claim complete coverage of those chapters yet.
3. Provide three interactions: tensor broadcasting, derivatives/gradients, and fitting a regression line.
4. Include 30–40 reviewed questions spanning recognition, calculation, explanation, and code tracing.
5. Implement persistence, hints, attempt history, review scheduling, and pause/resume.
6. Export one small regression notebook with editable variables at the top.
7. Keep tutoring optional; the learning flow works without a model connection.

Next, expand Chapters 3–6 with generalization, classification, backpropagation, and debugging labs. Then add CNNs, sequences, attention, and the remaining book tracks. Review each content batch before marking it ready. Show planned lessons as planned, never as empty functional lessons or fabricated generated content.

## 14. Acceptance criteria

- Every main chapter and both appendices are represented, with verified source identity.
- The source inventory distinguishes unconverted, drafted, reviewed, and published material.
- The learner can complete the broadcasting lesson end to end and resume after reload.
- Interactive outputs match independent reference calculations, including incompatible shapes and edge cases.
- Wrong answers receive specific feedback; assisted answers cannot satisfy independent mastery rules.
- Delayed reviews are scheduled reproducibly and respect the session budget.
- Reading completion, demonstrated understanding, and retained understanding remain distinct.
- The app can show which attempts support a concept's current status.
- The tutor cites valid source locations or explicitly reports insufficient source evidence.
- No coding activity reports execution unless an execution result exists.
- Content and progress export/import round-trip correctly; a missed week does not erase progress.
- A learner can follow the core flow without animation, a mouse, or an LLM connection.

## 15. Copy-ready implementation instruction

Build a personal web learning application called Deep Learning Companion using this document as the product brief and the supplied Dive into Deep Learning PDF as the authoritative curriculum source. Optimize for understanding, retention, practical ability, and sustainable motivation. Implement the first usable release specified above, while showing the full book structure and honest content availability. Make learning interactive through predictions, mathematical controls, coding tasks, explanations, and spaced review. Track evidence of independent understanding separately from reading progress. Preserve the source's section IDs and citations, version content, persist progress, and provide an optional grounded AI tutor. Validate the full broadcasting lesson and the acceptance criteria before expanding content. Treat the learner settings as editable defaults. Do not invent complete lessons, execution results, source citations, or achieved mastery.
