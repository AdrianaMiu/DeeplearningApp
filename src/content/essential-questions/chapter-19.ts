import type { QuestionSeed } from '../question-helpers';

export const chapter19EssentialQuestionSeeds: QuestionSeed[] = [
  {
    id: 'q39', lessonId: 'hpo-experiment-design', type: 'multiple_choice',
    prompt: 'An HPO search repeatedly reads test loss to choose the next learning rate. What happens to the role of that test set?',
    options: ['It becomes part of configuration selection and loses its role as untouched final evaluation', 'It remains untouched because only hyperparameters change', 'A fixed training seed makes its repeated use unbiased'],
    answer: 'It becomes part of configuration selection and loses its role as untouched final evaluation',
    hints: ['Ask whether any information from that split influences the selected model.'],
    explanation: 'Test feedback now influences the selected configuration, so the score is no longer an independent final assessment. Validation should guide search; a reserved test set evaluates the frozen choice. Fixing random seeds does not prevent this leakage.',
  },
  {
    id: 'q40', lessonId: 'hpo-experiment-design', type: 'numeric',
    prompt: 'A configuration has validation losses 0.24, 0.21, and 0.27 under three predeclared training seeds on the same split at equal resource. What is its mean validation loss?',
    answer: 0.24, tolerance: 0.001,
    hints: ['Aggregate all three seed results rather than keeping only the smallest loss.'],
    explanation: 'The mean is (0.24+0.21+0.27)/3=0.72/3=0.24. The best seed score, 0.21, is not the mean performance. Repeating training seeds on one split does not measure uncertainty across different data splits.',
  },
  {
    id: 'q41', lessonId: 'hpo-experiment-design', type: 'debugging', application: true,
    prompt: 'A team claims an HPO improvement after selecting each configuration’s best seed and checking test accuracy after every trial. Design a replacement comparison and identify what the trial ledger must retain.',
    answer: 'Select configurations using a fixed validation split and a predeclared aggregate over the same training seeds and resource budget. Reserve fresh untouched test data for the frozen choice because the old test has guided selection. Retain configurations, seeds, split identity, resources, validation scores, and failed or stopped trial costs.',
    hints: ['Seed selection and reuse of test feedback create separate sources of optimistic results.'],
    rubric: ['Replaces best-seed selection with a predeclared aggregate over comparable repeated runs', 'Removes test feedback from selection and uses untouched data for final evaluation', 'Records configurations, seeds, split, scores, and compute including unsuccessful trials'],
    explanation: 'Keeping only a lucky seed and choosing with test feedback both bias the comparison. Comparable repetitions make training variation visible, validation supports selection, and untouched data assesses the final procedure. A complete ledger makes the claimed gain auditable against its compute cost.',
  },
  {
    id: 'q42', lessonId: 'asynchronous-multifidelity-hpo', type: 'multiple_choice',
    prompt: 'A random-search system launches another full-budget trial whenever a worker becomes free, and never prunes a running trial. Which description fits?',
    options: ['The searcher samples configurations; the scheduler runs them asynchronously without multi-fidelity pruning', 'The searcher stops weak trials at each rung, so this is successive halving', 'Asynchronous execution guarantees every early leader is best at full budget'],
    answer: 'The searcher samples configurations; the scheduler runs them asynchronously without multi-fidelity pruning',
    hints: ['Separate how configurations are chosen from when they run and how much resource they receive.'],
    explanation: 'Random search defines configuration proposals, while the scheduler coordinates workers. Starting the next trial on completion is asynchronous execution. Multi-fidelity allocation requires decisions based on partial resources; concurrency alone does not supply those decisions or guarantee final rankings.',
  },
  {
    id: 'q43', lessonId: 'asynchronous-multifidelity-hpo', type: 'numeric',
    prompt: 'Nine trials reach cumulative epoch 1, three survivors resume to epoch 3, and one survivor resumes to epoch 9. Ignoring overhead and assuming equal epoch costs, how many total trial-epochs are consumed?',
    answer: 21,
    hints: ['Survivors retain their checkpoints: promotion from epoch 1 to 3 adds two epochs, not three.'],
    explanation: 'Initial training costs 9×1=9, the first promotions add 3×(3−1)=6, and the final promotion adds 1×(9−3)=6, totaling 21. Adding the cumulative rung budgets would give 27 and double-count resumed work; 27 would instead describe restarting each rung from scratch.',
  },
  {
    id: 'q44', lessonId: 'asynchronous-multifidelity-hpo', type: 'debugging', application: true,
    prompt: 'A search report declares a fast architecture superior because it completes more trials and leads at epoch one. A slower architecture is pruned before its loss drops at epoch nine. Diagnose the claim and propose an evidence-based scheduling and compute comparison.',
    answer: 'Early rankings can reverse and asynchronous arrival favors available reports. Use pilot full-resource curves to assess pruning reliability and consider a longer grace period. Compare candidates at a common final resource and methods under matched hardware and budgets, recording all trial costs, total accelerator time, and wall time rather than completed-trial count alone.',
    hints: ['Distinguish early learning speed, final validation quality, and the actual cost of each epoch.'],
    rubric: ['Identifies ranking reversal and the risk of pruning slow starters from early or incomplete evidence', 'Proposes pilot learning-curve checks and a justified minimum resource or grace period', 'Compares quality at a common resource and accounts for all compute plus hardware and wall time'],
    explanation: 'Fast completion and early quality do not establish final quality. Pilot curves can expose unreliable partial rankings before aggressive pruning. Different architectures have different epoch costs, so fair claims require an explicit budget and ledger of all work, including discarded trials, alongside elapsed time.',
  },
];
