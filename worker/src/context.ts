import studioContexts from './studio-contexts.json';

export interface AllowedSourceRef {
  sectionId: string;
  printedStart: string;
  pdfPageStart: number;
}

export interface TutorContext {
  lessonId: string;
  conceptIds: string[];
  summary: string;
  sourceRefs: AllowedSourceRef[];
}

const ref = (sectionId: string, page: number): AllowedSourceRef => ({
  sectionId,
  printedStart: String(page),
  pdfPageStart: page + 40,
});

export const BOOK_SOURCE_HASH = '93316e525a034cfa935023c3c31196c86f5edfd0e056f50f09676f6364a0be56';

export const CONTENT_VERSION = 'd2l-companion-2026.11-v1';

export const tutorContexts: Record<string, TutorContext> = {
  'tensor-shapes': { lessonId: 'tensor-shapes', conceptIds: ['tensor-shape', 'indexing'], summary: 'Shape is a contract between axis meaning and axis length. Indexing a single position removes that axis; slicing preserves it.', sourceRefs: [ref('2.1.1', 30), ref('2.1.2', 33), ref('2.1.3', 34)] },
  broadcasting: { lessonId: 'broadcasting', conceptIds: ['broadcasting', 'tensor-shape'], summary: 'Broadcasting aligns axes from the right; dimensions must match or one must equal 1.', sourceRefs: [ref('2.1.4', 35), ref('2.1.5', 36), ref('2.1.6', 37)] },
  'data-preprocessing': { lessonId: 'data-preprocessing', conceptIds: ['preprocessing', 'data-leakage'], summary: 'Fit transformations on training data and apply the same learned mapping to validation and test data.', sourceRefs: [ref('2.2', 38)] },
  'linear-algebra-objects': { lessonId: 'linear-algebra-objects', conceptIds: ['linear-algebra', 'tensor-rank'], summary: 'Scalars, vectors, matrices, and tensors differ by axis count and meaning.', sourceRefs: [ref('2.3.1', 41), ref('2.3.2', 42), ref('2.3.3', 43), ref('2.3.4', 44)] },
  reductions: { lessonId: 'reductions', conceptIds: ['reduction', 'axis-reasoning'], summary: 'A reduction combines values along named axes; keepdim preserves reduced axes at size 1.', sourceRefs: [ref('2.3.5', 45), ref('2.3.6', 46), ref('2.3.7', 47)] },
  'products-and-norms': { lessonId: 'products-and-norms', conceptIds: ['dot-product', 'matrix-multiplication', 'norm'], summary: 'Elementwise, dot, and matrix products answer different shape and aggregation questions.', sourceRefs: [ref('2.3.8', 48), ref('2.3.9', 49), ref('2.3.10', 50), ref('2.3.11', 50)] },
  'derivatives-gradients': { lessonId: 'derivatives-gradients', conceptIds: ['derivative', 'gradient'], summary: 'Derivatives are local rates of change; gradients collect partial derivatives.', sourceRefs: [ref('2.4.1', 55), ref('2.4.2', 56), ref('2.4.3', 58)] },
  'chain-rule': { lessonId: 'chain-rule', conceptIds: ['chain-rule', 'computational-graph'], summary: 'Local sensitivities multiply along a path and add across paths that rejoin.', sourceRefs: [ref('2.4.4', 59)] },
  autodiff: { lessonId: 'autodiff', conceptIds: ['autodiff', 'detach'], summary: 'Reverse-mode autodiff records a computation graph; detach intentionally disconnects earlier operations.', sourceRefs: [ref('2.5', 60)] },
  'probability-expectation': { lessonId: 'probability-expectation', conceptIds: ['probability', 'expectation'], summary: 'An expectation is a probability-weighted average and need not be one possible outcome.', sourceRefs: [ref('2.6', 65)] },
  'linear-regression': { lessonId: 'linear-regression', conceptIds: ['linear-regression', 'squared-loss'], summary: 'Linear regression predicts Xw+b; mean squared error summarizes squared residuals.', sourceRefs: [ref('3.1.1', 83), ref('3.1.2', 88), ref('3.1.3', 88), ref('3.1.4', 90)] },
  'regression-training': { lessonId: 'regression-training', conceptIds: ['training-loop', 'synthetic-data'], summary: 'A complete training step clears gradients, predicts, computes loss, backpropagates, and updates parameters.', sourceRefs: [ref('3.3', 99), ref('3.4', 103)] },
  'gp-posterior-inference': {
    lessonId: 'gp-posterior-inference',
    conceptIds: ['gp-conditioning', 'covariance-blocks', 'observation-noise', 'latent-uncertainty'],
    summary: 'A GP conditions a joint Gaussian over training and test function values. With C=K_XX+noiseVariance*I, the posterior mean is m_*+K_*X solve(C,y-m_X), and latent covariance is K_**-K_*X solve(C,K_X*). Independent future observation noise adds noiseVariance*I to the latent test covariance without changing its mean. Training noise belongs on the training diagonal, not cross-covariances. Noisy conditioning need not interpolate targets. Use stable solves; covariance diagonals are variances, not standard deviations. Confidence is conditional on the kernel, noise model, and fixed hyperparameters.',
    sourceRefs: [ref('18.2.1', 839), ref('18.2.4', 842), ref('18.3.1', 846), ref('18.3.2', 847), ref('18.3.3', 848)],
  },
  'gp-regression-practice': {
    lessonId: 'gp-regression-practice',
    conceptIds: ['gp-regression', 'cholesky-solve', 'marginal-likelihood', 'kernel-diagnosis', 'numerical-jitter'],
    summary: 'Split data before fitting transforms. An RBF kernel uses positive length scale, signal variance, and observation-noise variance. Factor C=K_XX+noiseVariance*I as LL^T and use triangular solves rather than an explicit inverse. For r=y-m_X and alpha=solve(C,r), log marginal likelihood is -0.5*r^T*alpha-sum(log L_ii)-(n/2)*log(2*pi). Optimize it on training data, then inspect held-out errors, residuals, and separate latent/noisy intervals in target units. Small recorded diagonal jitter helps factorization; it is separate from learned measurement noise. Narrow bands can still miss a discontinuity. Dense exact factorization costs O(n^3) time and O(n^2) storage.',
    sourceRefs: [ref('18.2.4', 842), ref('18.3.2', 847), ref('18.3.3', 848), ref('18.3.4', 849)],
  },
  'hpo-experiment-design': {
    lessonId: 'hpo-experiment-design',
    conceptIds: ['hyperparameter-search', 'validation-isolation', 'random-seeds', 'experiment-budget'],
    summary: 'Declare the split, validation metric and direction, search distributions, seed policy, and compute budget before HPO. Fit preprocessing on training data only; select configurations on validation and evaluate the frozen choice on an untouched test set. Log-uniform sampling gives equal probability to equal multiplicative intervals for positive scale parameters. Keep search and training seeds separate; compare finalists by the mean over the same predeclared training seeds rather than the best seed. Log all trials, failures, consumed resource, and compute. Repeated seeds do not remove split uncertainty, validation overfitting, or leakage.',
    sourceRefs: [ref('19.1.1', 860), ref('19.1.2', 863), ref('19.2.4', 869), ref('19.2.6', 872)],
  },
  'asynchronous-multifidelity-hpo': {
    lessonId: 'asynchronous-multifidelity-hpo',
    conceptIds: ['searcher-scheduler', 'asynchronous-search', 'multi-fidelity', 'successive-halving', 'compute-accounting'],
    summary: 'A searcher proposes configurations; a scheduler assigns resources and continuation decisions. Asynchronous execution fills free workers without inherently pruning trials. Multi-fidelity methods use partial-resource scores; early rankings can discard slow starters. Successive halving with nine trials at cumulative epoch 1, three at 3, and one at 9 costs 9*1+3*(3-1)+1*(9-3)=21 trial-epochs when resumed, or 27 when restarted. Asynchronous promotion depends on comparable reports available at a rung and can depend on arrival order. Declare policy and grace period; check early versus final rankings. Count pruned work and overhead, and compare validation scores at common resource alongside wall time and accelerator time.',
    sourceRefs: [ref('19.2.1', 867), ref('19.2.2', 868), ref('19.3.2', 876), ref('19.4.1', 886), ref('19.5.2', 901)],
  },
  'gan-training-step': {
    lessonId: 'gan-training-step',
    conceptIds: ['adversarial-training', 'gradient-boundary', 'binary-cross-entropy'],
    summary: 'Use disjoint optimizers and alternating updates. Clear D gradients, compute real targets 1 and detached generated targets 0, then backpropagate 0.5*(mean BCE_real+mean BCE_fake) and step D. Clear G gradients, freeze D parameters, recompute G and a fresh D forward with updated weights, then backpropagate mean BCE with target 1 and step G; restore D gradients. Use BCEWithLogitsLoss on logits. Keep gradients through D into G during the G phase: no detach or no_grad. This non-saturating G objective differs from the original minimax objective. Check parameter changes per phase; loss alone cannot establish sample quality or diversity.',
    sourceRefs: [ref('20.1.2', 915), ref('20.1.3', 915), ref('20.1.4', 915)],
  },
  'dcgan-practice': {
    lessonId: 'dcgan-practice',
    conceptIds: ['dcgan', 'transposed-convolution', 'image-normalization', 'mode-collapse'],
    summary: 'A 64x64 RGB DCGAN maps latent (N,Z,1,1) to a 4x4 feature map, then grows 4->8->16->32->64 using transposed convolutions with kernel 4, stride 2, padding 1. With dilation 1 and output padding 0, H_out=(H_in-1)*stride-2*padding+kernel. Track channels separately. Hidden G blocks use batch normalization and ReLU, final RGB output tanh. Normalize real pixels to [-1,1]. D downsamples with strided convolutions and leaky ReLU to one logit per image for BCEWithLogitsLoss. Check shapes, ranges, fixed latent grids over checkpoints, and fresh-draw diversity. Plausible repeated images suggest mode collapse; a D mean near 0.5 does not rule it out.',
    sourceRefs: [ref('20.2.1', 918), ref('20.2.2', 919), ref('20.2.3', 921), ref('20.2.4', 923)],
  },
};

// Companion-authored snapshot; tests compare all twenty contexts with reviewed studios and source refs.
Object.assign(tutorContexts, studioContexts);
