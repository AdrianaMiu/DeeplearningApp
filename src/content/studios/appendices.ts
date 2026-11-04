import type { ChapterStudio } from '../../domain/types';
import { chapterLearningMap } from '../course-map';
import { companionSource } from '../source';

interface AppendixCard {
  sectionId: string;
  printedPage: number;
  title: string;
  objective: string;
  feedback: string;
}

const mathCards: AppendixCard[] = [
  { sectionId: 'A.1', printedPage: 927, title: 'Geometry and linear algebra', objective: 'Interpret a dot product as a geometric comparison.', feedback: 'For u=[1,0] and v=[0,2], u·v=0: these nonzero vectors are perpendicular. Compute their norms and explain why zero dot product does not mean either vector is zero.' },
  { sectionId: 'A.2', printedPage: 944, title: 'Eigendecompositions', objective: 'Identify an eigenvector and its scaling factor.', feedback: 'For diagonal matrix diag(3,1), vector [1,0] keeps its direction and scales by 3. Verify Av=λv, then test [1,1]; eigenvectors must be nonzero.' },
  { sectionId: 'A.3', printedPage: 954, title: 'Single-variable calculus', objective: 'Relate a derivative to local change.', feedback: 'For f(x)=x³, f′(2)=12. Predict f(2.01) with a tangent approximation, then compare with the exact value; the derivative predicts a local change, not the entire curve.' },
  { sectionId: 'A.4', printedPage: 966, title: 'Multivariable calculus', objective: 'Compute partial derivatives while holding other coordinates fixed.', feedback: 'For f(x,y)=x²+xy, the gradient at (1,2) is [4,1]. Check each coordinate separately and predict which positive unit-axis step gives the larger first-order increase.' },
  { sectionId: 'A.5', printedPage: 982, title: 'Integral calculus', objective: 'Interpret a definite integral as accumulated area.', feedback: 'The integral of 2x from 0 to 1 is 1, found from the antiderivative x². Explain how doubling the upper endpoint changes the area and why the answer is not simply doubled.' },
  { sectionId: 'A.6', printedPage: 992, title: 'Random variables', objective: 'Distinguish a random variable from a realized value.', feedback: 'A variable taking 0 and 2 with equal probability has expectation 1, although 1 is never observed. Compute its variance from the two squared deviations.' },
  { sectionId: 'A.7', printedPage: 1011, title: 'Maximum likelihood', objective: 'Choose a parameter that makes observed data more probable.', feedback: 'For three successes in four independent Bernoulli trials, likelihood is p³(1−p) for the observed ordered outcomes, maximized at p=0.75. Compare this with p=0.5; likelihood is a function of the parameter.' },
  { sectionId: 'A.8', printedPage: 1017, title: 'Distributions', objective: 'Choose a distribution that matches an outcome space.', feedback: 'A binary success indicator fits a Bernoulli model; a real-valued noisy measurement might use a normal model. Name the support of each and explain why a probability density can exceed 1 without being a probability mass.' },
  { sectionId: 'A.9', printedPage: 1032, title: 'Naive Bayes', objective: 'State the conditional independence assumption used in classification.', feedback: 'With equal class priors and two conditionally independent binary features, likelihoods 0.8 and 0.5 give score 0.5×0.8×0.5=0.2. Compare another class with likelihoods 0.4 and 0.5, then normalize the scores.' },
  { sectionId: 'A.10', printedPage: 1039, title: 'Statistics', objective: 'Separate a sample estimate from a population quantity.', feedback: 'The sample mean of [1,3,5] is 3, but another sample may give a different mean. Describe how repeated sampling reveals uncertainty and why a single point estimate does not express it.' },
  { sectionId: 'A.11', printedPage: 1051, title: 'Information theory', objective: 'Compute discrete entropy and specify its logarithm base.', feedback: 'A fair binary outcome has entropy −2×0.5×log₂(0.5)=1 bit. A certain outcome has entropy 0. Compare uncertainty before looking at outcomes, and distinguish entropy from the surprise of one observation.' },
];

const toolCards: AppendixCard[] = [
  { sectionId: 'B.1', printedPage: 1068, title: 'Jupyter notebooks', objective: 'Make notebook execution order reproducible.', feedback: 'A cell that reads x depends on the cell that defines x. Restart the kernel and run the notebook from the top to expose hidden state; record environment versions with the experiment.' },
  { sectionId: 'B.2', printedPage: 1073, title: 'Amazon SageMaker', objective: 'Identify the compute, environment, and storage needed for a hosted notebook.', feedback: 'Before a hosted run, separate notebook files from the compute session and identify where outputs persist. Sketch an experiment setup and teardown sequence; consult current service documentation before applying the book’s historical interface steps.' },
  { sectionId: 'B.3', printedPage: 1076, title: 'AWS EC2 instances', objective: 'Distinguish an instance, its environment, and persistent experiment artifacts.', feedback: 'A remote instance supplies compute, but an experiment still needs code, dependencies, data access, and output storage. List those four pieces and how you would recover results after ending a session; verify current service instructions before provisioning.' },
  { sectionId: 'B.4', printedPage: 1085, title: 'Google Colab', objective: 'Plan for a notebook runtime that may be reset.', feedback: 'Keep data preparation reproducible and save needed outputs outside temporary runtime storage. Identify which cells rebuild dependencies after a reset; accelerator availability and interface steps require current documentation.' },
  { sectionId: 'B.5', printedPage: 1086, title: 'Servers and GPUs', objective: 'Estimate memory needs before selecting compute.', feedback: 'One float32 tensor with shape (2,3,4) contains 24 values and needs 96 bytes of raw storage. Training also needs parameters, gradients, optimizer state, and intermediate activations; a tensor-only estimate is a lower bound.' },
  { sectionId: 'B.6', printedPage: 1090, title: 'Contributing to the book', objective: 'Describe a focused and reproducible contribution.', feedback: 'For a suspected shape error, prepare a minimal input, expected shape, observed shape, and environment. Explain how a small proposed change would resolve it, then follow the project’s current contribution process.' },
  { sectionId: 'B.7', printedPage: 1095, title: 'Utility functions and classes', objective: 'Inspect the contract of a reusable training helper.', feedback: 'A helper can hide batching, loss reduction, or plotting state. Before reuse, identify its inputs, outputs, and side effects, then trace one tiny batch to check your understanding.' },
  { sectionId: 'B.8', printedPage: 1108, title: 'The d2l API', objective: 'Use API documentation to resolve a concrete calling question.', feedback: 'Find the documented signature of a helper before copying a call. Record its required arguments, defaults, return value, and package version, then design a minimal example that verifies those expectations.' },
];

function coverageFields(chapterId: 'appendix-a' | 'appendix-b', cards: AppendixCard[]) {
  return {
    chapterId,
    milestoneId: chapterLearningMap.get(chapterId)!.milestoneId,
    sourceRefs: cards.map((card) => companionSource(card.sectionId, card.printedPage)),
    sectionCoverage: cards.map((card) => ({ sectionId: card.sectionId, objective: card.objective, depth: 'introduced' as const })),
    interaction: {
      kind: 'decision-canvas' as const,
      title: 'Choose a section card',
      instruction: 'Select any section to reveal its small example and practice prompt. Each card is an introduction, not a claim of full section mastery.',
      prompt: 'Which topic would you like to revisit?',
      options: cards.map((card) => ({ id: card.sectionId, label: `${card.sectionId} · ${card.title}`, feedback: card.feedback })),
    },
  };
}

export const appendixStudios: ChapterStudio[] = [
  {
    ...coverageFields('appendix-a', mathCards),
    kind: 'chapter-studio', id: 'math-appendix-studio', title: 'Connect the mathematical toolkit',
    question: 'Which mathematical tool explains the computation or uncertainty in front of you?',
    purpose: 'Revisit every mathematics appendix section through a selectable example and focused objective.',
    capability: 'Choose and apply a relevant algebra, calculus, probability, or information tool to a small problem.',
    objectives: ['Explain an eigenvector with a concrete calculation.', 'Connect derivatives, expectations, and likelihoods to model reasoning.', 'Locate a practice card for each section A.1–A.11.'],
    prerequisites: ['Tensor and linear algebra lessons', 'Derivative and probability lessons'],
    conceptIds: ['mathematical-toolkit', 'eigendecomposition', 'statistical-reasoning'],
    views: {
      intuition: 'Mathematical tools answer different questions: geometry compares directions, calculus measures change, and probability describes uncertain outcomes. Choose the question before choosing a formula.',
      math: 'An eigenpair satisfies Av=λv for nonzero v. For A=diag(3,1), [1,0] is an eigenvector with eigenvalue 3. Calculus, expectations, and entropy provide complementary tools rather than interchangeable operations.',
      code: 'Use tiny arrays and hand-computed results to check a mathematical operation before scaling it up. For stochastic experiments, fix the random seed and compare sample estimates with analytic values.',
      workConnection: 'When debugging a model, distinguish a shape problem, a derivative problem, and a statistical assumption. The relevant appendix card gives a small example for testing that distinction.',
    },
    predictionPrompt: 'Does multiplying [1,1] by diag(3,1) preserve its direction? Predict before comparing it with [1,0].',
    workedExample: 'diag(3,1)[1,0]=[3,0]=3[1,0], but diag(3,1)[1,1]=[3,1] is not a scalar multiple of [1,1]. Only the first vector is an eigenvector here.',
    independentTask: 'Choose one algebra card, one calculus card, and one probability or statistics card. Solve the small prompt in each and describe a modeling situation where that tool is useful.',
    misconceptions: ['An eigenvector must be nonzero.', 'A sample estimate and a population quantity are not identical.', 'A short coverage card introduces a section; it does not establish mastery of every result in it.'],
    teachBackPrompt: 'Explain one card from A.1–A.11 in your own words and connect it to a model you have studied.',
    chapterCheckQuestionIds: ['studio-a-q1', 'studio-a-q2', 'studio-a-q3', 'studio-a-q4'], contentStatus: 'reviewed', durationMinutes: 45,
  },
  {
    ...coverageFields('appendix-b', toolCards),
    kind: 'chapter-studio', id: 'tools-appendix-studio', title: 'Make an experiment reproducible',
    question: 'What must be recorded so another person can run the same experiment?',
    purpose: 'Cover every tools appendix section with a practical workflow decision.',
    capability: 'Plan notebook execution, compute, artifact storage, and helper use for a reproducible experiment.',
    objectives: ['Identify hidden notebook state.', 'Separate compute lifetime from saved artifacts.', 'Locate a practice card for each section B.1–B.8.'],
    prerequisites: ['Basic Python execution', 'Training-loop lesson'],
    conceptIds: ['notebook-workflow', 'compute-resources', 'reproducibility'],
    views: {
      intuition: 'An experiment is more than a notebook file: its environment, data, execution order, and saved outputs all affect whether it can be reproduced. Local and hosted tools share these needs.',
      math: 'Raw tensor memory equals element count times bytes per element. A float32 tensor of shape (2,3,4) occupies 2×3×4×4=96 bytes before framework overhead or training state.',
      code: 'Restart and run a notebook in order, record dependency versions and seeds, and save the configuration with outputs. Inspect helper signatures rather than relying on state from previous sessions.',
      workConnection: 'A teammate should be able to identify the data version, environment, and run configuration from the saved experiment. Compute can be temporary while required results remain recoverable.',
    },
    predictionPrompt: 'Will a notebook necessarily run after a fresh kernel restart if every visible cell currently shows a successful result?',
    workedExample: 'Cell 2 reads a variable created by an earlier interactive command that is no longer in the notebook. Existing output looks correct, but a restart removes that variable; adding an explicit setup cell makes the dependency visible.',
    independentTask: 'Write a short run checklist covering setup, ordered execution, input version, output storage, and resource teardown. Select the relevant B.1–B.8 cards to justify each step.',
    misconceptions: ['Saved cell output does not prove that a notebook runs from a clean kernel.', 'Ending a compute session does not by itself describe where artifacts were saved.'],
    teachBackPrompt: 'Explain how you would hand an experiment to a teammate so they can reproduce it after a runtime reset.',
    chapterCheckQuestionIds: ['studio-b-q1', 'studio-b-q2', 'studio-b-q3', 'studio-b-q4'], contentStatus: 'reviewed', durationMinutes: 40,
  },
];
